import Calendar from '../../components/Calendar/Calendar';
import './Progress.css';

const Progress = () => {
  // Datos simulados para Mayo 2026 (mes actual según el sistema)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  
  const mockWorkouts = [
    { date: `${year}-${month}-02`, intensity: 2 },
    { date: `${year}-${month}-05`, intensity: 1 },
    { date: `${year}-${month}-06`, intensity: 4 },
    { date: `${year}-${month}-08`, intensity: 3 },
    { date: `${year}-${month}-12`, intensity: 2 },
    { date: `${year}-${month}-13`, intensity: 2 },
    { date: `${year}-${month}-14`, intensity: 4 },
    { date: `${year}-${month}-15`, intensity: 1 },
    { date: `${year}-${month}-20`, intensity: 3 },
    { date: `${year}-${month}-21`, intensity: 2 },
    { date: `${year}-${month}-24`, intensity: 4 },
    { date: `${year}-${month}-25`, intensity: 3 },
    { date: `${year}-${month}-26`, intensity: 1 },
    { date: `${year}-${month}-27`, intensity: 2 }, // Streak actual
  ];

  // Cálculo simple de racha simulado (días consecutivos recientes)
  const currentStreak = 4; // Valor simulado basado en 24, 25, 26, 27
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
              <p className="streak-value">{mockWorkouts.length}</p>
            </div>
          </div>
        </section>

        <section className="calendar-section">
          <h2>Calendario de Intensidad</h2>
          <Calendar workoutData={mockWorkouts} />
        </section>
      </main>
    </div>
  );
};

export default Progress;
