import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';
import { getCurrentUser } from '../../services/userStorage';

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
  const [tracking, setTracking] = useState({});

  // Timer states
  const [suggestTimerFor, setSuggestTimerFor] = useState(null);
  const [timerMinutesInput, setTimerMinutesInput] = useState(3);
  const [activeTimer, setActiveTimer] = useState(null);

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
      const user = getCurrentUser()
      const ident = user ? (user.correo || user.id || user.nombre) : 'guest'
      const key = `fitplanner-v1:${ident}`
      const persisted = localStorage.getItem(key)
      if (persisted) {
        const parsed = JSON.parse(persisted)
        const allRoutines = [{ id: 'draft', nombre: parsed.plan?.nombre || 'Borrador Actual', plan: parsed.plan }]
        if (parsed.savedRoutines && parsed.savedRoutines.length > 0) {
          allRoutines.push(...parsed.savedRoutines)
        }
        setRoutines(allRoutines)
      }
    } catch (e) {
      console.error('Error cargando rutinas desde caché:', e)
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
      } else {
        setTodayPlan(null);
      }
    } else {
      setTodayPlan(null);
    }
  }, [activeRoutineId, routines]);

  // Cálculo de estadísticas dinámicas basadas en ejercicios completados
  const stats = useMemo(() => {
    if (!todayPlan) return { time: 0, calories: 0, muscles: 'Ninguno' };
    
    let totalSeriesDone = 0;
    const musclesSet = new Set();
    
    todayPlan.ejercicios.forEach(ex => {
      if (tracking[ex.id] === 'done') {
        totalSeriesDone += (Number(ex.series) || 0);
        if (ex.grupoMuscularPrincipal) musclesSet.add(ex.grupoMuscularPrincipal);
      }
    });

    return {
      time: totalSeriesDone * 3, // 3 min por serie
      calories: totalSeriesDone * 15, // 15 kcal por serie
      muscles: Array.from(musclesSet).join(', ') || 'Ninguno'
    };
  }, [todayPlan, tracking]);

  const handleStatusChange = (id, newStatus) => {
    setTracking(prev => {
      const updated = { ...prev, [id]: newStatus };
      const todayStr = new Date().toISOString().split('T')[0];
      const cacheKey = `fitplanner-tracking-${todayStr}`;
      localStorage.setItem(cacheKey, JSON.stringify(updated));
      return updated;
    });

    if (newStatus === 'in-progress' && todayPlan) {
       const workout = todayPlan.ejercicios.find(ex => ex.id === id);
       if (workout) {
         setSuggestTimerFor(workout);
         setTimerMinutesInput(workout.series * 3 || 3);
       }
    }
  };

  const startTimer = () => {
    setActiveTimer({
      workoutId: suggestTimerFor.id,
      remainingSeconds: Math.max(1, timerMinutesInput * 60),
      isMinimized: false
    });
    setSuggestTimerFor(null);
  };

  useEffect(() => {
    let interval = null;
    if (activeTimer && activeTimer.remainingSeconds > 0) {
      interval = setInterval(() => {
        setActiveTimer(prev => {
          if (!prev) return null;
          if (prev.remainingSeconds <= 1) {
            clearInterval(interval);
            // Marcar como realizado automáticamente
            handleStatusChange(prev.workoutId, 'done');
            return null; // El timer termina
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const handleRoutineChange = (e) => {
    const newId = e.target.value;
    setActiveRoutineId(newId);
    localStorage.setItem('fitplanner-active-routine', newId);
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

      {/* Modal de Sugerencia de Timer */}
      {suggestTimerFor && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px', width: '320px', textAlign: 'center', background: 'var(--panel-bg)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Iniciar Temporizador</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>¿Deseas iniciar un contador para <strong>{suggestTimerFor.nombre}</strong>?</p>
            <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <label style={{ color: 'var(--text-primary)' }}>Minutos: </label>
              <input 
                type="number" 
                min="1"
                value={timerMinutesInput} 
                onChange={(e) => setTimerMinutesInput(e.target.value)} 
                style={{ width: '60px', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--panel-soft)', color: 'white', textAlign: 'center' }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
              <button onClick={() => setSuggestTimerFor(null)} style={{ flex: 1, padding: '10px', background: 'var(--panel-soft)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button onClick={startTimer} style={{ flex: 1, padding: '10px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {/* Timer Activo */}
      {activeTimer && (
        <div style={{
          position: 'fixed',
          bottom: activeTimer.isMinimized ? '20px' : '50%',
          right: activeTimer.isMinimized ? '20px' : '50%',
          transform: activeTimer.isMinimized ? 'none' : 'translate(50%, 50%)',
          width: activeTimer.isMinimized ? '200px' : '300px',
          padding: '20px',
          background: 'var(--panel-soft)',
          border: '1px solid var(--accent-color)',
          borderRadius: '16px',
          zIndex: 1500,
          textAlign: 'center',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <h3 style={{ fontSize: activeTimer.isMinimized ? '1.8rem' : '3rem', margin: '0 0 15px 0', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
            {Math.floor(activeTimer.remainingSeconds / 60)}:{String(activeTimer.remainingSeconds % 60).padStart(2, '0')}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button onClick={() => setActiveTimer(prev => ({ ...prev, isMinimized: !prev.isMinimized }))} style={{ flex: 1, padding: '8px', fontSize: '0.85rem', background: 'var(--panel-bg)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
              {activeTimer.isMinimized ? 'Maximizar' : 'Minimizar'}
            </button>
            <button onClick={() => setActiveTimer(null)} style={{ flex: 1, padding: '8px', fontSize: '0.85rem', background: 'transparent', color: 'var(--error-color)', border: '1px solid var(--error-color)', borderRadius: '8px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
