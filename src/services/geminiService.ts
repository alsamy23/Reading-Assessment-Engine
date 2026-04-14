import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AssessmentResult } from './assessmentService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface AIAnalysisRequest {
  originalText: string;
  transcription: string;
  audioBase64?: string; // Optinal: the real audio for multimodal analysis
  grade: string;
}

export const analyzeReadingWithAI = async (request: AIAnalysisRequest): Promise<Partial<AssessmentResult>> => {
  if (!genAI) {
    console.warn("Gemini API Key missing. Using simulated feedback.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          feedback: [
            "IELTS AI ANALYSIS: Speaker shows good fluency but relies on simple connectors.",
            "LEXICAL RESOURCE: Vocabulary is appropriate, but needs more academic collocations.",
            "GRAMMAR: Minor errors in subject-verb agreement detected.",
            "PRONUNCIATION: Clear articulation; focus on sentence stress."
          ],
          recommendation: "Focus on using complex sentence structures to aim for Band 7.5+."
        });
      }, 1500);
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Prepare parts for multimodal input
    const promptParts: any[] = [
      {
        text: `
          You are an expert IELTS Speaking examiner. 
          Listen to the provided AUDIO recording of the student reading the passage aloud.
          Analyze this 'Read Aloud' attempt based on the official IELTS Public Band Descriptors.
          
          PASSAGE TO READ: "${request.originalText}"
          LEVEL: ${request.grade}
          
          CRITICAL INSTRUCTION:
          Compare the AUDIO recording directly against the 'PASSAGE TO READ'.
          Carefully evaluate their Pronunciation, Fluency, and how accurately they read the text.
          If the audio does not match the text, or if the audio is silent/missing, severely penalize the score.
          
          Provide scores (0-4 internal scale for each) and feedback for:
          1. Fluency & Coherence (pacing, hesitations, self-correction)
          2. Lexical Resource (vocabulary range)
          3. Grammatical Range & Accuracy
          4. Pronunciation (clarity, word stress, intonation)
          
          Return JSON format: 
          {
            "score": {
              "fluency": number,
              "lexicalResource": number,
              "grammar": number,
              "pronunciation": number
            },
            "feedback": ["detailed point 1", "detailed point 2", "detailed point 3", "detailed point 4"],
            "recommendation": "string"
          }
        `
      }
    ];

    // Add audio if available
    if (request.audioBase64) {
      promptParts.push({
        inlineData: {
          data: request.audioBase64,
          mimeType: "audio/webm"
        }
      });
    }

    const result = await model.generateContent(promptParts);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    const data = JSON.parse(text);
    
    return data;
  } catch (err) {
    console.error("Gemini Analysis Error:", err);
    return { 
      feedback: ["Analysis currently unavailable."], 
      recommendation: "Please try again shortly.",
      score: { fluency: 2, lexicalResource: 2, grammar: 2, pronunciation: 2, total: 8, band: 6.0 }
    };
  }
};

export const generateComprehensionQuestions = async (text: string, grade: string): Promise<string[]> => {
  if (!genAI) {
    console.warn("Gemini API Key missing. Using simulated passage-aware questions.");
    // Even without Gemini, we should try to make it look passage-aware if possible, 
    // but the actual goal is to use Gemini.
    return new Promise((resolve) => {
      setTimeout(() => {
        const questionPool = [
          `Summarize the main idea of this text.`,
          `What details in the text support the title?`,
          `Are there any difficult words in the text that you noticed?`,
          `What is the most interesting part of this passage?`
        ];
        resolve(questionPool);
      }, 1200);
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      Based EXCLUSIVELY on the reading passage below, generate 4 short comprehension questions to test a student's understanding.
      The questions must be specific to the content mentioned in the text.
      
      PASSAGE: "${text}"
      GRADE/LEVEL: ${grade}
      
      Return JSON format: ["Question 1", "Question 2", "Question 3", "Question 4"]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Gemini Question Generation Error:", err);
    return ["What is the main topic of this passage?", "Can you describe a key detail from the text?"];
  }
};

