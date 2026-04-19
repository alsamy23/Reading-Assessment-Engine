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
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const handleReadAloud = () => {
    if (!guidedText) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) { setIsSpeaking(false); return; }
    const text = guidedText.replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
    const speakNow = () => {
      const utt = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen')))
        || voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (voice) utt.voice = voice;
      utt.rate = 0.82; utt.pitch = 1.05; utt.volume = 1;
      utt.onend = () => setIsSpeaking(false);
      utt.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utt);
      setIsSpeaking(true);
    };
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) speakNow();
    else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; speakNow(); }; window.speechSynthesis.getVoices(); }
  };

  const bandColor = score.band >= 7.5 ? '#4ade80' : score.band >= 6.0 ? '#a78bfa' : score.band >= 4.0 ? '#fbbf24' : '#f87171';
  const scoreItems = [
    { label: 'Fluency & Coherence', val: score.fluency },
    { label: 'Lexical Resource', val: score.lexicalResource },
    { label: 'Grammatical Range', val: score.grammar },
    { label: 'Pronunciation', val: score.pronunciation },
  ];

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px' }}>
      <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.75rem', marginBottom: '0.5rem' }}>🎉 Assessment Complete!</h1>
        <p style={{ color: 'var(--text-muted)' }}>Well done, {childName}! Here is your result.</p>
      </header>

      <div className="glass-card" style={{ marginBottom: '2rem', textAlign: 'center', padding: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>IELTS ESTIMATED BAND</p>
        <h2 style={{ fontSize: '4rem', margin: '0 0 0.5rem', color: bandColor }}>Band {score.band.toFixed(1)}</h2>
        <span className={`badge ${score.band >= 6.5 ? 'badge-success' : 'badge-warning'}`}>{level} Reader</span>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.95rem' }}>{recommendation}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem', color: 'white' }}>📊 Score Breakdown</h3>
          {scoreItems.map(s => {
            const pct = (s.val / 4) * 100;
            const col = s.val >= 3 ? '#4ade80' : s.val >= 2 ? '#a78bfa' : '#f87171';
            return (
              <div key={s.label} style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                  <span style={{ fontWeight: 700 }}>{s.val} / 4</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: col, borderRadius: '10px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'white' }}>💡 Expert Tips</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {feedback.map((tip, i) => (
              <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', lineHeight: '1.5' }}>
                <span style={{ color: 'var(--primary)', flexShrink: 0 }}>•</span> {tip}
              </li>
            ))}
          </ul>
          {mistakes.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Words to practice:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {mistakes.slice(0, 12).map((m, i) => <span key={i} className="badge badge-error" style={{ fontSize: '0.8rem' }}>{m}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', color: 'white' }}>🔊 Correct Reading Model</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>BOLD words</span> = syllables to stress
            </p>
          </div>
          <button className="btn-primary" onClick={handleReadAloud}
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem', background: isSpeaking ? '#ef4444' : undefined, flexShrink: 0 }}>
            {isSpeaking ? '⏹ Stop' : '▶ Play'}
          </button>
        </div>
        <div style={{ fontSize: '1.15rem', lineHeight: '2', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          {guidedText.replace(/\//g, '').split(' ').filter(Boolean).map((word, i) => {
            const isStressed = word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word);
            return <span key={i} style={isStressed ? { color: 'var(--accent)', fontWeight: 700 } : { color: 'var(--text-main)' }}>{word} </span>;
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={onRetry} style={{ flex: 1, minWidth: '150px' }}>🔄 Try Again</button>
        <button className="btn-primary" onClick={onFinish} style={{ flex: 2, minWidth: '200px' }}>✓ Complete Session →</button>
      </div>
    </div>
  );
};

export default FeedbackModule;
