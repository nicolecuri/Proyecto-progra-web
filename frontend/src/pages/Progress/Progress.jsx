import { useState } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import './Progress.css';

const Progress = () => {
  const today = new Date();
  const year = today.getFullYear();
  const monthIdx = today.getMonth();
  const month = String(monthIdx + 1).padStart(2, '0');
  
  const [workouts] = useState(() => {
    const defaultWorkouts = [
      { date: `${year}-${month}-02`, intensity: 2, muscles: 'Pectoral, Tríceps', time: '45 min' },
      { date: `${year}-${month}-05`, intensity: 1, muscles: 'Abdominales', time: '20 min' },
      { date: `${year}-${month}-06`, intensity: 4, muscles: 'Espalda, Bíceps', time: '60 min' },
      { date: `${year}-${month}-08`, intensity: 3, muscles: 'Piernas, Glúteos', time: '50 min' },
      { date: `${year}-${month}-12`, intensity: 2, muscles: 'Hombros, Abdominales', time: '40 min' },
      { date: `${year}-${month}-13`, intensity: 2, muscles: 'Pectoral', time: '45 min' },
      { date: `${year}-${month}-14`, intensity: 4, muscles: 'Piernas, Gemelos', time: '75 min' },
      { date: `${year}-${month}-15`, intensity: 1, muscles: 'Abdominales', time: '15 min' },
      { date: `${year}-${month}-20`, intensity: 3, muscles: 'Espalda', time: '50 min' },
      { date: `${year}-${month}-21`, intensity: 2, muscles: 'Bíceps, Tríceps', time: '40 min' },
      { date: `${year}-${month}-24`, intensity: 4, muscles: 'Pectoral, Espalda, Piernas', time: '80 min' },
      { date: `${year}-${month}-25`, intensity: 3, muscles: 'Pectoral, Hombros', time: '55 min' },
      { date: `${year}-${month}-26`, intensity: 1, muscles: 'Abdominales', time: '30 min' },
      { date: `${year}-${month}-27`, intensity: 2, muscles: 'Piernas, Abdominales', time: '45 min' },
    ];
    
    const historyRaw = localStorage.getItem('fitplanner-history');
    if (!historyRaw) {
      const initialHistory = {};
      defaultWorkouts.forEach(w => { initialHistory[w.date] = w; });
      localStorage.setItem('fitplanner-history', JSON.stringify(initialHistory));
      return defaultWorkouts;
    }
    
    const historyMap = JSON.parse(historyRaw);
    return Object.values(historyMap);
  });

  const calculateStreak = (historyArray) => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (historyArray.some(w => w.date === dateStr)) {
        streak++;
      } else if (i === 0) {
        // Ignorar si hoy aun no entrenó
        continue;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak(workouts);
  const maxStreak = Math.max(12, currentStreak); // Valor histórico o la racha actual

  return (
    <div className="progress-wrapper">
      <main className="progress-content">
        <section className="progress-header">
          <h1>Tu Progreso</h1>
          <p>Revisa tu constancia y la intensidad de tus entrenamientos a lo largo del mes.</p>
        </section>

        <section className="streak-container">
          <div className="streak-card glass-panel highlight">
            <div className="streak-icon fire-icon">🔥</div>
            <div className="streak-info">
              <h3>Racha Actual</h3>
              <p className="streak-value">{currentStreak} días</p>
            </div>
          </div>
          <div className="streak-card glass-panel">
            <div className="streak-icon trophy-icon">🏆</div>
            <div className="streak-info">
              <h3>Mejor Racha</h3>
              <p className="streak-value">{maxStreak} días</p>
            </div>
          </div>
          <div className="streak-card glass-panel">
            <div className="streak-icon activity-icon">⚡</div>
            <div className="streak-info">
              <h3>Entrenamientos este Mes</h3>
              <p className="streak-value">{workouts.length}</p>
            </div>
          </div>
        </section>

        <section className="calendar-section">
          <h2>Calendario de Intensidad</h2>
          <Calendar workoutData={workouts} />
        </section>
      </main>
    </div>
  );
};

export default Progress;
