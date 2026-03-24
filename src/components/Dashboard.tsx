
import React, { useEffect, useState } from 'react';
import { getAverageScore, getHistory, getProgressTrend } from '../services/historyService';
import type { HistoryRecord } from '../services/historyService';

interface DashboardProps {
  onStartAssessment: (grade: string, difficulty: string, childName: string) => void;
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
    <div className="container animate-fade-in">
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Reading Assessment</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Empowering Young Readers with AI Feedback</p>
      </header>

      <div className="grid grid-cols-3" style={{ marginBottom: '3rem' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Average Score</p>
          <h2 style={{ fontSize: '3rem', margin: '0.5rem 0' }}>{stats.avg}/10</h2>
          <span className={`badge ${stats.avg > 7 ? 'badge-success' : 'badge-warning'}`}>
            {stats.avg > 7 ? 'Proficient' : stats.avg > 4 ? 'Developing' : 'Beginner'}
          </span>
        </div>

        <div className="glass-card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Progress Trend</p>
          <h2 style={{ fontSize: '2.5rem', margin: '1rem 0' }}>{stats.trend}</h2>
          <span className={`badge ${stats.trend === 'Improving' ? 'badge-success' : 'badge-warning'}`}>
            {stats.trend}
          </span>
        </div>

        <div className="glass-card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sessions</p>
          <h2 style={{ fontSize: '3rem', margin: '0.5rem 0' }}>{history.length}</h2>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>Total Completed</span>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem' }}>Student Details</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Child's Name</label>
          <input 
            type="text" 
            placeholder="Enter Student Name" 
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '1rem', 
              borderRadius: '12px', 
              background: '#1e293b', 
              color: 'white', 
              border: '1px solid var(--glass-border)',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>

      <div className="glass-card">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem' }}>Start New Session</h2>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Grade Level</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#1e293b', color: 'white', border: '1px solid var(--glass-border)' }}
            >
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Difficulty</label>
            <select 
              value={selectedDiff} 
              onChange={(e) => setSelectedDiff(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', background: '#1e293b', color: 'white', border: '1px solid var(--glass-border)' }}
            >
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button 
            className="btn-primary" 
            style={{ height: '3.1rem', padding: '0 2.5rem' }}
            onClick={() => {
              if (!childName.trim()) {
                alert("Please enter the child's name first.");
                return;
              }
              onStartAssessment(selectedGrade, childName);
            }}
          >
            Start Assessment →
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Recent Activity</h2>
          <div className="grid" style={{ gap: '1rem' }}>
            {history.slice(0, 5).map(h => (
              <div key={h.id} className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{h.childName}'s {h.grade} Assessment</h4>
                  <small style={{ color: 'var(--text-muted)' }}>{new Date(h.date).toLocaleDateString()}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{h.score}/10</div>
                  <div className="badge badge-success" style={{ fontSize: '0.75rem' }}>{h.level}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
