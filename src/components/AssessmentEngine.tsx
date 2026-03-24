
import React, { useState, useEffect, useRef } from 'react';
import { evaluateReading } from '../services/assessmentService';
import type { AssessmentResult } from '../services/assessmentService';
import { saveHistory } from '../services/historyService';
import passagesData from '../data/passages.json';

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
  const [transcript, setTranscript] = useState('');
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const found = passagesData.passages.find(p => p.grade === grade) 
                || passagesData.passages[0];
    setAutoPassage(found);
  }, [grade]);

  const startRecording = () => {
    setIsRecording(true);
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    // User requested that once they stop reading, we're ready to submit.
    // For this simulation, we still need the transcript box to be filled.
  };

  const handleSubmit = () => {
    const activeText = mode === 'automated' ? autoPassage.content : customText;
    const guidedText = mode === 'automated' ? autoPassage.guided : activeText;

    if (!activeText.trim()) {
      alert("Please ensure there is a passage to read.");
      return;
    }
    if (!transcript.trim()) {
      alert("Please provide the reading attempt (transcript).");
      return;
    }

    const result = evaluateReading(activeText, transcript, guidedText);
    saveHistory({
      childName: childName,
      grade: mode === 'automated' ? autoPassage.grade : 'Custom',
      score: result.score.total,
      level: result.level
    });
    onComplete(result);
  };

  if (!autoPassage && mode === 'automated') return <div>Loading passage...</div>;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '900px' }}>
      <button 
        onClick={onCancel} 
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        ← Back to Dashboard
      </button>

      <div className="glass-card" style={{ marginBottom: '2rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setMode('automated')}
            style={{ 
              flex: 1, 
              padding: '1rem', 
              borderRadius: '12px', 
              border: 'none', 
              background: mode === 'automated' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Default Passage ({grade})
          </button>
          <button 
            onClick={() => setMode('custom')}
            style={{ 
              flex: 1, 
              padding: '1rem', 
              borderRadius: '12px', 
              border: 'none', 
              background: mode === 'custom' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Paste Custom Text
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'white' }}>
            {mode === 'automated' ? autoPassage.title : 'Custom Reading Task'}
          </h2>
          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
              <div className="pulse-dot" />
              <span style={{ fontWeight: 600 }}>{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>

        {mode === 'automated' ? (
          <div style={{ 
            fontSize: '1.5rem', 
            lineHeight: '1.8', 
            color: 'var(--text-main)', 
            padding: '2rem', 
            background: 'rgba(15, 23, 42, 0.5)', 
            borderRadius: '15px',
            marginBottom: '2rem',
            textAlign: 'center'
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
              borderRadius: '15px', 
              background: 'rgba(15, 23, 42, 0.5)', 
              color: 'white', 
              border: '1px solid var(--glass-border)',
              fontSize: '1.25rem',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}
          />
        )}

        <div style={{ textAlign: 'center' }}>
          {!isRecording ? (
            <button className="btn-primary" onClick={startRecording} style={{ padding: '1rem 4rem', fontSize: '1.25rem' }}>
              🎤 Start Reading
            </button>
          ) : (
            <button className="btn-primary" onClick={stopRecording} style={{ padding: '1rem 4rem', fontSize: '1.25rem', background: '#ef4444' }}>
              ⏹ Stop Reading
            </button>
          )}
        </div>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '1rem' }}>Step 2: Submit Reading Effort</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          After reading, paste the transcription or simulated attempt below to get AI feedback.
        </p>
        <textarea 
          placeholder="Type or paste the transcription here..."
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          style={{ 
            width: '100%', 
            minHeight: '100px', 
            padding: '1rem', 
            borderRadius: '12px', 
            background: '#0f172a', 
            color: 'white', 
            border: '1px solid var(--glass-border)',
            fontSize: '1rem',
            marginBottom: '1.5rem'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={isRecording} style={{ width: '100%', padding: '1rem' }}>
            Submit for Final Result →
          </button>
        </div>
      </div>

      <style>{`
        .pulse-dot {
          width: 12px;
          height: 12px;
          borderRadius: 50%;
          background: #ef4444;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AssessmentEngine;
