import './Dashboard.css';

const Dashboard = () => {
  const workouts = [
    { id: 1, type: 'Fuerza (Tren Superior)', date: 'Hoy', duration: '45 min', calories: 320 },
    { id: 2, type: 'Cardio (HIIT)', date: 'Ayer', duration: '30 min', calories: 400 },
    { id: 3, type: 'Piernas y Glúteos', date: 'Hace 2 días', duration: '50 min', calories: 350 },
  ];

  return (
    <div className="dashboard-wrapper">
      <main className="dashboard-content">
        <section className="welcome-section">
          <h1>Resumen de tu progreso</h1>
          <p>¡Buen trabajo esta semana! Mantén el ritmo.</p>
        </section>

        <section className="stats-grid">
          <div className="stat-card glass-panel">
            <div className="stat-icon timer-icon"></div>
            <div className="stat-info">
              <h3>Tiempo Activo</h3>
              <p className="stat-value">125 min</p>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon calories-icon"></div>
            <div className="stat-info">
              <h3>Calorías</h3>
              <p className="stat-value">1,070 kcal</p>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon streak-icon"></div>
            <div className="stat-info">
              <h3>Racha Actual</h3>
              <p className="stat-value">3 días</p>
            </div>
          </div>
        </section>

        <section className="recent-workouts glass-panel">
          <div className="workouts-header">
            <h2>Entrenamientos Recientes</h2>
            <button className="btn-primary btn-sm">Nuevo Entrenamiento</button>
          </div>
          
          <div className="workouts-list">
            {workouts.map(workout => (
              <div key={workout.id} className="workout-item">
                <div className="workout-icon"></div>
                <div className="workout-details">
                  <h4>{workout.type}</h4>
                  <span>{workout.date} • {workout.duration} • {workout.calories} kcal</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
