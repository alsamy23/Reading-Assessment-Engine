import React, { useEffect, useState } from 'react';
import { getAverageScore, getHistory, getProgressTrend } from '../services/historyService';
import type { HistoryRecord } from '../services/historyService';
import heroImage from '../assets/reading_hero.png';

interface DashboardProps {
  onStartAssessment: (grade: string, childName: string) => void;
}

const GRADES = ['KG1','KG2','Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];
const GRADE_DESC: Record<string, string> = {
  'KG1':'Ages 4–5 · very simple sentences','KG2':'Ages 5–6 · simple short sentences',
  'Grade 1':'Ages 6–7 · basic sentences','Grade 2':'Ages 7–8 · simple paragraphs',
  'Grade 3':'Ages 8–9 · short paragraphs','Grade 4':'Ages 9–10 · multi-sentence passages',
  'Grade 5':'Ages 10–11 · descriptive passages','Grade 6':'Ages 11–12 · informational texts',
  'Grade 7':'Ages 12–13 · historical & academic','Grade 8':'Ages 13–14 · complex informational',
  'Grade 9':'Ages 14–15 · advanced comprehension','Grade 10':'Ages 15–16 · academic prose',
  'Grade 11':'Ages 16–17 · rhetorical & analytical','Grade 12':'Ages 17–18 · university level'
};

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

  const handleStart = () => {
    if (!childName.trim()) { setNameError(true); document.getElementById('sname')?.focus(); return; }
    setNameError(false);
    onStartAssessment(selectedGrade, childName.trim());
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <section style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
          <img src={heroImage} alt="Reading Hero" style={{ width: '100%', maxWidth: '300px', borderRadius: '24px', maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)' }} />
        </div>
        <h1 style={{ fontSize: '2.75rem', marginBottom: '0.75rem' }} className="text-gradient">Reading Assessment Engine</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '580px', margin: '0 auto' }}>AI-Powered Reading Assessment for Students</p>
        <div className="badge badge-purple" style={{ marginTop: '0.75rem', display: 'inline-block' }}>Aligned with IELTS Speaking Standards</div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Average Band Score</p>
          <h2 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem' }}>{stats.avg > 0 ? stats.avg.toFixed(1) : '—'}</h2>
          {stats.avg > 0 && <span className={`badge ${stats.avg > 7 ? 'badge-success' : 'badge-warning'}`}>{stats.avg > 7 ? 'Proficient' : stats.avg > 4 ? 'Developing' : 'Beginner'}</span>}
        </div>
        <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Total Sessions</p>
            <h2 style={{ fontSize: '2.5rem', margin: 0 }}>{history.length}</h2>
          </div>
          <p style={{ color: stats.trend === 'Needs Attention' ? '#f87171' : '#4ade80', fontWeight: 700 }}>{stats.trend}</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>🎓 Start New Assessment</h2>

        <div style={{ marginBottom: '1.25rem' }}>
          <label>Student Name *</label>
          <input id="sname" type="text" placeholder="Enter student name" value={childName}
            onChange={(e) => { setChildName(e.target.value); setNameError(false); }} />
          {nameError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>⚠️ Please enter the student name to continue.</p>}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label>Grade / Level</label>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>📖 {GRADE_DESC[selectedGrade]}</p>
        </div>

        <button className="btn-primary" style={{ width: '100%', padding: '1.1rem 0' }} onClick={handleStart}>
          🚀 Start Assessment →
        </button>
      </div>

      {history.length > 0 && (
        <section>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>📜 Recent Sessions</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {history.slice(0, 4).map(h => (
              <div key={h.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{h.childName}</h4>
                  <small style={{ color: 'var(--text-muted)' }}>{h.grade} · {new Date(h.date).toLocaleDateString()}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem', color: h.score >= 6 ? '#4ade80' : 'var(--secondary)' }}>Band {typeof h.score === 'number' ? h.score.toFixed(1) : h.score}</div>
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>IELTS</span>
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
