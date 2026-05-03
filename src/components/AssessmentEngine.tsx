import React, { useState, useEffect, useRef } from 'react';
import { evaluateReading, calculateIELTSBand } from '../services/assessmentService';
import type { AssessmentResult } from '../services/assessmentService';
import { saveHistory } from '../services/historyService';
import passagesData from '../data/passages.json';
import { analyzeReadingWithAI, generateComprehensionQuestionsLocal } from '../services/geminiService';

interface AssessmentEngineProps {
  grade: string;
  childName: string;
  onComplete: (result: AssessmentResult) => void;
  onCancel: () => void;
}

type PassageMode = 'automated' | 'custom';
type RecordingState = 'idle' | 'recording' | 'done';

const AssessmentEngine: React.FC<AssessmentEngineProps> = ({ grade, childName, onComplete, onCancel }) => {
  const [mode, setMode] = useState<PassageMode>('automated');
  const [autoPassage, setAutoPassage] = useState<any>(null);
  const [customText, setCustomText] = useState('');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [timer, setTimer] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcription, setTranscription] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  // Use ref for transcript so it's always current at submit time
  const transcriptRef = useRef('');

  useEffect(() => {
    setQuestions([]);
    setAudioBlob(null);
    setAudioURL(null);
    setTranscription('');
    transcriptRef.current = '';
    setRecordingState('idle');
    const found = (passagesData as any).passages.find((p: any) => p.grade === grade)
      || (passagesData as any).passages[0];
    setAutoPassage(found);
  }, [grade, mode]);

  const activeText = mode === 'automated' ? autoPassage?.content || '' : customText;
  const guidedText = mode === 'automated' ? autoPassage?.guided || '' : customText;

  const startMicVisualizer = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const tick = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setMicLevel(Math.min(100, avg * 2.2));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* ignore */ }
  };

  const stopMicVisualizer = () => {
    cancelAnimationFrame(animFrameRef.current);
    setMicLevel(0);
  };

  const startRecording = async () => {
    setError('');
    transcriptRef.current = '';
    setTranscription('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Web Speech API — capture transcript in real time
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false; // final results only = more reliable
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let allFinal = '';
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              allFinal += event.results[i][0].transcript + ' ';
            }
          }
          transcriptRef.current = allFinal.trim();
          setTranscription(allFinal.trim());
        };
        recognition.onerror = () => {};
        recognition.onend = () => {
          // auto-restart if still recording (some browsers stop recognition after 60s)
          if (mediaRecorderRef.current?.state === 'recording') {
            try { recognition.start(); } catch { /* ignore */ }
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      // MediaRecorder for audio blob
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        stopMicVisualizer();
        setRecordingState('done');
      };
      recorder.start();
      startMicVisualizer(stream);
      setRecordingState('recording');
      setTimer(0);
      timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
    } catch {
      setError('Microphone access was denied. Please allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    }
  };

  const handleGenerateQuestions = async () => {
    if (!activeText.trim()) { alert('Please provide a passage first.'); return; }
    setIsGeneratingQuestions(true);
    try {
      const result = await generateComprehensionQuestionsLocal(activeText, grade);
      setQuestions(result);
    } catch { /* silent */ }
    finally { setIsGeneratingQuestions(false); }
  };

  const handleSubmit = async () => {
    if (!activeText.trim() || !audioBlob) return;

    // Grab transcript — prefer ref (always up to date) over state
    const finalTranscript = transcriptRef.current || transcription || '';
    const hasAudio = audioBlob.size > 0;

    // Local scoring first (instant, no API needed)
    let result = evaluateReading(activeText, finalTranscript, guidedText, hasAudio);

    setIsLoadingAI(true);
    try {
      // Convert audio to base64
      const audioBase64: string = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(audioBlob);
      });

      const aiResult = await analyzeReadingWithAI({
        originalText: activeText,
        transcription: finalTranscript,
        audioBase64,
        grade,
      });

      // Only override if AI returned valid scores (not fallback zeros)
      if (aiResult.score) {
        const { fluency, lexicalResource, grammar, pronunciation } = aiResult.score;
        const total = fluency + lexicalResource + grammar + pronunciation;
        // Sanity check — reject if AI returned suspiciously low score with no transcript
        if (total > 4 || finalTranscript.length > 0) {
          const band = calculateIELTSBand(total);
          result.score = { fluency, lexicalResource, grammar, pronunciation, total, band };
          result.level = band >= 7.5 ? 'Advanced' : band >= 6.0 ? 'Proficient' : band >= 4.0 ? 'Developing' : 'Beginner';
        }
      }
      if (aiResult.feedback?.length) result.feedback = aiResult.feedback;
      if (aiResult.recommendation) result.recommendation = aiResult.recommendation;
    } catch { /* keep local result */ }
    finally { setIsLoadingAI(false); }

    saveHistory({
      childName,
      grade: mode === 'automated' ? (autoPassage?.grade || grade) : 'Custom',
      score: result.score.band,
      level: result.level,
    });
    onComplete(result);
  };

  if (!autoPassage && mode === 'automated') return <div style={{ color: 'white', padding: '2rem' }}>Loading...</div>;

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '900px' }}>
      <button onClick={onCancel} className="btn-secondary" style={{ marginBottom: '2rem', background: 'none' }}>← Back</button>
      <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Reading Assessment</h1>
      <div className="badge badge-purple" style={{ marginBottom: '2rem', display: 'inline-block' }}>IELTS Speaking Standards</div>

      {/* Mode Toggle */}
      <div className="glass-card" style={{ marginBottom: '2rem', padding: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {(['automated', 'custom'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '0.875rem', borderRadius: '16px', border: 'none',
              background: mode === m ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
              color: 'white', fontWeight: 600, cursor: 'pointer',
            }}>
              {m === 'automated' ? `📚 Level: ${grade}` : '✏️ Custom Text'}
            </button>
          ))}
        </div>
      </div>

      {/* Passage Card */}
      <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'white', margin: 0 }}>
            {mode === 'automated' ? `📖 ${autoPassage.title}` : '✏️ Custom Passage'}
          </h2>
          {recordingState === 'recording' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', animation: 'pulseRec 1.5s infinite' }} />
              <span style={{ fontWeight: 700 }}>{formatTime(timer)}</span>
            </div>
          )}
        </div>

        {mode === 'automated' ? (
          <div style={{
            fontSize: '1.4rem', lineHeight: '2.1', color: 'var(--text-main)', padding: '1.75rem',
            background: 'rgba(5,1,26,0.4)', borderRadius: '20px', marginBottom: '1.5rem',
            textAlign: 'center', border: '1px solid var(--glass-border)', letterSpacing: '0.01em',
          }}>
            {autoPassage.content}
          </div>
        ) : (
          <textarea
            placeholder="Paste your custom passage here..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            style={{
              width: '100%', minHeight: '150px', padding: '1.25rem', borderRadius: '16px',
              background: 'rgba(5,1,26,0.4)', color: 'white', border: '1px solid var(--glass-border)',
              fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.7',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        )}

        {/* Live mic visualizer */}
        {recordingState === 'recording' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem', textAlign: 'center' }}>
              🎤 Microphone active — read the passage clearly
            </p>
            <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                width: `${micLevel}%`, height: '100%', borderRadius: '10px',
                background: micLevel > 60 ? '#4ade80' : micLevel > 20 ? '#fbbf24' : '#ef4444',
                transition: 'width 0.1s ease',
              }} />
            </div>
            {transcription && (
              <p style={{ marginTop: '0.75rem', color: 'rgba(139,92,246,0.9)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                ✓ Detected: "{transcription.slice(-120)}"
              </p>
            )}
          </div>
        )}

        {/* Done — audio review */}
        {recordingState === 'done' && audioURL && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: 'rgba(74,222,128,0.08)', borderRadius: '12px', border: '1px solid rgba(74,222,128,0.2)' }}>
            <p style={{ color: '#4ade80', fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              ✅ Recording saved ({Math.round(audioBlob!.size / 1024)} KB)
            </p>
            <audio src={audioURL} controls style={{ width: '100%' }} />
            {transcription ? (
              <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <strong style={{ color: 'var(--primary)' }}>Speech detected:</strong> "{transcription.slice(0, 200)}"
              </p>
            ) : (
              <p style={{ marginTop: '0.75rem', color: '#fbbf24', fontSize: '0.85rem' }}>
                ⚠️ Speech-to-text not available in this browser — score will be based on audio analysis.
              </p>
            )}
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <div className="animate-fade-in" style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(139,92,246,0.08)', borderRadius: '16px', border: '1px solid rgba(139,92,246,0.2)' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>📚 Comprehension Questions</h3>
            <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
              {questions.map((q, i) => <li key={i} style={{ padding: '0.5rem 0', color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>{q}</li>)}
            </ol>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {recordingState === 'idle' && (
            <>
              <button className="btn-primary" onClick={startRecording} style={{ padding: '1rem 3rem' }}>🎤 Start Recording</button>
              <button className="btn-secondary" onClick={handleGenerateQuestions} disabled={isGeneratingQuestions} style={{ borderRadius: '100px', padding: '1rem 2rem' }}>
                {isGeneratingQuestions ? '⏳ Generating...' : '✨ Generate Questions'}
              </button>
            </>
          )}
          {recordingState === 'recording' && (
            <button className="btn-primary" onClick={stopRecording}
              style={{ padding: '1rem 4rem', background: '#ef4444', boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}>
              ⏹ Stop Recording
            </button>
          )}
          {recordingState === 'done' && (
            <>
              <button className="btn-secondary" onClick={() => { setRecordingState('idle'); setAudioBlob(null); setAudioURL(null); setTranscription(''); transcriptRef.current = ''; }} style={{ padding: '0.875rem 2rem' }}>
                🔄 Re-record
              </button>
              <button className="btn-secondary" onClick={handleGenerateQuestions} disabled={isGeneratingQuestions} style={{ borderRadius: '100px', padding: '0.875rem 2rem' }}>
                {isGeneratingQuestions ? '⏳ Generating...' : '✨ Generate Questions'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="glass-card">
        <h3 style={{ margin: '0 0 1rem', color: 'white' }}>Submit for Analysis</h3>
        {recordingState !== 'done' ? (
          <div style={{ padding: '1rem', background: 'rgba(255,191,36,0.08)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(251,191,36,0.2)' }}>
            <span style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
              {recordingState === 'idle' ? '⚠️ Please record your reading first.' : '⏺ Recording in progress — stop the recording first.'}
            </span>
          </div>
        ) : (
          <div style={{ padding: '1rem', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(139,92,246,0.3)', textAlign: 'center' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ Audio ready — click submit to get your IELTS band score</span>
          </div>
        )}
        <button className="btn-primary" onClick={handleSubmit}
          disabled={recordingState !== 'done' || isLoadingAI}
          style={{ width: '100%', opacity: recordingState !== 'done' ? 0.5 : 1 }}>
          {isLoadingAI ? '⏳ Analysing your reading...' : 'Submit & Get Results →'}
        </button>
      </div>

      <style>{`
        @keyframes pulseRec {
          0%,100%{ opacity:1; transform:scale(1); }
          50%{ opacity:0.4; transform:scale(1.4); }
        }
      `}</style>
    </div>
  );
};

export default AssessmentEngine;
