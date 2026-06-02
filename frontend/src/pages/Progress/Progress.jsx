import { useState, useEffect } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import './Progress.css';

const Progress = () => {
  const today = new Date();
  const year = today.getFullYear();
  const monthIdx = today.getMonth();
  const month = String(monthIdx + 1).padStart(2, '0');
  
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    // Simulando un historial en caché de ejercicios realizados ("history-v1")
    // que usa los grupos musculares exactos detallados en el proyecto (Pectoral, Espalda, Piernas, etc.)
    const simulatedHistory = [
      { date: `${year}-${month}-02`, intensity: 2, muscles: 'Pectoral, Tríceps', time: '45 min' },
      { date: `${year}-${month}-05`, intensity: 1, muscles: 'Abdominales', time: '20 min' },
      { date: `${year}-${month}-06`, intensity: 4, muscles: 'Espalda, Bíceps', time: '60 min' },
      { date: `${year}-${month}-08`, intensity: 3, muscles: 'Piernas, Glúteos', time: '50 min' },
      { date: `${year}-${month}-12`, intensity: 2, muscles: 'Hombros, Abdominales', time: '40 min' },
      { date: `${year}-${month}-13`, intensity: 2, muscles: 'Pectoral', time: '45 min' },
      { date: `${year}-${month}-14`, intensity: 4, muscles: 'Piernas, Gemelos', time: '75 min' },
      { date: `${year}-${month}-15`, intensity: 1, muscles: 'Abdominales', time: '15 min' },
      { date: `${year}-${month}-20`, intensity: 3, margin: 'Espalda', time: '50 min', muscles: 'Espalda' },
      { date: `${year}-${month}-21`, intensity: 2, muscles: 'Bíceps, Tríceps', time: '40 min' },
      { date: `${year}-${month}-24`, intensity: 4, muscles: 'Pectoral, Espalda, Piernas', time: '80 min' },
      { date: `${year}-${month}-25`, intensity: 3, muscles: 'Pectoral, Hombros', time: '55 min' },
      { date: `${year}-${month}-26`, intensity: 1, muscles: 'Abdominales', time: '30 min' },
      { date: `${year}-${month}-27`, intensity: 2, muscles: 'Piernas, Abdominales', time: '45 min' },
    ];

    setWorkouts(simulatedHistory);
  }, [year, month]);

  const currentStreak = 4; // Valor simulado
  const maxStreak = 12; // Valor histórico

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
