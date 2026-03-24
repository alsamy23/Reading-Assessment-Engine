export interface HistoryRecord {
  id: string;
  date: string;
  childName: string;
  grade: string;
  score: number;
  level: string;
}

export const saveHistory = (record: Omit<HistoryRecord, 'id' | 'date'>) => {
  const history = getHistory();
  const newRecord: HistoryRecord = {
    ...record,
    id: crypto.randomUUID(),
    date: new Date().toISOString()
  };
  localStorage.setItem('reading_assessment_history', JSON.stringify([newRecord, ...history]));
};

export const getHistory = (): HistoryRecord[] => {
  const history = localStorage.getItem('reading_assessment_history');
  return history ? JSON.parse(history) : [];
};

export const getProgressTrend = (): 'Improving' | 'Stable' | 'Needs Attention' => {
  const history = getHistory();
  if (history.length < 2) return 'Stable';
  
  const lastScore = history[0].score;
  const prevScore = history[1].score;

  if (lastScore > prevScore) return 'Improving';
  if (lastScore < prevScore) return 'Needs Attention';
  return 'Stable';
};

export const getAverageScore = (): number => {
  const history = getHistory();
  if (history.length === 0) return 0;
  const sum = history.reduce((acc, curr) => acc + curr.score, 0);
  return Number((sum / history.length).toFixed(1));
};
