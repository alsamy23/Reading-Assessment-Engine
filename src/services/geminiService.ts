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

const localScore = (transcript: string, original: string): Partial<AssessmentResult> => {
  const clean = (t: string) => t.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
  const orig = clean(original);
  const said = clean(transcript);
  if (!said.length) {
    return {
      score: { fluency: 1, lexicalResource: 1, grammar: 1, pronunciation: 1, total: 4, band: 3.0 },
      feedback: ['No speech detected. Please check your microphone and try again.', 'Speak clearly and at a steady pace.', 'Read every sentence from start to finish.'],
      recommendation: 'Try again in a quiet room with your microphone working properly.'
    };
  }
  const matched = said.filter(w => orig.includes(w)).length;
  const acc = orig.length ? matched / orig.length : 0;
  const cov = Math.min(1, said.length / orig.length);
  const fluency = cov > 0.9 ? 4 : cov > 0.7 ? 3 : cov > 0.4 ? 2 : 1;
  const pronunciation = acc > 0.85 ? 4 : acc > 0.65 ? 3 : acc > 0.4 ? 2 : 1;
  const lexicalResource = acc > 0.8 ? 4 : acc > 0.6 ? 3 : 2;
  const grammar = acc > 0.75 ? 4 : acc > 0.55 ? 3 : 2;
  const total = fluency + lexicalResource + grammar + pronunciation;
  const band = calculateIELTSBand(total);
  const feedback: string[] = [];
  if (fluency < 3) feedback.push('Try to read more smoothly without long pauses between words.');
  if (pronunciation < 3) feedback.push('Focus on pronouncing each word clearly.');
  if (lexicalResource < 3) feedback.push('Make sure to read all the words in the passage.');
  if (grammar < 3) feedback.push('Pay attention to sentence endings and punctuation.');
  if (!feedback.length) feedback.push('Excellent reading! Your pace and accuracy were very good.');
  const recommendation = band >= 7.5 ? 'Challenge yourself with more complex passages.' : band >= 6 ? 'Practice reading longer passages daily.' : band >= 4 ? 'Read simple texts every day to build fluency.' : 'Start with short simple sentences and practice.';
  return { score: { fluency, lexicalResource, grammar, pronunciation, total, band }, feedback, recommendation };
};

export const analyzeReadingWithAI = async (req: AIAnalysisRequest): Promise<Partial<AssessmentResult>> => {
  if (!genAI) return localScore(req.transcription, req.originalText);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const parts: any[] = [{
      text: `You are an IELTS examiner. A student read this passage aloud:\n"${req.originalText}"\nGrade: ${req.grade}\nBrowser transcript: "${req.transcription || 'not available'}"\n\nScore on 4 criteria (0–4 each): fluency, lexicalResource, grammar, pronunciation.\nReturn ONLY valid JSON (no markdown):\n{"score":{"fluency":N,"lexicalResource":N,"grammar":N,"pronunciation":N},"feedback":["tip1","tip2","tip3"],"recommendation":"one sentence"}`
    }];
    if (req.audioBase64) parts.push({ inlineData: { data: req.audioBase64, mimeType: 'audio/webm' } });
    const result = await model.generateContent(parts);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return localScore(req.transcription, req.originalText);
  }
};

const localQuestions = (text: string): string[] => {
  const sents = text.match(/[^.!?]+[.!?]+/g) || [text];
  const qs: string[] = [];
  qs.push(`What is the main topic of this passage?`);
  if (sents.length >= 2) {
    const words = sents[1].replace(/[^a-zA-Z\s]/g, '').split(' ').filter(w => w.length > 4);
    const kw = words[Math.floor(words.length / 2)] || 'it';
    qs.push(`According to the passage, what do we learn about "${kw}"?`);
  }
  qs.push(`Can you describe one fact from this passage in your own words?`);
  qs.push(sents.length >= 3 ? `The passage ends by saying: "${sents[sents.length - 1].trim().slice(0, 55)}..." — what does this mean?` : `Why do you think this topic is important?`);
  return qs;
};

export const generateComprehensionQuestionsLocal = async (text: string, grade: string): Promise<string[]> => {
  if (!genAI) return localQuestions(text);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(`Generate 4 comprehension questions for a ${grade} student based ONLY on this passage:\n"${text}"\nReturn ONLY a JSON array of 4 strings. No markdown.`);
    const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
    return Array.isArray(parsed) && parsed.length ? parsed : localQuestions(text);
  } catch {
    return localQuestions(text);
  }
};
