
export interface ReadingScore {
  accuracy: number;
  fluency: number;
  pronunciation: number;
  expression: number;
  total: number;
}

export interface AssessmentResult {
  score: ReadingScore;
  level: 'Beginner' | 'Developing' | 'Proficient' | 'Advanced';
  mistakes: string[];
  feedback: string[];
  recommendation: string;
  guidedText: string;
}

export const evaluateReading = (original: string, attempt: string, guided: string): AssessmentResult => {
  const originalWords = original.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);
  const attemptWords = attempt.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).filter(w => w.length > 0);

  let correctCount = 0;
  const mistakes: string[] = [];
  const matchedIndices = new Set<number>();

  if (attemptWords.length === 0) {
    return {
      score: { accuracy: 0, fluency: 0, pronunciation: 0, expression: 0, total: 0 },
      level: 'Beginner',
      mistakes: originalWords,
      feedback: ["No reading attempt detected. Please try reading the passage aloud."],
      recommendation: "Easier text",
      guidedText: guided
    };
  }

  // Better word matching using a sliding window to handle omissions/insertions
  attemptWords.forEach((attemptWord) => {
    // Look for the word in the original text
    for (let i = 0; i < originalWords.length; i++) {
      if (!matchedIndices.has(i) && originalWords[i] === attemptWord) {
        matchedIndices.add(i);
        correctCount++;
        break;
      }
    }
  });

  // Identify mistakes (words in original not found in attempt)
  originalWords.forEach((word, index) => {
    if (!matchedIndices.has(index)) {
      mistakes.push(word);
    }
  });

  const accuracyRatio = originalWords.length > 0 ? correctCount / originalWords.length : 0;
  
  // Stricter Accuracy Calculation (out of 3)
  let accuracyScore = 0;
  if (accuracyRatio > 0.9) accuracyScore = 3;
  else if (accuracyRatio > 0.7) accuracyScore = 2;
  else if (accuracyRatio > 0.4) accuracyScore = 1;

  // Fluency based on length and accuracy (out of 3)
  const lengthRatio = originalWords.length > 0 ? Math.min(1, attemptWords.length / originalWords.length) : 0;
  let fluencyScore = 0;
  if (lengthRatio > 0.9 && accuracyScore >= 2) fluencyScore = 3;
  else if (lengthRatio > 0.6) fluencyScore = 2;
  else if (lengthRatio > 0.3) fluencyScore = 1;

  // Pronunciation and Expression (out of 2 each)
  let pronunciationScore = accuracyScore >= 2 ? 2 : (accuracyScore === 1 ? 1 : 0);
  let expressionScore = (fluencyScore >= 2 && accuracyScore >= 2) ? 2 : (fluencyScore >= 1 ? 1 : 0);

  const total = accuracyScore + fluencyScore + pronunciationScore + expressionScore;

  let level: AssessmentResult['level'] = 'Beginner';
  if (total >= 9) level = 'Advanced';
  else if (total >= 7) level = 'Proficient';
  else if (total >= 4) level = 'Developing';

  const feedback: string[] = [];
  if (accuracyScore < 3) feedback.push("Practice phonics for misread words.");
  if (fluencyScore < 3) feedback.push("Read aloud daily to improve smoothness.");
  if (expressionScore < 2) feedback.push("Focus on punctuation-based pauses.");

  let recommendation = "Same level";
  if (total < 4) recommendation = "Easier text";
  else if (total > 7) recommendation = "Harder text";

  return {
    score: {
      accuracy: accuracyScore,
      fluency: fluencyScore,
      pronunciation: pronunciationScore,
      expression: expressionScore,
      total
    },
    level,
    mistakes: [...new Set(mistakes)],
    feedback,
    recommendation,
    guidedText: guided
  };
};
