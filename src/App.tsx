
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import AssessmentEngine from './components/AssessmentEngine';
import FeedbackModule from './components/FeedbackModule';
import VideoShowcase from './components/VideoShowcase';
import type { AssessmentResult } from './services/assessmentService';

type AppState = 'dashboard' | 'assessment' | 'feedback';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>('dashboard');
  const [childName, setChildName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Grade 1');
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const startAssessment = (grade: string, name: string) => {
    setSelectedGrade(grade);
    setChildName(name);
    setState('assessment');
  };

  const handleAssessmentComplete = (res: AssessmentResult) => {
    setResult(res);
    setState('feedback');
  };

  const handleFinish = () => {
    setState('dashboard');
    setResult(null);
  };

  const handleRetry = () => {
    setState('assessment');
    setResult(null);
  };

  const handleCancel = () => {
    setState('dashboard');
  };

  return (
    <div className="app-root">
      {state === 'dashboard' && (
        <>
          <VideoShowcase />
          <Dashboard onStartAssessment={startAssessment} />
        </>
      )}
      
      {state === 'assessment' && (
        <AssessmentEngine 
          grade={selectedGrade} 
          childName={childName}
          onComplete={handleAssessmentComplete}
          onCancel={handleCancel}
        />
      )}

      {state === 'feedback' && result && (
        <FeedbackModule 
          result={result} 
          childName={childName}
          onFinish={handleFinish} 
          onRetry={handleRetry} 
        />
      )}

      <footer style={{ 
        textAlign: 'center', 
        padding: '2rem', 
        color: 'var(--text-muted)', 
        fontSize: '0.875rem',
        marginTop: 'auto'
      }}>
        © 2026 AI Reading Assessment Engine • Premium Educational Tools
      </footer>
    </div>
  );
};

export default App;
