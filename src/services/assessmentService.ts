
export interface SpeakingScore {
  fluency: number;           // 0-4 scale for internal, mapped to Band
  lexicalResource: number;   // 0-4 scale
  grammar: number;           // 0-4 scale
  pronunciation: number;      // 0-4 scale
  total: number;             // 0-16 scale
  band: number;              // 0-9 IELTS Band
}

export interface AssessmentResult {
  score: SpeakingScore;
  level: 'Beginner' | 'Developing' | 'Proficient' | 'Advanced';
  mistakes: string[];
  feedback: string[];
  recommendation: string;
  guidedText: string;
}

export const calculateIELTSBand = (totalScore: number): number => {
  // Map 0-16 score to 0-9 band
  if (totalScore >= 15) return 9.0;
  if (totalScore >= 13) return 8.0;
  if (totalScore >= 11) return 7.0;
  if (totalScore >= 9) return 6.0;
  if (totalScore >= 7) return 5.0;
  if (totalScore >= 5) return 4.0;
  if (totalScore >= 3) return 3.0;
  if (totalScore >= 1) return 2.0;
  return 0;
};

export const evaluateReading = (original: string, attempt: string, guided: string): AssessmentResult => {
  const originalWords = original.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
  const attemptWords = attempt.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);

  let correctCount = 0;
  const mistakes: string[] = [];
  const matchedIndices = new Set<number>();

  if (attemptWords.length === 0) {
    return {
      score: { fluency: 0, lexicalResource: 0, grammar: 0, pronunciation: 0, total: 0, band: 0 },
      level: 'Beginner',
      mistakes: originalWords,
      feedback: ["No attempt detected. Please ensure your microphone is working."],
      recommendation: "Try a simpler text to build confidence.",
      guidedText: guided
    };
  }

  // Word matching logic
  attemptWords.forEach((attemptWord) => {
    for (let i = 0; i < originalWords.length; i++) {
      if (!matchedIndices.has(i) && originalWords[i] === attemptWord) {
        matchedIndices.add(i);
        correctCount++;
        break;
      }
    }
  });

  originalWords.forEach((word, index) => {
    if (!matchedIndices.has(index)) {
      mistakes.push(word);
    }
  });

  const accuracyRatio = originalWords.length > 0 ? correctCount / originalWords.length : 0;
  const lengthRatio = originalWords.length > 0 ? Math.min(1, attemptWords.length / originalWords.length) : 0;

  // 1. Fluency & Coherence (based on length and flow)
  let fluency = 0;
  if (lengthRatio > 0.9 && accuracyRatio > 0.8) fluency = 4;
  else if (lengthRatio > 0.7) fluency = 3;
  else if (lengthRatio > 0.4) fluency = 2;
  else fluency = 1;

  // 2. Lexical Resource (internal simulation: based on accuracy of target words)
  let lexicalResource = accuracyRatio > 0.9 ? 4 : accuracyRatio > 0.7 ? 3 : accuracyRatio > 0.4 ? 2 : 1;

  // 3. Grammatical Range & Accuracy (internal simulation)
  let grammar = accuracyRatio > 0.85 ? 4 : accuracyRatio > 0.6 ? 3 : 2;

  // 4. Pronunciation (internal simulation)
  let pronunciation = accuracyRatio > 0.9 ? 4 : accuracyRatio > 0.7 ? 3 : 2;

  const total = fluency + lexicalResource + grammar + pronunciation;
  const band = calculateIELTSBand(total);

  let level: AssessmentResult['level'] = 'Beginner';
  if (band >= 7.5) level = 'Advanced';
  else if (band >= 6.0) level = 'Proficient';
  else if (band >= 4.0) level = 'Developing';

  const feedback: string[] = [];
  if (fluency < 3) feedback.push("IELTS TIP: Try to speak in longer sentences to improve coherence.");
  if (lexicalResource < 3) feedback.push("IELTS TIP: Use a variety of synonyms to showcase your vocabulary range.");
  if (pronunciation < 3) feedback.push("IELTS TIP: Focus on sentence stress and intonation patterns.");

  let recommendation = "Maintain current level";
  if (band < 4.0) recommendation = "Switch to foundational reading";
  else if (band > 7.0) recommendation = "Challenge with academic passages";

  return {
    score: {
      fluency,
      lexicalResource,
      grammar,
      pronunciation,
      total,
      band
    },
    level,
    mistakes: [...new Set(mistakes)],
    feedback,
    recommendation,
    guidedText: guided
  };
};
