import React, { useEffect, useState } from 'react';
import { getAverageScore, getHistory, getProgressTrend } from '../services/historyService';
import type { HistoryRecord } from '../services/historyService';
import heroImage from '../assets/reading_hero.png';

interface DashboardProps {
  onStartAssessment: (grade: string, childName: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartAssessment }) => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState({ avg: 0, trend: 'Stable' });
  const [childName, setChildName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Grade 1');
  const [nameError, setNameError] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setStats({ avg: getAverageScore(), trend: getProgressTrend() });
  }, []);

  const grades = [
    'KG1', 'KG2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
  ];

  const handleStart = () => {
    if (!childName.trim()) {
      setNameError(true);
      document.getElementById('student-name-input')?.focus();
      return;
    }
    setNameError(false);
    onStartAssessment(selectedGrade, childName.trim());
  };

  const levelDescriptions: Record<string, string> = {
    'KG1': 'Ages 4–5 · Very simple 3-word sentences',
    'KG2': 'Ages 5–6 · Simple short sentences',
    'Grade 1': 'Ages 6–7 · Basic sentences',
    'Grade 2': 'Ages 7–8 · Simple paragraphs',
    'Grade 3': 'Ages 8–9 · Short paragraphs',
    'Grade 4': 'Ages 9–10 · Multi-sentence passages',
    'Grade 5': 'Ages 10–11 · Descriptive passages',
    'Grade 6': 'Ages 11–12 · Informational texts',
    'Grade 7': 'Ages 12–13 · Historical & academic',
    'Grade 8': 'Ages 13–14 · Complex informational',
    'Grade 9': 'Ages 14–15 · Advanced comprehension',
    'Grade 10': 'Ages 15–16 · Academic prose',
    'Grade 11': 'Ages 16–17 · Rhetorical & analytical',
    'Grade 12': 'Ages 17–18 · University-level texts',
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Hero */}
      <section style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
          <img
            src={heroImage}
            alt="Reading Hero"
            style={{
              width: '100%', maxWidth: '320px', borderRadius: '24px',
              maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
            }}
          />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '120%', height: '120%',
            background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
            zIndex: -1, opacity: 0.6
          }} />
        </div>
        <h1 style={{ fontSize: '2.75rem', marginBottom: '0.75rem' }} className="text-gradient">
          Reading Assessment Engine
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '580px', margin: '0 auto' }}>
          AI-Powered Reading Assessment for Students<br />
          <span className="badge badge-purple" style={{ marginTop: '0.5rem' }}>Aligned with IELTS Speaking Standards</span>
        </p>
      </section>

      {/* Stats */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Student Progress</h3>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Average Band</p>
              <h2 style={{ fontSize: '2.25rem', margin: '0.25rem 0' }}>{stats.avg > 0 ? stats.avg.toFixed(1) : '—'}</h2>
              {stats.avg > 0 && (
                <span className={`badge ${stats.avg > 7 ? 'badge-success' : 'badge-warning'}`}>
                  {stats.avg > 7 ? 'Proficient' : stats.avg > 4 ? 'Developing' : 'Beginner'}
                </span>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Progress</p>
              <h2 style={{ fontSize: '1.4rem', margin: '0.75rem 0', color: stats.trend === 'Needs Attention' ? '#f87171' : '#4ade80' }}>
                {stats.trend}
              </h2>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Total Sessions</p>
            <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{history.length}</h2>
          </div>
          <span className="badge" style={{ background: 'rgba(255,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', fontSize: '0.85rem' }}>
            Completed
          </span>
        </div>
      </div>

      {/* Setup Card — Student Details + Start */}
      <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>🎓 Start New Assessment</h2>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Student Name <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="student-name-input"
            type="text"
            placeholder="Enter student name"
            value={childName}
            onChange={(e) => { setChildName(e.target.value); setNameError(false); }}
            style={{ borderColor: nameError ? '#ef4444' : undefined }}
          />
          {nameError && (
            <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.35rem' }}>
              ⚠️ Please enter the student's name to continue.
            </p>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Grade / Level
          </label>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
            {grades.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          {levelDescriptions[selectedGrade] && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.4rem' }}>
              📖 {levelDescriptions[selectedGrade]}
            </p>
          )}
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', padding: '1.1rem 0' }}
          onClick={handleStart}
        >
          🚀 Start Assessment →
        </button>
      </div>

      {/* Recent Sessions */}
      {history.length > 0 && (
        <section>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>📜 Recent Sessions</h2>
          <div className="grid">
            {history.slice(0, 4).map(h => (
              <div key={h.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{h.childName}</h4>
                  <small style={{ color: 'var(--text-muted)' }}>{h.grade} · {new Date(h.date).toLocaleDateString()}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem', color: h.score >= 6 ? '#4ade80' : 'var(--secondary)' }}>
                    Band {typeof h.score === 'number' ? h.score.toFixed(1) : h.score}
                  </div>
                  <div className="badge badge-purple" style={{ fontSize: '0.7rem' }}>IELTS</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
