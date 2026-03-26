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
  const [selectedDiff, setSelectedDiff] = useState('Medium');

  useEffect(() => {
    setHistory(getHistory());
    setStats({
      avg: getAverageScore(),
      trend: getProgressTrend()
    });
  }, []);

  const grades = [
    'KG1', 'KG2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
  ];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative' }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
          <img 
            src={heroImage} 
            alt="Reading Hero" 
            style={{ 
              width: '100%', 
              maxWidth: '350px', 
              borderRadius: '24px',
              maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
            }} 
          />
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            width: '120%',
            height: '120%',
            background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
            zIndex: -1,
            opacity: 0.6
          }} />
        </div>
        
        <h1 style={{ fontSize: '3rem', marginBottom: '0.75rem' }} className="text-gradient">
          Reading Assessment Hero
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
          Premium AI-Powered Reading Assessment for Young Readers <br/>
          <span className="badge badge-purple" style={{ marginTop: '0.5rem' }}>Aligned with IELTS Speaking Standards</span>
        </p>
      </section>

      {/* Progress & Stats Group */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {/* Student Progress Card */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Student Progress</h3>
            <div style={{ color: 'var(--accent)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
          </div>
          
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Average Score:</p>
              <h2 style={{ fontSize: '2.5rem', margin: '0.25rem 0' }}>{stats.avg}/10</h2>
              <span className={`badge ${stats.avg > 7 ? 'badge-success' : 'badge-warning'}`}>
                {stats.avg > 7 ? 'Proficient' : stats.avg > 4 ? 'Developing' : 'Beginner'}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Progress Trend:</p>
              <h2 style={{ fontSize: '1.5rem', margin: '0.75rem 0', color: stats.trend === 'Needs Attention' ? '#f87171' : '#4ade80' }}>
                {stats.trend}
              </h2>
              <span className={`badge ${stats.trend === 'Improving' ? 'badge-success' : 'badge-error'}`}>
                {stats.trend === 'Improving' ? 'Trending Up' : 'Needs Attention'}
              </span>
            </div>
          </div>
        </div>

        {/* Sessions Card */}
        <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2.25rem', margin: 0 }}>Sessions: {history.length}</h2>
          </div>
          <span className="badge" style={{ background: 'rgba(255,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
            Total Completed
          </span>
        </div>
      </div>

      {/* Start Button */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <button 
          className="btn-primary" 
          style={{ width: '100%', maxWidth: '500px', padding: '1.25rem 0' }}
          onClick={() => {
            if (!childName.trim()) {
              alert("Please enter the child's name in Student Details first.");
              return;
            }
            onStartAssessment(selectedGrade, childName);
          }}
        >
          Start New Session <span style={{ marginLeft: '0.5rem' }}>›</span>
        </button>
      </div>

      {/* Student Details Form */}
      <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Student Details</h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Child's Name</label>
            <input 
              type="text" 
              placeholder="Enter Student Name" 
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
            />
          </div>
          <div>
            <label>Grade Level</label>
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label>Difficulty</label>
            <select value={selectedDiff} onChange={(e) => setSelectedDiff(e.target.value)}>
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <section>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Recent Assessments</h2>
          <div className="grid">
            {history.slice(0, 3).map(h => (
              <div key={h.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{h.childName} • {h.grade}</h4>
                  <small style={{ color: 'var(--text-muted)' }}>{new Date(h.date).toLocaleDateString()}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--secondary)' }}>Score: {h.score}/10</div>
                  <div className="badge badge-purple" style={{ fontSize: '0.7rem' }}>IELTS Pattern</div>
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
