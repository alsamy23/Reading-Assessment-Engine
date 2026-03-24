
import React from 'react';
import type { AssessmentResult } from '../services/assessmentService';

interface FeedbackModuleProps {
  result: AssessmentResult;
  childName: string;
  onFinish: () => void;
  onRetry: () => void;
}

const FeedbackModule: React.FC<FeedbackModuleProps> = ({ result, childName, onFinish, onRetry }) => {
  const { score, level, mistakes, feedback, recommendation, guidedText } = result;
  const [showReport, setShowReport] = React.useState(false);

  const handleReadAloud = () => {
    if (!guidedText) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const speak = () => {
      const speech = new SpeechSynthesisUtterance(guidedText.replace(/\//g, ""));
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB')) || voices[0];
      if (enVoice) speech.voice = enVoice;
      
      speech.rate = 0.85;
      speech.pitch = 1.0;
      window.speechSynthesis.speak(speech);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speak;
    } else {
      speak();
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
          {showReport ? 'Detailed Assessment Report' : 'Assessment Result'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {showReport ? 'Complete performance analysis and error log.' : 'Excellent Effort! Here is your performance breakdown.'}
        </p>
      </header>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        {!showReport ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{score.total} / 10</h2>
                <span className={`badge ${score.total > 7 ? 'badge-success' : 'badge-warning'}`}>{level}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Recommendation</p>
                <h4 style={{ color: 'var(--accent)' }}>{recommendation}</h4>
              </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Scores</h3>
                <ScoreItem label="Accuracy" value={score.accuracy} max={3} />
                <ScoreItem label="Fluency" value={score.fluency} max={3} />
                <ScoreItem label="Pronunciation" value={score.pronunciation} max={2} />
                <ScoreItem label="Expression" value={score.expression} max={2} />
              </div>
              <div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Tips</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {feedback.map((tip, i) => (
                    <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="report-view animate-fade-in">
             <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '15px' }}>
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Student: {childName}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Passage Analyzed:</p>
                <p style={{ fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text-main)' }}>"{guidedText}"</p>
             </div>

             <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ marginBottom: '1rem' }}>Score Metrics</h3>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '15px' }}>
                    <p style={{ margin: '0.5rem 0' }}>Accuracy: <strong>{score.accuracy}/3</strong></p>
                    <p style={{ margin: '0.5rem 0' }}>Fluency: <strong>{score.fluency}/3</strong></p>
                    <p style={{ margin: '0.5rem 0' }}>Pronunciation: <strong>{score.pronunciation}/2</strong></p>
                    <p style={{ margin: '0.5rem 0' }}>Expression: <strong>{score.expression}/2</strong></p>
                    <p style={{ marginTop: '1rem', borderTop: '1px solid #444', paddingTop: '0.5rem' }}>Total: <strong>{score.total}/10</strong></p>
                  </div>
                </div>
                <div>
                   <h3 style={{ marginBottom: '1rem' }}>Identified Mistakes</h3>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {mistakes.length > 0 ? mistakes.map((m, i) => (
                        <span key={i} className="badge badge-error" style={{ fontSize: '0.9rem' }}>{m}</span>
                      )) : <p style={{ color: '#4ade80' }}>Zero errors detected.</p>}
                   </div>
                </div>
             </div>

             <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Evaluation Summary</h3>
                <div style={{ padding: '1.5rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '15px', border: '1px solid var(--primary)' }}>
                   <p>{level} performance. {recommendation}.</p>
                </div>
             </div>
          </div>
        )}

        <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0 }}>Correct Reading Model</h3>
          <button 
            className="btn-primary" 
            onClick={handleReadAloud}
            style={{ padding: '0.6rem 1.5rem', background: 'var(--accent)', fontSize: '0.9rem' }}
          >
            🔊 Read Aloud
          </button>
        </div>

        <div style={{ 
          fontSize: '1.25rem', 
          lineHeight: '1.8', 
          padding: '1.5rem', 
          background: 'rgba(0,0,0,0.3)', 
          borderRadius: '12px',
          color: 'var(--text-main)',
          textAlign: 'center'
        }}>
          "{guidedText}"
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '4rem' }}>
        <button className="btn-primary" onClick={() => setShowReport(!showReport)} style={{ background: 'rgba(255,255,255,0.1)' }}>
          {showReport ? 'Show Summary' : 'View Full Report'}
        </button>
        <button className="btn-primary" onClick={onRetry} style={{ background: '#334155' }}>Try Again</button>
        <button className="btn-primary" onClick={onFinish} style={{ padding: '0.75rem 4rem' }}>Complete Session →</button>
      </div>
    </div>
  );
};

const ScoreItem = ({ label, value, max }: { label: string, value: number, max: number }) => (
  <div style={{ marginBottom: '0.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value} / {max}</span>
    </div>
    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ 
        width: `${(value / max) * 100}%`, 
        height: '100%', 
        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
        borderRadius: '4px'
      }} />
    </div>
  </div>
);

export default FeedbackModule;
