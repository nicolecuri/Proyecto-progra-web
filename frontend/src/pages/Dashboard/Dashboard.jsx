import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { getCurrentUser } from '../../services/userStorage';
import { fetchRoutines, fetchTracking, saveTracking } from '../../services/api';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return '¡Buenos días';
  if (h >= 12 && h < 19) return '¡Buenas tardes';
  return '¡Buenas noches';
};

const getMuscleEmoji = (muscleGroup) => {
  const group = muscleGroup?.toLowerCase() || '';
  if (group.includes('piernas') || group.includes('gemelos') || group.includes('glúteos')) return '🦵';
  if (group.includes('bíceps') || group.includes('tríceps') || group.includes('brazos') || group.includes('hombros')) return '💪';
  if (group.includes('abdominales') || group.includes('core')) return '🍫'; // Representa el six-pack
  if (group.includes('espalda') || group.includes('pectoral') || group.includes('pecho')) return '🏋️‍♂️';
  return '🏋️';
};

const Dashboard = () => {
  const [currentUser] = useState(() => getCurrentUser());
  const [routines, setRoutines] = useState([]);
  const [activeRoutineId, setActiveRoutineId] = useState('');
  const [tracking, setTracking] = useState({});

  // Timer states
  const [suggestTimerFor, setSuggestTimerFor] = useState(null);
  const [activeTimer, setActiveTimer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true
    const loadRoutines = async () => {
      try {
        const allRoutines = await fetchRoutines()
        if (!mounted) return
        setRoutines(Array.isArray(allRoutines) ? allRoutines : [])

        const savedActiveId = localStorage.getItem('fitplanner-active-routine');
        if (savedActiveId && savedActiveId !== 'draft' && allRoutines.some(r => r.id === savedActiveId)) {
          setActiveRoutineId(savedActiveId);
        } else if (allRoutines.length > 0) {
          setActiveRoutineId(allRoutines[0].id);
          localStorage.setItem('fitplanner-active-routine', allRoutines[0].id);
        }
      } catch (e) {
        console.error('Error cargando rutinas desde API:', e)
      }
    }

    loadRoutines()
    return () => { mounted = false }
  }, []);

  // Cálculo dinámico de todayPlan sin usar effect para evitar renders dobles
  const todayPlan = useMemo(() => {
    if (routines.length === 0) return null;
    
    const activeRoutine = routines.find(r => r.id === activeRoutineId) || routines[0];
    const plan = activeRoutine?.plan;

    if (plan && plan.dias) {
      const jsDay = new Date().getDay(); // 0=Domingo, 1=Lunes
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const todayName = dayNames[jsDay];
      
      const currentDay = plan.dias.find(d => d.diaNombre === todayName);
      if (currentDay && !currentDay.isDescanso && currentDay.ejercicios && currentDay.ejercicios.length > 0) {
        return currentDay;
      }
    }
    return null;
  }, [activeRoutineId, routines]);

  // Cálculo de estadísticas dinámicas basadas en ejercicios completados
  const stats = useMemo(() => {
    if (!todayPlan) return { time: 0, calories: 0, muscles: 'Ninguno' };
    
    let totalTime = 0;
    const musclesSet = new Set();
    
    todayPlan.ejercicios.forEach(ex => {
      const trackVal = tracking[ex.id];
      const isDone = trackVal === 'done' || trackVal?.status === 'done';
      
      if (isDone) {
        if (ex.grupoMuscularPrincipal) musclesSet.add(ex.grupoMuscularPrincipal);
        
        let minSpent = (Number(ex.series) || 0) * (Number(ex.tiempoPorSerie) || 3); // Default 3 min por serie
        if (typeof trackVal === 'object' && trackVal.minutes) {
          minSpent = trackVal.minutes; // Tiempo real ajustado en el timer
        }
        totalTime += minSpent;
      }
    });

    return {
      time: totalTime,
      calories: totalTime * 5, // 5 kcal por minuto (15 kcal / 3 min)
      muscles: Array.from(musclesSet).join(', ') || 'Ninguno'
    };
  }, [todayPlan, tracking]);

  // Guardar historial diario cuando las estadísticas cambien
  useEffect(() => {
    if (stats.time > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const historyRaw = localStorage.getItem('fittrack-history');
      const history = historyRaw ? JSON.parse(historyRaw) : {};

      const calcIntensity = Math.min(4, Math.ceil(stats.time / 20));

      history[todayStr] = {
        date: todayStr,
        intensity: calcIntensity,
        time: `${stats.time} min`,
        muscles: stats.muscles
      };

      localStorage.setItem('fittrack-history', JSON.stringify(history));
    }
  }, [stats]);

  // Load today's tracking from API when user is present
  useEffect(() => {
    let mounted = true
    const loadToday = async () => {
      try {
        const user = getCurrentUser()
        if (!user) return
        const todayStr = new Date().toISOString().split('T')[0]
        const data = await fetchTracking(user.id, todayStr)
        if (!mounted) return
        setTracking(data || {})
      } catch (e) {
        console.error('No se pudo cargar tracking desde API:', e)
      }
    }
    loadToday()
    return () => { mounted = false }
  }, [])

  const handleStatusChange = (id, newStatus, minutesSpent = null) => {
    setTracking(prev => {
      let updatedValue = newStatus;
      if (newStatus === 'done' && minutesSpent !== null) {
        updatedValue = { status: 'done', minutes: Number(minutesSpent) };
      }

      const updated = { ...prev, [id]: updatedValue };
      // persist to API for today's date
      const todayStr = new Date().toISOString().split('T')[0];
      const user = getCurrentUser();
      if (user && user.id) {
        ;(async () => {
          try {
            await saveTracking(user.id, todayStr, updated)
          } catch (err) {
            console.error('Error guardando tracking en API:', err)
          }
        })()
      }
      return updated;
    });

    if (newStatus === 'in-progress' && todayPlan) {
       const workout = todayPlan.ejercicios.find(ex => ex.id === id);
       if (workout) {
         setSuggestTimerFor(workout);
       }
    }
  };

  const startTimer = () => {
    if (!suggestTimerFor) return;
    const minutes = (Number(suggestTimerFor.series) || 0) * (Number(suggestTimerFor.tiempoPorSerie) || 3);
    setActiveTimer({
      workoutId: suggestTimerFor.id,
      remainingSeconds: Math.max(1, minutes * 60),
      originalMinutes: minutes,
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
            handleStatusChange(prev.workoutId, 'done', prev.originalMinutes);
            return null; // El timer termina
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const trackVal = tracking[ex.id];
      const st = typeof trackVal === 'object' ? trackVal.status : (trackVal || 'todo');
      if (st === 'done') result.done.push(ex);
      else if (st === 'in-progress') result.inProgress.push(ex);
      else result.todo.push(ex);
    });
    return result;
  }, [todayPlan, tracking]);

  const renderExercise = (workout) => {
    const trackVal = tracking[workout.id];
    const currentStatus = typeof trackVal === 'object' ? trackVal.status : (trackVal || 'todo');
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
              padding: '8px 30px 8px 12px',
              borderRadius: '8px',
              border: `1px solid ${getStatusBorder(currentStatus)}`,
              background: `${getStatusColor(currentStatus)} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 10px center`,
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none'
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

  const renderExerciseSection = (title, exercises, titleColor) => {
    if (exercises.length === 0) return null;
    return (
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', color: titleColor, marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          {title}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {exercises.map(renderExercise)}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-wrapper">
      <main className="dashboard-content">
        <section className="welcome-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1>{getGreeting()}, {currentUser?.nombre || currentUser?.name || 'Atleta'}! 👋</h1>
            <p>¡Buen trabajo esta semana! Mantén el ritmo y sigue avanzando.</p>
          </div>
          <div style={{ background: 'var(--panel-soft)', padding: '12px 18px', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Rutina Activa:</label>
            <select 
              value={activeRoutineId || ''} 
              onChange={handleRoutineChange}
              style={{ 
                width: '100%', 
                padding: '10px 36px 10px 10px', 
                borderRadius: '8px', 
                background: `var(--panel-bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center`, 
                color: 'var(--text-primary)', 
                border: '1px solid var(--border-color)', 
                boxSizing: 'border-box',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                minHeight: '44px'
              }}
            >
              {routines.length === 0 ? (
                <option value="">Sin rutinas</option>
              ) : (
                routines.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))
              )}
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
                {renderExerciseSection('Por realizar', groupedExercises.todo, 'var(--text-secondary)')}
                {renderExerciseSection('Realizándose', groupedExercises.inProgress, 'var(--accent-secondary)')}
                {renderExerciseSection('Realizados', groupedExercises.done, 'var(--success-color)')}
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
            <div style={{ margin: '20px 0', padding: '15px', background: 'var(--panel-soft)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                {(Number(suggestTimerFor.series) || 0) * (Number(suggestTimerFor.tiempoPorSerie) || 3)} minutos
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Tiempo estimado para tus series</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button onClick={() => setSuggestTimerFor(null)} style={{ flex: 1, padding: '10px', background: 'var(--panel-soft)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Cancelar</button>
              <button onClick={() => navigate('/planner')} style={{ flex: 1, padding: '10px', background: 'var(--panel-soft)', color: 'var(--accent-secondary)', border: '1px solid var(--accent-secondary)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Editar</button>
              <button onClick={startTimer} style={{ flex: 1, padding: '10px', background: 'var(--accent-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Aceptar</button>
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
