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

// ─── Local scorer — used when Gemini API key is not configured ──────────────
const localScore = (transcript: string, original: string): Partial<AssessmentResult> => {
  const clean = (t: string) =>
    t.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);

  const orig = clean(original);
  const said = clean(transcript);

  // No transcript at all — cannot score reliably, return null so the
  // caller keeps the evaluateReading(hasAudio=true) fallback instead.
  if (said.length === 0) return {};

  const matched = said.filter(w => orig.includes(w)).length;
  const acc = orig.length ? matched / orig.length : 0;
  const cov = Math.min(1, said.length / orig.length);

  // Generous thresholds: a real read-aloud should score Band 5–7
  const fluency: number       = cov > 0.85 ? 4 : cov > 0.65 ? 3 : cov > 0.35 ? 2 : 1;
  const pronunciation: number = acc > 0.80 ? 4 : acc > 0.55 ? 3 : 2;
  const lexicalResource: number = acc > 0.75 ? 4 : acc > 0.50 ? 3 : 2;
  const grammar: number       = acc > 0.70 ? 4 : acc > 0.45 ? 3 : 2;

  const total = fluency + lexicalResource + grammar + pronunciation;
  const band = calculateIELTSBand(total);

  const feedback: string[] = [];
  if (fluency < 3)         feedback.push('Try to read more smoothly without long pauses between words.');
  if (pronunciation < 3)   feedback.push('Focus on pronouncing each word clearly and at a steady pace.');
  if (lexicalResource < 3) feedback.push('Make sure to read all words in the passage — do not skip any.');
  if (grammar < 3)         feedback.push('Pay attention to sentence endings and punctuation when reading.');
  if (!feedback.length)    feedback.push('Excellent reading! Your pace and accuracy were very good.');

  const recommendation =
    band >= 7.5 ? 'Challenge yourself with more complex passages.' :
    band >= 6.0 ? 'Practice reading longer passages aloud every day.' :
    band >= 4.0 ? 'Read simple texts daily to build fluency and confidence.' :
    'Start with short simple sentences and practice until comfortable.';

  return { score: { fluency, lexicalResource, grammar, pronunciation, total, band }, feedback, recommendation };
};

// ─── Main AI analysis ───────────────────────────────────────────────────────
export const analyzeReadingWithAI = async (req: AIAnalysisRequest): Promise<Partial<AssessmentResult>> => {
  // No API key — use local scorer
  if (!genAI) return localScore(req.transcription, req.originalText);

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const parts: any[] = [{
      text: `You are an expert IELTS Speaking examiner assessing a student reading a passage aloud.

PASSAGE TO READ:
"${req.originalText}"

STUDENT GRADE: ${req.grade}
BROWSER TRANSCRIPT (what the student said): "${req.transcription || 'not captured'}"

${req.audioBase64 ? 'An audio recording is attached. Listen to it carefully and assess the reading.' : ''}

Score the reading on these 4 IELTS criteria (each 0–4):
- fluency: smooth pace, no long hesitations, reads all sentences
- lexicalResource: reads the actual words correctly
- grammar: correct sentence structure and endings
- pronunciation: clear articulation, correct word stress

IMPORTANT: If the student clearly read the passage (audio present, reasonable transcript), 
scores should be in the 3–4 range for a good reading. Do NOT give Band 3 or below unless 
the reading was genuinely very poor.

Return ONLY valid JSON, no markdown, no explanation:
{"score":{"fluency":N,"lexicalResource":N,"grammar":N,"pronunciation":N},"feedback":["specific tip 1","specific tip 2","specific tip 3"],"recommendation":"one actionable sentence"}`,
    }];

    if (req.audioBase64) {
      parts.push({ inlineData: { data: req.audioBase64, mimeType: 'audio/webm' } });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text().replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch {
    return localScore(req.transcription, req.originalText);
  }
};

// ─── Question generation from passage ──────────────────────────────────────
const localQuestions = (text: string): string[] => {
  const sents = text.match(/[^.!?]+[.!?]+/g) || [text];
  const qs: string[] = [];
  qs.push('What is the main topic of this passage?');
  if (sents.length >= 2) {
    const words = sents[1].replace(/[^a-zA-Z\s]/g, '').split(' ').filter(w => w.length > 4);
    const kw = words[Math.floor(words.length / 2)] || 'the subject';
    qs.push(`According to the passage, what do we learn about "${kw}"?`);
  }
  qs.push('Can you describe one fact from this passage in your own words?');
  qs.push(
    sents.length >= 3
      ? `The passage ends with: "${sents[sents.length - 1].trim().slice(0, 60)}..." — what does this tell us?`
      : 'Why do you think this topic is important?'
  );
  return qs;
};

export const generateComprehensionQuestionsLocal = async (text: string, grade: string): Promise<string[]> => {
  if (!genAI) return localQuestions(text);
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(
      `Generate 4 comprehension questions for a ${grade} student based ONLY on this specific passage. Each question must be answerable from the passage text alone.\n\nPASSAGE:\n"${text}"\n\nReturn ONLY a JSON array of 4 question strings. No markdown, no extra text.`
    );
    const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
    return Array.isArray(parsed) && parsed.length ? parsed : localQuestions(text);
  } catch {
    return localQuestions(text);
  }
};
