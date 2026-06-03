import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const getMuscleEmoji = (muscleGroup) => {
  const group = muscleGroup?.toLowerCase() || '';
  if (group.includes('piernas') || group.includes('gemelos') || group.includes('glúteos')) return '🦵';
  if (group.includes('bíceps') || group.includes('tríceps') || group.includes('brazos') || group.includes('hombros')) return '💪';
  if (group.includes('abdominales') || group.includes('core')) return '🍫'; // Representa el six-pack
  if (group.includes('espalda') || group.includes('pectoral') || group.includes('pecho')) return '🏋️‍♂️';
  return '🏋️';
};

const Dashboard = () => {
  const [routines, setRoutines] = useState([]);
  const [activeRoutineId, setActiveRoutineId] = useState('draft');
  const [todayPlan, setTodayPlan] = useState(null);
  const [stats, setStats] = useState({ time: 0, calories: 0, muscles: 'Ninguno' });
  const [tracking, setTracking] = useState({});

  useEffect(() => {
    // Cargar historial de tracking de hoy
    const todayStr = new Date().toISOString().split('T')[0];
    const trackingCacheKey = `fitplanner-tracking-${todayStr}`;
    const savedTracking = localStorage.getItem(trackingCacheKey);
    if (savedTracking) {
      try {
        setTracking(JSON.parse(savedTracking));
      } catch (e) {
        console.error('Error parsing tracking data:', e);
      }
    }

    // Cargar rutinas y rutina activa seleccionada previamente
    const savedActiveId = localStorage.getItem('fitplanner-active-routine') || 'draft';
    setActiveRoutineId(savedActiveId);

    try {
      const persisted = localStorage.getItem('fitplanner-v1');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        const allRoutines = [{ id: 'draft', nombre: parsed.plan?.nombre || 'Borrador Actual', plan: parsed.plan }];
        if (parsed.savedRoutines && parsed.savedRoutines.length > 0) {
          allRoutines.push(...parsed.savedRoutines);
        }
        setRoutines(allRoutines);
      }
    } catch (e) {
      console.error('Error cargando rutinas desde caché:', e);
    }
  }, []);

  // Efecto secundario: cuando cambia la rutina activa, actualizar todayPlan
  useEffect(() => {
    if (routines.length === 0) return;
    
    const activeRoutine = routines.find(r => r.id === activeRoutineId) || routines[0];
    const plan = activeRoutine?.plan;

    if (plan && plan.dias) {
      const jsDay = new Date().getDay(); // 0=Domingo, 1=Lunes
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const todayName = dayNames[jsDay];
      
      const currentDay = plan.dias.find(d => d.diaNombre === todayName);
      if (currentDay && !currentDay.isDescanso && currentDay.ejercicios && currentDay.ejercicios.length > 0) {
        setTodayPlan(currentDay);
        
        const totalSeries = currentDay.ejercicios.reduce((acc, ex) => acc + (Number(ex.series) || 0), 0);
        
        const musclesSet = new Set();
        currentDay.ejercicios.forEach(ex => {
          if (ex.grupoMuscularPrincipal) musclesSet.add(ex.grupoMuscularPrincipal);
        });
        
        setStats({
          time: totalSeries * 3, // estimado: 3 min por serie
          calories: totalSeries * 15, // estimado: 15 kcal por serie
          muscles: Array.from(musclesSet).join(', ') || 'Varios'
        });
      } else {
        setTodayPlan(null);
        setStats({ time: 0, calories: 0, muscles: 'Ninguno' });
      }
    } else {
      setTodayPlan(null);
      setStats({ time: 0, calories: 0, muscles: 'Ninguno' });
    }
  }, [activeRoutineId, routines]);

  const handleRoutineChange = (e) => {
    const newId = e.target.value;
    setActiveRoutineId(newId);
    localStorage.setItem('fitplanner-active-routine', newId);
  };

  const handleStatusChange = (id, newStatus) => {
    const updated = { ...tracking, [id]: newStatus };
    setTracking(updated);
    
    // Guardar en cache por fecha
    const todayStr = new Date().toISOString().split('T')[0];
    const cacheKey = `fitplanner-tracking-${todayStr}`;
    localStorage.setItem(cacheKey, JSON.stringify(updated));
  };

  const getStatusColor = (status) => {
    if (status === 'done') return 'rgba(20, 184, 166, 0.2)'; // success
    if (status === 'in-progress') return 'rgba(99, 102, 241, 0.2)'; // accent
    return 'var(--panel-soft)'; // todo
  };

  const getStatusBorder = (status) => {
    if (status === 'done') return 'rgba(20, 184, 166, 0.5)';
    if (status === 'in-progress') return 'rgba(99, 102, 241, 0.5)';
    return 'var(--border-color)';
  };

  const groupedExercises = useMemo(() => {
    if (!todayPlan) return { todo: [], inProgress: [], done: [] };
    const result = { todo: [], inProgress: [], done: [] };
    todayPlan.ejercicios.forEach(ex => {
      const st = tracking[ex.id] || 'todo';
      if (st === 'done') result.done.push(ex);
      else if (st === 'in-progress') result.inProgress.push(ex);
      else result.todo.push(ex);
    });
    return result;
  }, [todayPlan, tracking]);

  const renderExercise = (workout) => {
    const currentStatus = tracking[workout.id] || 'todo';
    return (
      <div key={workout.id} className="workout-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <div className="workout-icon" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'transparent', fontSize: '1.8rem'}}>
            {getMuscleEmoji(workout.grupoMuscularPrincipal)}
          </div>
          <div className="workout-details">
            <h4>{workout.nombre}</h4>
            <span>{workout.series} series • {workout.repeticiones} reps • {workout.grupoMuscularPrincipal}</span>
          </div>
        </div>
        <div className="workout-tracking">
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(workout.id, e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${getStatusBorder(currentStatus)}`,
              background: getStatusColor(currentStatus),
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}
          >
            <option value="todo" style={{background: 'var(--panel-bg)'}}>Por realizar</option>
            <option value="in-progress" style={{background: 'var(--panel-bg)'}}>Realizándose</option>
            <option value="done" style={{background: 'var(--panel-bg)'}}>Realizado</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-wrapper">
      <main className="dashboard-content">
        <section className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>Resumen de tu progreso</h1>
            <p>¡Buen trabajo esta semana! Mantén el ritmo.</p>
          </div>
          <div style={{ background: 'var(--panel-soft)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Rutina Activa:</label>
            <select 
              value={activeRoutineId} 
              onChange={handleRoutineChange}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            >
              {routines.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card glass-panel">
            <div className="stat-icon timer-icon" style={{ fontSize: '1.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>⏱️</div>
            <div className="stat-info">
              <h3>Tiempo Activo Hoy</h3>
              <p className="stat-value">{stats.time} min</p>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon calories-icon" style={{ fontSize: '1.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>🔥</div>
            <div className="stat-info">
              <h3>Calorías Estimadas</h3>
              <p className="stat-value">{stats.calories} kcal</p>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon" style={{ fontSize: '1.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>💪</div>
            <div className="stat-info">
              <h3>Enfoque Muscular</h3>
              <p className="stat-value">{stats.muscles}</p>
            </div>
          </div>
        </section>

        <section className="recent-workouts glass-panel">
          <div className="workouts-header">
            <h2>Entrenamiento de Hoy</h2>
            <Link to="/planner" className="btn-primary btn-sm" style={{textDecoration: 'none', padding: '8px 16px', display: 'inline-block'}}>Ir al Planificador</Link>
          </div>
          
          <div className="workouts-list">
            {!todayPlan ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--panel-soft)', borderRadius: '12px', marginTop: '10px' }}>
                <p style={{fontSize: '1.1rem', marginBottom: '8px'}}>No tienes ejercicios planificados para hoy en esta rutina.</p>
                <p style={{fontSize: '0.9rem'}}>¡Aprovecha para descansar o crea una nueva rutina en el planificador!</p>
              </div>
            ) : (
              <>
                {groupedExercises.todo.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Por realizar</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {groupedExercises.todo.map(renderExercise)}
                    </div>
                  </div>
                )}
                
                {groupedExercises.inProgress.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-secondary)', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Realizándose</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {groupedExercises.inProgress.map(renderExercise)}
                    </div>
                  </div>
                )}
                
                {groupedExercises.done.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--success-color)', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Realizados</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {groupedExercises.done.map(renderExercise)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
