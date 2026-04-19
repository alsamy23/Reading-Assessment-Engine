import { GoogleGenerativeAI } from "@google/generative-ai";
import { calculateIELTSBand } from './assessmentService';
import type { AssessmentResult } from './assessmentService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface AIAnalysisRequest {
  originalText: string;
  transcription: string;
  audioBase64?: string;
  grade: string;
}

// ─── Local fallback: score based on browser transcription ───────────────────
const simulateFeedback = (transcription: string, originalText: string): Partial<AssessmentResult> => {
  const orig = originalText.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  const said = transcription.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);

  if (said.length === 0) {
    return {
      score: { fluency: 1, lexicalResource: 1, grammar: 1, pronunciation: 1, total: 4, band: 3.0 },
      feedback: [
        "No speech was detected. Please ensure your microphone is working and try again.",
        "Speak clearly and at a steady pace while reading the passage.",
        "Make sure to read every sentence from start to finish.",
        "Practice reading aloud daily to build confidence."
      ],
      recommendation: "Try again in a quiet room with your microphone working properly."
    };
  }

  const matched = said.filter(w => orig.includes(w)).length;
  const accuracy = orig.length > 0 ? matched / orig.length : 0;
  const coverage = Math.min(1, said.length / orig.length);

  const fluency = coverage > 0.9 ? 4 : coverage > 0.7 ? 3 : coverage > 0.4 ? 2 : 1;
  const pronunciation = accuracy > 0.85 ? 4 : accuracy > 0.65 ? 3 : accuracy > 0.4 ? 2 : 1;
  const lexicalResource = accuracy > 0.8 ? 4 : accuracy > 0.6 ? 3 : 2;
  const grammar = accuracy > 0.75 ? 4 : accuracy > 0.55 ? 3 : 2;
  const total = fluency + lexicalResource + grammar + pronunciation;
  const band = calculateIELTSBand(total);

  const feedback: string[] = [];
  if (fluency < 3) feedback.push("Try to read more smoothly without long pauses between words.");
  if (pronunciation < 3) feedback.push("Focus on pronouncing each word clearly, especially at the end of sentences.");
  if (lexicalResource < 3) feedback.push("Make sure to read all the words in the passage, not just key ones.");
  if (grammar < 3) feedback.push("Pay attention to sentence endings and punctuation while reading.");
  if (feedback.length === 0) feedback.push("Excellent reading! Your pace and accuracy were very good.");

  const recommendation =
    band >= 7.5 ? "Challenge yourself with more complex passages." :
    band >= 6.0 ? "Practice reading longer passages aloud to improve further." :
    band >= 4.0 ? "Read simple texts every day to build fluency and confidence." :
    "Start with short, simple sentences and practice until comfortable.";

  return { score: { fluency, lexicalResource, grammar, pronunciation, total, band }, feedback, recommendation };
};

export const analyzeReadingWithAI = async (request: AIAnalysisRequest): Promise<Partial<AssessmentResult>> => {
  if (!genAI) {
    // No Gemini key: use local scoring based on browser transcription
    return simulateFeedback(request.transcription, request.originalText);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const promptParts: any[] = [
      {
        text: `
You are an IELTS Speaking examiner assessing a student reading a passage aloud.

PASSAGE: "${request.originalText}"
GRADE/LEVEL: ${request.grade}
BROWSER TRANSCRIPTION (what the student said): "${request.transcription || '(not available)'}"

Listen to the audio recording and evaluate the student's reading. Compare the audio against the passage.
Score on 4 criteria (0–4 each):
1. Fluency & Coherence — steady pace, no long pauses, natural flow
2. Lexical Resource — reads all words accurately
3. Grammatical Range — reads sentences correctly with proper intonation
4. Pronunciation — clear articulation, correct word stress

Return ONLY valid JSON (no markdown, no extra text):
{
  "score": { "fluency": number, "lexicalResource": number, "grammar": number, "pronunciation": number },
  "feedback": ["tip1", "tip2", "tip3", "tip4"],
  "recommendation": "one actionable sentence"
}
        `
      }
    ];

    if (request.audioBase64) {
      promptParts.push({ inlineData: { data: request.audioBase64, mimeType: "audio/webm" } });
    }

    const result = await model.generateContent(promptParts);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini Analysis Error:", err);
    // Fall back to local scoring
    return simulateFeedback(request.transcription, request.originalText);
  }
};

// ─── Passage-aware question generation ─────────────────────────────────────
const generateQuestionsLocally = (text: string): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const questions: string[] = [];

  // Q1: Main idea
  questions.push(`What is the main topic of this passage about "${sentences[0].trim().slice(0, 40)}..."?`);

  // Q2: Detail from sentence 2 or 3
  if (sentences.length >= 2) {
    const src = sentences[1].trim();
    const words = src.replace(/[^a-zA-Z\s]/g, '').split(' ').filter(w => w.length > 4);
    const keyword = words[Math.floor(words.length / 2)] || words[0] || 'it';
    questions.push(`According to the passage, what do you learn about "${keyword}"?`);
  }

  // Q3: Personal connection
  questions.push(`Can you describe one fact from this passage in your own words?`);

  // Q4: From last sentence
  if (sentences.length >= 3) {
    const last = sentences[sentences.length - 1].trim();
    questions.push(`The passage ends with: "${last.slice(0, 60)}..." — what does this tell us?`);
  } else {
    questions.push(`Why do you think this topic is important?`);
  }

  return questions;
};

export const generateComprehensionQuestionsLocal = async (text: string, grade: string): Promise<string[]> => {
  if (!genAI) {
    // Local generation — passage-specific, not generic
    return generateQuestionsLocally(text);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
Based EXCLUSIVELY on this reading passage, generate 4 comprehension questions for a ${grade} student.
Each question must reference specific content, facts, or details from the passage.
Do NOT generate generic questions. Make each question answerable only by reading this specific text.

PASSAGE: "${text}"

Return ONLY a JSON array of 4 question strings. No markdown, no extra text.
Example format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?"]
    `;

    const result = await model.generateContent(prompt);
    const jsonText = result.response.text().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return generateQuestionsLocally(text);
  } catch (err) {
    console.error("Gemini Question Generation Error:", err);
    return generateQuestionsLocally(text);
  }
};
