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
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  // Clean guided text: remove / markers, read naturally
  const cleanTextForSpeech = (text: string) =>
    text.replace(/\//g, ' ').replace(/\s+/g, ' ').trim();

  const handleReadAloud = () => {
    if (!guidedText) return;

    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(cleanTextForSpeech(guidedText));
      const voices = window.speechSynthesis.getVoices();

      // Pick best English voice — prefer natural-sounding ones
      const preferred = voices.find(v =>
        v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Karen'))
      ) || voices.find(v => v.lang === 'en-US')
        || voices.find(v => v.lang.startsWith('en'))
        || voices[0];

      if (preferred) utterance.voice = preferred;
      utterance.rate = 0.82;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    };

    // Ensure voices are loaded
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      speakNow();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        speakNow();
      };
      // Trigger voice load
      window.speechSynthesis.getVoices();
    }
  };

  const bandColor = score.band >= 7.5 ? '#4ade80' : score.band >= 6.0 ? '#a78bfa' : score.band >= 4.0 ? '#fbbf24' : '#f87171';

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
          {showReport ? 'Detailed Report' : '🎉 Assessment Complete!'}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {showReport ? 'IELTS criteria-based performance analysis.' : `Well done, ${childName}! Here is your result.`}
        </p>
      </header>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        {!showReport ? (
          <>
            {/* Score Overview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>IELTS ESTIMATED BAND</p>
                <h2 style={{ fontSize: '4rem', margin: 0, color: bandColor }}>Band {score.band.toFixed(1)}</h2>
                <span className={`badge ${score.band >= 6.5 ? 'badge-success' : 'badge-warning'}`}>{level} Reader</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Next Step</p>
                <h4 style={{ color: 'var(--accent)', fontSize: '1.1rem', maxWidth: '250px', textAlign: 'right' }}>{recommendation}</h4>
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', color: 'white' }}>📊 Score Breakdown</h3>
                <ScoreItem label="Fluency & Coherence" value={score.fluency} max={4} />
                <ScoreItem label="Lexical Resource" value={score.lexicalResource} max={4} />
                <ScoreItem label="Grammatical Range" value={score.grammar} max={4} />
                <ScoreItem label="Pronunciation" value={score.pronunciation} max={4} />
              </div>
              <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'white' }}>💡 Expert Tips</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {feedback.map((tip, i) => (
                    <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', lineHeight: '1.5' }}>
                      <span style={{ color: 'var(--primary)', flexShrink: 0 }}>•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ marginBottom: '0.5rem', color: 'white' }}>Student: {childName}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Reading Model:</p>
              <p style={{ fontSize: '1rem', color: 'var(--text-main)', lineHeight: '1.7' }}>"{guidedText}"</p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'white' }}>IELTS Metrics</h3>
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <MetricRow label="Fluency" val={score.fluency} />
                  <MetricRow label="Lexical Resource" val={score.lexicalResource} />
                  <MetricRow label="Grammar" val={score.grammar} />
                  <MetricRow label="Pronunciation" val={score.pronunciation} />
                  <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Overall Band</span>
                    <strong style={{ color: bandColor, fontSize: '1.25rem' }}>{score.band.toFixed(1)}</strong>
                  </div>
                </div>
              </div>
              <div>
                <h3 style={{ marginBottom: '1rem', color: 'white' }}>Word Corrections</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {mistakes.length > 0 ? mistakes.slice(0, 20).map((m, i) => (
                    <span key={i} className="badge badge-error" style={{ fontSize: '0.85rem' }}>{m}</span>
                  )) : <p style={{ color: '#4ade80', fontSize: '0.9rem' }}>✓ All words were read correctly!</p>}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: 'rgba(139,92,246,0.1)', borderRadius: '15px', border: '1px solid var(--primary)' }}>
              <p style={{ margin: 0 }}>
                <strong>{childName}</strong> is a <strong>{level} Reader</strong>. {recommendation}
              </p>
            </div>
          </div>
        )}

        <hr style={{ border: 'none', height: '1px', background: 'var(--glass-border)', margin: '2rem 0' }} />

        {/* Read Aloud Model Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', color: 'white' }}>🔊 Correct Reading Model</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Listen to how the passage should be read aloud</p>
          </div>
          <button
            className="btn-primary"
            onClick={handleReadAloud}
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem', background: isSpeaking ? '#ef4444' : 'var(--accent)', boxShadow: 'none', flexShrink: 0 }}
          >
            {isSpeaking ? '⏹ Stop' : '▶ Play'}
          </button>
        </div>

        <div style={{
          fontSize: '1.1rem', lineHeight: '1.9', padding: '1.5rem',
          background: 'rgba(0,0,0,0.3)', borderRadius: '16px', color: 'var(--text-main)',
          border: '1px solid var(--glass-border)'
        }}>
          {/* Render guided text with CAPS highlighted */}
          {guidedText.split(' ').map((word, i) => {
            const isStressed = word === word.toUpperCase() && word.length > 1 && /[A-Z]/.test(word);
            return (
              <span key={i}>
                <span style={isStressed ? { color: 'var(--accent)', fontWeight: 700 } : {}}>
                  {word.replace(/\//g, '')}
                </span>{' '}
              </span>
            );
          })}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
          <strong style={{ color: 'var(--accent)' }}>Bold/colored words</strong> = stressed syllables to emphasize when reading
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={() => setShowReport(!showReport)} style={{ flex: 1, minWidth: '150px' }}>
          {showReport ? '← Back to Summary' : '📋 Full Report'}
        </button>
        <button className="btn-secondary" onClick={onRetry} style={{ background: 'rgba(255,255,255,0.05)', flex: 1, minWidth: '150px' }}>
          🔄 Try Again
        </button>
        <button className="btn-primary" onClick={onFinish} style={{ flex: 2, minWidth: '200px' }}>
          ✓ Complete Session →
        </button>
      </div>
    </div>
  );
};

const MetricRow = ({ label, val }: { label: string; val: number }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
    <strong>{val} / 4</strong>
  </div>
);

const ScoreItem = ({ label, value, max }: { label: string; value: number; max: number }) => (
  <div style={{ marginBottom: '1.25rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.875rem' }}>
      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 700, color: 'white' }}>{value} / {max}</span>
    </div>
    <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{
        width: `${(value / max) * 100}%`, height: '100%',
        background: value >= 3 ? 'linear-gradient(90deg, #4ade80, #22d3ee)' : value >= 2 ? 'linear-gradient(90deg, var(--primary), var(--accent))' : 'linear-gradient(90deg, #f87171, #fb923c)',
        borderRadius: '10px', boxShadow: '0 0 10px var(--primary-glow)'
      }} />
    </div>
  </div>
);

export default FeedbackModule;
