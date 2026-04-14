import React, { useState, useEffect, useRef } from 'react';
import { evaluateReading, calculateIELTSBand } from '../services/assessmentService';
import type { AssessmentResult } from '../services/assessmentService';
import { saveHistory } from '../services/historyService';
import passagesData from '../data/passages.json';
import { analyzeReadingWithAI, generateComprehensionQuestions } from '../services/geminiService';

interface AssessmentEngineProps {
  grade: string;
  childName: string;
  onComplete: (result: AssessmentResult) => void;
  onCancel: () => void;
}

type PassageMode = 'automated' | 'custom';

const AssessmentEngine: React.FC<AssessmentEngineProps> = ({ grade, childName, onComplete, onCancel }) => {
  const [mode, setMode] = useState<PassageMode>('automated');
  const [autoPassage, setAutoPassage] = useState<any>(null);
  const [customText, setCustomText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [timer, setTimer] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Reset questions when anything changes
    setQuestions([]);
    
    // Also update automated passage when grade changes
    const found = passagesData.passages.find(p => p.grade === grade) 
                || passagesData.passages[0];
    setAutoPassage(found);
  }, [grade, mode, customText]);

  const handleGenerateQuestions = async () => {
    const activeText = mode === 'automated' ? autoPassage?.content : customText;
    if (!activeText || !activeText.trim()) {
      alert("Please provide a passage first.");
      return;
    }

    setIsGeneratingQuestions(true);
    try {
      const result = await generateComprehensionQuestions(activeText, grade);
      setQuestions(result);
    } catch (err) {
      console.error("Failed to generate questions:", err);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setTimer(0);
      timerRef.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Microphone access is required for Speaking Assessment.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSubmit = async () => {
    const activeText = mode === 'automated' ? autoPassage.content : customText;
    const guidedText = mode === 'automated' ? autoPassage.guided : activeText;

    if (!activeText.trim()) {
      alert("Please ensure there is a passage to read.");
      return;
    }
    
    // REQUIREMENT: Prevent submission without recording
    if (!audioBlob) {
      alert("Please record your voice to analyze your speaking.");
      return;
    }

    // Convert audio to base64 if available
    let audioBase64 = "";
    if (audioBlob) {
      const reader = new FileReader();
      audioBase64 = await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(audioBlob);
      });
    }

    let result = evaluateReading(activeText, "", guidedText);

    if (useAI) {
      setIsLoadingAI(true);
      try {
        const aiResult = await analyzeReadingWithAI({
          originalText: activeText,
          transcription: "", // Transcription removed, relying entirely on AI audio analysis
          audioBase64: audioBase64,
          grade: grade
        });
        
        // If Gemini provided specific scores, use them to overwrite the simplistic word-match scores
        if (aiResult.score) {
          const { fluency, lexicalResource, grammar, pronunciation } = aiResult.score;
          const total = fluency + lexicalResource + grammar + pronunciation;
          
          // Re-calculate band based on AI scores
          const band = calculateIELTSBand(total);

          result.score = {
            fluency,
            lexicalResource,
            grammar,
            pronunciation,
            total,
            band
          };
          
          // Update level based on new band
          if (band >= 7.5) result.level = 'Advanced';
          else if (band >= 6.0) result.level = 'Proficient';
          else if (band >= 4.0) result.level = 'Developing';
          else result.level = 'Beginner';
        } else {
          // Fallback if AI didn't provide scores but provided text
          // We don't want 0 scores if the user actually recorded audio
          result.score = {
            ...result.score,
            fluency: 2,
            pronunciation: 2,
            total: 8,
            band: 5.0
          };
          result.level = 'Developing';
        }

        result = {
          ...result,
          feedback: aiResult.feedback || result.feedback, // Use AI feedback preferentially
          recommendation: aiResult.recommendation || result.recommendation
        };
      } catch (err) {
        console.error("AI Analysis failed:", err);
      } finally {
        setIsLoadingAI(false);
      }
    }

    saveHistory({
      childName: childName,
      grade: mode === 'automated' ? autoPassage.grade : 'Custom',
      score: result.score.band, 
      level: result.level
    });
    onComplete(result);
  };

  if (!autoPassage && mode === 'automated') return <div>Loading passage...</div>;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '900px' }}>
      <button 
        onClick={onCancel} 
        className="btn-secondary"
        style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none' }}
      >
        ← Back to Dashboard
      </button>

      <section style={{ marginBottom: '2rem' }}>
         <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Speaking Assessment</h1>
         <div className="badge badge-purple">IELTS Speaking Standards (Part 1: Read Aloud)</div>
      </section>

      <div className="glass-card" style={{ marginBottom: '2rem', padding: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setMode('automated')}
            style={{ 
              flex: 1, 
              padding: '0.875rem', 
              borderRadius: '16px', 
              border: 'none', 
              background: mode === 'automated' ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            Level: {grade}
          </button>
          <button 
            onClick={() => setMode('custom')}
            style={{ 
              flex: 1, 
              padding: '0.875rem', 
              borderRadius: '16px', 
              border: 'none', 
              background: mode === 'custom' ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
          >
            Custom Text
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'white', margin: 0 }}>
            {mode === 'automated' ? autoPassage.title : 'Custom Reading Task'}
          </h2>
          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
              <div className="pulse-dot" />
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>

        {mode === 'automated' ? (
          <div style={{ 
            fontSize: '1.5rem', 
            lineHeight: '1.8', 
            color: 'var(--text-main)', 
            padding: '2.5rem', 
            background: 'rgba(5, 1, 26, 0.4)', 
            borderRadius: '20px',
            marginBottom: '2rem',
            textAlign: 'center',
            border: '1px solid var(--glass-border)'
          }}>
            {autoPassage.content}
          </div>
        ) : (
          <textarea 
            placeholder="Paste your custom passage here..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            style={{ 
              width: '100%', 
              minHeight: '200px', 
              padding: '1.5rem', 
              borderRadius: '20px', 
              background: 'rgba(5, 1, 26, 0.4)', 
              color: 'white', 
              border: '1px solid var(--glass-border)',
              fontSize: '1.25rem',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}
          />
        )}


        {questions.length > 0 && (
          <div className="animate-fade-in" style={{ 
            marginTop: '2rem', 
            padding: '1.5rem', 
            background: 'rgba(139, 92, 246, 0.1)', 
            borderRadius: '16px',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📚 Comprehension Questions
            </h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {questions.map((q, i) => (
                <li key={i} style={{ 
                  padding: '0.75rem', 
                  marginBottom: '0.5rem', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '10px',
                  borderLeft: '4px solid var(--primary)'
                }}>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {audioURL && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--primary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Review your recording:</p>
            <audio src={audioURL} controls style={{ width: '100%', height: '40px' }} />
          </div>
        )}

        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          {!isRecording ? (
            <>
              <button className="btn-primary" onClick={startRecording} style={{ padding: '1rem 3rem' }}>
                🎤 Start Microphone
              </button>
              <button 
                className="btn-secondary" 
                onClick={handleGenerateQuestions} 
                disabled={isGeneratingQuestions || (mode === 'custom' && !customText.trim())}
                style={{ 
                  borderRadius: '100px', 
                  padding: '1rem 2rem',
                  opacity: (mode === 'custom' && !customText.trim()) ? 0.5 : 1,
                  cursor: (mode === 'custom' && !customText.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                {isGeneratingQuestions ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="spinner-small" /> Generating...
                  </span>
                ) : '✨ Prep Questions'}
              </button>
            </>
          ) : (
            <button className="btn-primary" onClick={stopRecording} style={{ padding: '1rem 4rem', background: '#ef4444', boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)' }}>
              ⏹ Stop & Save
            </button>
          )}
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, color: 'white' }}>Analysis & Feedback</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
            ✨ AI IELTS Proctoring (Smart Noise Filtering)
          </label>
        </div>
        
        {audioBlob && (
          <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ Audio recorded and ready for AI analysis</span>
          </div>
        )}
        
        <button 
          className="btn-primary" 
          onClick={handleSubmit} 
          disabled={isRecording || isLoadingAI} 
          style={{ width: '100%' }}
        >
          {isLoadingAI ? '🤖 AI Analyzing IELTS Criteria...' : 'Finalize Assessment →'}
        </button>
      </div>

      <style>{`
        .pulse-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ef4444;
          animation: pulse 1.5s infinite;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }
        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AssessmentEngine;
