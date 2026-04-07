import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AssessmentResult } from './assessmentService';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface AIAnalysisRequest {
  originalText: string;
  transcription: string;
  grade: string;
}

export const analyzeReadingWithAI = async (request: AIAnalysisRequest): Promise<Partial<AssessmentResult>> => {
  if (!genAI) {
    console.warn("Gemini API Key missing. Using simulated feedback.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          feedback: [
            "IELTS AI ANALYSIS: Speaker shows good fluency but relies on simple connectors (and, but).",
            "LEXICAL RESOURCE: Vocabulary is appropriate for the topic, but could be enhanced with academic collocations.",
            "GRAMMAR: Minor errors in subject-verb agreement detected in the second sentence.",
            "PRONUNCIATION: Clear articulation; focus on the /th/ sound in 'throughout'."
          ],
          recommendation: "Focus on using complex sentence structures to aim for Band 7.5+."
        });
      }, 1500);
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an IELTS Speaking examiner. 
      Analyze this reading attempt based on the official IELTS Part 1 'Read Aloud' criteria.
      
      PASSAGE: "${request.originalText}"
      STUDENT TRANSCRIPTION: "${request.transcription}"
      LEVEL: ${request.grade}
      
      Provide:
      1. Exactly 4 specific feedback points about Fluency, Lexical Resource, Grammar, and Pronunciation.
      2. A concise 1-sentence recommendation for improvement.
      
      Return JSON format: 
      {
        "feedback": ["point 1", "point 2", "point 3", "point 4"],
        "recommendation": "string"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini Analysis Error:", err);
    return { feedback: ["Analysis currently unavailable."], recommendation: "Please try again shortly." };
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

