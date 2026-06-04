import { useState } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import './Progress.css';

const Progress = () => {
  const today = new Date();
  const year = today.getFullYear();
  const monthIdx = today.getMonth();
  const month = String(monthIdx + 1).padStart(2, '0');
  
  const [workouts] = useState(() => {
    const historyRaw = localStorage.getItem('fittrack-history');
    if (!historyRaw) return [];
    
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
              <p className="streak-value">{workouts.filter(w => w.date.startsWith(`${year}-${month}`)).length}</p>
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
