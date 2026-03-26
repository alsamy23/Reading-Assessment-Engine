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
    
    window.speechSynthesis.cancel();
    
    const speakAction = () => {
      const utterance = new SpeechSynthesisUtterance(guidedText.replace(/\//g, ""));
      const voices = window.speechSynthesis.getVoices();
      
      const targetVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) 
                       || voices.find(v => v.lang.startsWith('en'))
                       || voices[0];
                       
      if (targetVoice) utterance.voice = targetVoice;
      utterance.rate = 0.85;
      utterance.pitch = 1.0;
      
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = speakAction;
    } else {
      speakAction();
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          {showReport ? 'Detailed Performance Report' : 'Assessment Result'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {showReport ? 'IELTS Criteria-based performance analysis.' : 'Great job! Here is your IELTS-aligned score.'}
        </p>
      </header>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        {!showReport ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>IELTS ESTIMATED BAND</p>
                <h2 style={{ fontSize: '4rem', margin: 0, color: 'var(--secondary)' }}>Band {score.band.toFixed(1)}</h2>
                <span className={`badge ${score.band >= 6.5 ? 'badge-success' : 'badge-warning'}`}>{level} User</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nex Step</p>
                <h4 style={{ color: 'var(--accent)', fontSize: '1.25rem' }}>{recommendation}</h4>
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.2rem', color: 'white' }}>Key Metrics</h3>
                <ScoreItem label="Fluency & Coherence" value={score.fluency} max={4} />
                <ScoreItem label="Lexical Resource" value={score.lexicalResource} max={4} />
                <ScoreItem label="Grammatical Range" value={score.grammar} max={4} />
                <ScoreItem label="Pronunciation" value={score.pronunciation} max={4} />
              </div>
              <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', color: 'white' }}>Expert Tips</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {feedback.map((tip, i) => (
                    <li key={i} style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--primary)' }}>•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="report-view animate-fade-in">
             <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ marginBottom: '1rem', color: 'white' }}>Student: {childName}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Reading Passage:</p>
                <p style={{ fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text-main)', lineHeight: '1.6' }}>"{guidedText}"</p>
             </div>

             <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ marginBottom: '1rem', color: 'white' }}>IELTS Metrics</h3>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <MetricRow label="Fluency" val={score.fluency} />
                    <MetricRow label="Lexical" val={score.lexicalResource} />
                    <MetricRow label="Grammar" val={score.grammar} />
                    <MetricRow label="Pronunciation" val={score.pronunciation} />
                    <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Overall Band</span>
                      <strong style={{ color: 'var(--secondary)', fontSize: '1.25rem' }}>{score.band.toFixed(1)}</strong>
                    </div>
                  </div>
                </div>
                <div>
                   <h3 style={{ marginBottom: '1rem', color: 'white' }}>Word Corrections</h3>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {mistakes.length > 0 ? mistakes.map((m, i) => (
                        <span key={i} className="badge badge-error" style={{ fontSize: '0.875rem' }}>{m}</span>
                      )) : <p style={{ color: '#4ade80' }}>All words were pronounced correctly!</p>}
                   </div>
                </div>
             </div>

             <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', color: 'white' }}>Evaluation Summary</h3>
                <div style={{ padding: '1.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '15px', border: '1px solid var(--primary)' }}>
                   <p style={{ margin: 0 }}>The student is a <strong>{level} User</strong>. {recommendation}.</p>
                </div>
             </div>
          </div>
        )}

        <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: 'white' }}>Correct Reading Model</h3>
          <button 
            className="btn-primary" 
            onClick={handleReadAloud}
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem', background: 'var(--accent)', boxShadow: 'none' }}
          >
            🔊 Read Aloud
          </button>
        </div>

        <div style={{ 
          fontSize: '1.25rem', 
          lineHeight: '1.8', 
          padding: '1.5rem', 
          background: 'rgba(0,0,0,0.3)', 
          borderRadius: '16px',
          color: 'var(--text-main)',
          textAlign: 'center',
          border: '1px solid var(--glass-border)'
        }}>
          "{guidedText}"
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={() => setShowReport(!showReport)} style={{ flex: 1, minWidth: '150px' }}>
          {showReport ? 'Hide Report' : 'View Full Report'}
        </button>
        <button className="btn-secondary" onClick={onRetry} style={{ background: 'rgba(255,255,255,0.05)', flex: 1, minWidth: '150px' }}>Try Again</button>
        <button className="btn-primary" onClick={onFinish} style={{ flex: 2, minWidth: '200px' }}>Complete Session →</button>
      </div>
    </div>
  );
};

const MetricRow = ({ label, val }: { label: string, val: number }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    <strong>{val} / 4</strong>
  </div>
);

const ScoreItem = ({ label, value, max }: { label: string, value: number, max: number }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.875rem' }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'white' }}>{value} / {max}</span>
    </div>
    <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ 
        width: `${(value / max) * 100}%`, 
        height: '100%', 
        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
        borderRadius: '10px',
        boxShadow: '0 0 10px var(--primary-glow)'
      }} />
    </div>
  </div>
);

export default FeedbackModule;
