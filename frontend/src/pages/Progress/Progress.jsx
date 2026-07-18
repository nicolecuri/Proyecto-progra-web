import { useState, useEffect, useMemo } from 'react';
import { getCurrentUser } from '../../services/userStorage';
import Calendar from '../../components/Calendar/Calendar';
import { getAllRoutineProgress, saveRoutineProgress, saveDailyTracking, getHistory } from '../../services/trackingApi';
import { getRoutinesByUser } from '../../services/routineApi';
import './Progress.css';

const BASE_KEY = 'fitplanner-v1';
const ACTIVE_ROUTINE_KEY = 'fitplanner-active-routine';
const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const getStorageKey = () => {
  const user = getCurrentUser();
  if (!user) return `${BASE_KEY}:guest`;
  return `${BASE_KEY}:${user.id || user.correo || user.nombre || 'guest'}`;
};

const getProgressStorageKey = () => `${getStorageKey()}:progress`;

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const calculateStreak = (historyArray) => {
  const dateSet = new Set(historyArray.map((w) => w.date));
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    if (dateSet.has(dateStr)) {
      streak += 1;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
};

const calculateMaxStreak = (historyArray) => {
  const dateSet = new Set(historyArray.map((w) => w.date));
  const dates = Array.from(dateSet).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let previousDate = null;

  dates.forEach((dateStr) => {
    const date = new Date(dateStr);
    if (previousDate) {
      const diff = (date - previousDate) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    previousDate = date;
    maxStreak = Math.max(maxStreak, currentStreak);
  });

  return maxStreak;
};

const Progress = () => {
  const today = useMemo(() => new Date(), []);
  const year = today.getFullYear();
  const monthIdx = today.getMonth();
  const todayName = dayNames[today.getDay()];
  const todayKey = `fitplanner-tracking-${formatDate(today)}`;

  const [rutinas, setRutinas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);

  const [progressByRoutine, setProgressByRoutine] = useState(() => {
    try {
      const saved = localStorage.getItem(getProgressStorageKey());
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Error al cargar progreso por rutina:', e);
      return {};
    }
  });

  const [historyLogs, setHistoryLogs] = useState([]);

  useEffect(() => {
    async function loadProgressAndRoutines() {
      setIsLoading(true);
      const user = getCurrentUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      const userId = user.id || user.correo || user.nombre || 'guest';
      
      const [data, historyData, userRoutines] = await Promise.all([
        getAllRoutineProgress(userId),
        getHistory(userId),
        getRoutinesByUser(userId)
      ]);
      
      setRutinas(userRoutines);

      if (userRoutines.length > 0) {
        const savedId = localStorage.getItem(ACTIVE_ROUTINE_KEY);
        const isValidSaved = savedId && userRoutines.some(r => r.id === savedId);
        const selectedId = isValidSaved ? savedId : userRoutines[0].id;
        setRutinaSeleccionada(selectedId);
        localStorage.setItem(ACTIVE_ROUTINE_KEY, selectedId);
      }

      if (data && Object.keys(data).length > 0) {
        setProgressByRoutine(prev => {
          const merged = { ...prev, ...data };
          localStorage.setItem(getProgressStorageKey(), JSON.stringify(merged));
          return merged;
        });
      }
      if (historyData) setHistoryLogs(historyData);
      setIsLoading(false);
    }
    loadProgressAndRoutines();
  }, []);

  const [filtro, setFiltro] = useState('todas');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [diaSeleccionada, setDiaSeleccionada] = useState(null);
  const [intensidad, setIntensidad] = useState(3);
  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    localStorage.setItem(getProgressStorageKey(), JSON.stringify(progressByRoutine));
  }, [progressByRoutine]);

  useEffect(() => {
    if (rutinaSeleccionada) {
      localStorage.setItem(ACTIVE_ROUTINE_KEY, rutinaSeleccionada);
    }
  }, [rutinaSeleccionada]);

  const selectedRoutine = rutinas.find((rutina) => rutina.id === rutinaSeleccionada);
  const dias = selectedRoutine?.plan?.dias || [];
  const selectedProgress = progressByRoutine[rutinaSeleccionada] || { completedExercises: {}, dayComments: {} };

  const calendarEntries = useMemo(() => {
    try {
      const routineEntries = Object.entries(progressByRoutine).flatMap(([routineId, progress]) => {
        try {
          const rutina = rutinas.find((r) => r.id === routineId);
          const diasRutina = Array.isArray(rutina?.plan?.dias) ? rutina.plan.dias : [];
          
          return Object.entries(progress?.dayComments || {}).map(([diaNombre, comentario]) => {
            try {
              if (!comentario || !comentario.fecha) return null;
              
              const fechaStr = String(comentario.fecha);
              const fecha = fechaStr.slice(0, 10);
              
              const dia = diasRutina.find((d) => d?.diaNombre === diaNombre);
              const muscles = dia?.ejercicios?.map((ej) => ej?.grupoMuscularPrincipal).filter(Boolean).join(', ') || 'Entrenamiento';
              const time = comentario.tiempo || (Array.isArray(dia?.ejercicios) && dia.ejercicios.length ? `${dia.ejercicios.reduce((sum, ej) => sum + ((Number(ej?.series) || 0) * (Number(ej?.tiempoPorSerie) || 3)), 0)} min` : 'N/A');
              
              return {
                date: fecha,
                intensity: Number(comentario.intensidad) || 0,
                muscles,
                time,
                rutinaId: routineId,
                dia: diaNombre,
                completed: comentario.completed,
                comments: comentario.comentarios || '',
              };
            } catch (dayError) {
              console.warn(`Error procesando día ${diaNombre}:`, dayError);
              return null;
            }
          }).filter(Boolean);
        } catch (routineError) {
          console.warn(`Error procesando rutina ${routineId}:`, routineError);
          return [];
        }
      }).filter(Boolean);

      const historyEntries = historyLogs.map(log => {
        const h = log.data?.history?.[log.date] || log.data?.history;
        if (!h || Object.keys(h).length === 0) return null;
        return {
          date: log.date,
          intensity: Number(h.intensity) || 0,
          muscles: h.muscles || '',
          time: h.time || '0 min',
          rutinaId: null,
          dia: 'Dashboard',
          completed: true,
          comments: 'Registrado hoy'
        };
      }).filter(Boolean);

      const mergedMap = {};
      routineEntries.forEach(e => {
        if (e && e.date) mergedMap[e.date] = e;
      });
      historyEntries.forEach(e => {
        if (e && e.date) {
           mergedMap[e.date] = { 
             ...(mergedMap[e.date] || {}), 
             ...e, 
             comments: mergedMap[e.date]?.comments || e.comments, 
             dia: mergedMap[e.date]?.dia || e.dia 
           };
        }
      });

      return Object.values(mergedMap).sort((a, b) => {
        try {
          return a.date.localeCompare(b.date);
        } catch {
          return 0;
        }
      });
    } catch (error) {
      console.error('Error crítico en calendarEntries:', error);
      return [];
    }
  }, [progressByRoutine, rutinas, historyLogs]);

  const workouts = calendarEntries;

  const currentStreak = useMemo(() => calculateStreak(workouts), [workouts]);
  const maxStreak = useMemo(() => calculateMaxStreak(workouts), [workouts]);
  const month = String(monthIdx + 1).padStart(2, '0');

  const thisMonthWorkouts = useMemo(
    () => workouts.filter((w) => {
      try {
        return w?.date && String(w.date).startsWith(`${year}-${month}`);
      } catch {
        return false;
      }
    }),
    [workouts, year, month]
  );

  const parseMinutes = (value) => {
    try {
      const mins = parseInt((value || '0').replace(/\D/g, ''), 10);
      return Number.isNaN(mins) ? 0 : mins;
    } catch {
      return 0;
    }
  };

  const totalMinutesThisMonth = useMemo(
    () => thisMonthWorkouts.reduce((acc, w) => acc + parseMinutes(w.time), 0),
    [thisMonthWorkouts]
  );

  const totalCaloriesThisMonth = totalMinutesThisMonth * 5;

  const last7Days = useMemo(() => {
    try {
      return Array.from({ length: 7 }, (_, i) => {
        try {
          const d = new Date(today);
          d.setDate(d.getDate() - (6 - i));
          const dateStr = formatDate(d);
          const wo = workouts.find((w) => {
            try {
              return String(w?.date) === dateStr;
            } catch {
              return false;
            }
          });
          const mins = wo ? parseMinutes(wo.time) : 0;
          return {
            label: DAYS_ES[d.getDay()] || 'N/A',
            date: dateStr,
            mins,
            intensity: wo?.intensity || 0,
            isToday: dateStr === formatDate(today),
          };
        } catch (dayError) {
          console.warn('Error calculando día 7d:', dayError);
          return {
            label: 'N/A',
            date: '',
            mins: 0,
            intensity: 0,
            isToday: false,
          };
        }
      });
    } catch (error) {
      console.error('Error en last7Days:', error);
      return [];
    }
  }, [workouts, today]);

  const maxMins = (() => {
    try {
      const mins = Array.isArray(last7Days) ? last7Days.map((d) => d?.mins || 0) : [];
      return Math.max(...mins, 30);
    } catch {
      return 30;
    }
  })();

  const muscleFrequency = useMemo(() => {
    try {
      const freq = {};
      (Array.isArray(workouts) ? workouts : []).forEach((w) => {
        try {
          if (!w?.muscles || w.muscles === 'Ninguno') return;
          const musclesStr = String(w.muscles);
          const groups = musclesStr.split(',').map((s) => s.trim()).filter(Boolean);
          groups.forEach((g) => {
            freq[g] = (freq[g] || 0) + 1;
          });
        } catch {
          // Ignorar errores en elementos individuales
        }
      });
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const maxFreq = sorted[0]?.[1] || 1;
      return sorted.map(([name, count]) => ({ name, count, pct: Math.round((count / maxFreq) * 100) }));
    } catch (error) {
      console.error('Error en muscleFrequency:', error);
      return [];
    }
  }, [workouts]);

  const activeDaysThisMonth = thisMonthWorkouts.length;
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  const isExerciseCompleted = (exerciseId) => Boolean(selectedProgress.completedExercises?.[exerciseId]);

  const completedExercisesCount = (day) => {
    try {
      return Array.isArray(day?.ejercicios)
        ? day.ejercicios.filter((ej) => ej?.id && isExerciseCompleted(ej.id)).length
        : 0;
    } catch {
      return 0;
    }
  };

  const isDayCompleted = (day) => {
    try {
      if (!day || day.isDescanso || !Array.isArray(day?.ejercicios) || day.ejercicios.length === 0) return false;
      return completedExercisesCount(day) === day.ejercicios.length;
    } catch {
      return false;
    }
  };

  const updateTodayTrackingIfNeeded = (exerciseId, completed, dayName) => {
    const activeRoutineId = localStorage.getItem(ACTIVE_ROUTINE_KEY);
    if (rutinaSeleccionada !== activeRoutineId) return;

    // Solo sincronizar con Dashboard si el día coincide con hoy
    if (dayName !== todayName) return;

    try {
      const raw = localStorage.getItem(todayKey);
      const parsed = raw ? JSON.parse(raw) : {};
      if (completed) {
        parsed[exerciseId] = 'done';
      } else {
        delete parsed[exerciseId];
      }
      localStorage.setItem(todayKey, JSON.stringify(parsed));
      
      const user = getCurrentUser();
      const userId = user ? (user.id || user.correo || user.nombre || 'guest') : 'guest';
      saveDailyTracking(userId, formatDate(today), { exercises: parsed });
    } catch (e) {
      console.error('Error actualizando tracking diario:', e);
    }
  };

  const toggleEjercicio = (dayName, exerciseId) => {
    if (!rutinaSeleccionada) return;
    setProgressByRoutine((prev) => {
      const current = prev[rutinaSeleccionada] || { completedExercises: {}, dayComments: {} };
      const completedExercises = { ...current.completedExercises };
      const completed = Boolean(completedExercises[exerciseId]);
      if (completed) {
        delete completedExercises[exerciseId];
      } else {
        completedExercises[exerciseId] = true;
      }

      // Fix 2: Auto-generar dayComment cuando todos los ejercicios del día están completados
      const dayComments = { ...current.dayComments };
      const dia = dias.find((d) => d.diaNombre === dayName);
      if (dia && !dia.isDescanso && Array.isArray(dia.ejercicios) && dia.ejercicios.length > 0) {
        const allDone = dia.ejercicios.every((ej) => ej?.id && completedExercises[ej.id]);
        if (allDone) {
          // Calcular tiempo estimado del día
          const tiempoMin = dia.ejercicios.reduce((sum, ej) => sum + ((Number(ej?.series) || 0) * (Number(ej?.tiempoPorSerie) || 3)), 0);
          const intensidadCalc = Math.min(4, Math.ceil(tiempoMin / 20)) || 1;
          dayComments[dayName] = {
            completed: true,
            intensidad: intensidadCalc,
            comentarios: dayComments[dayName]?.comentarios || 'Completado automáticamente',
            fecha: formatDate(today),
          };
        } else if (dayComments[dayName]?.comentarios === 'Completado automáticamente') {
          // Si se desmarcó un ejercicio y el comment era auto-generado, eliminarlo
          delete dayComments[dayName];
        }
      }

      const updated = {
        ...prev,
        [rutinaSeleccionada]: {
          ...current,
          completedExercises,
          dayComments,
        },
      };
      
      updateTodayTrackingIfNeeded(exerciseId, !completed, dayName);
      
      const user = getCurrentUser();
      const userId = user ? (user.id || user.correo || user.nombre || 'guest') : 'guest';
      saveRoutineProgress(userId, rutinaSeleccionada, updated[rutinaSeleccionada]);
      
      return updated;
    });
  };

  const abrirRegistroCumplimiento = (diaNombre) => {
    setDiaSeleccionada(diaNombre);
    setMostrarModal(true);
  };

  const guardarCumplimiento = (e) => {
    e.preventDefault();
    if (!rutinaSeleccionada || diaSeleccionada === null) return;

    const dia = dias.find((d) => d.diaNombre === diaSeleccionada);
    if (!dia) return;

    setProgressByRoutine((prev) => {
      const current = prev[rutinaSeleccionada] || { completedExercises: {}, dayComments: {} };
      
      // Marcar todos los ejercicios del día como completados
      const completedExercises = { ...current.completedExercises };
      if (Array.isArray(dia.ejercicios)) {
        dia.ejercicios.forEach((ej) => {
          if (ej?.id) completedExercises[ej.id] = true;
        });
      }

      // Calcular tiempo estimado real del día
      const tiempoMin = Array.isArray(dia.ejercicios) 
        ? dia.ejercicios.reduce((sum, ej) => sum + ((Number(ej?.series) || 0) * (Number(ej?.tiempoPorSerie) || 3)), 0)
        : 0;

      const updated = {
        ...prev,
        [rutinaSeleccionada]: {
          ...current,
          completedExercises,
          dayComments: {
            ...current.dayComments,
            [dia.diaNombre]: {
              completed: true,
              intensidad: Number(intensidad),
              comentarios,
              fecha: formatDate(today),
              tiempo: `${tiempoMin} min`,
            },
          },
        },
      };

      const user = getCurrentUser();
      const userId = user ? (user.id || user.correo || user.nombre || 'guest') : 'guest';
      saveRoutineProgress(userId, rutinaSeleccionada, updated[rutinaSeleccionada]);

      // Si el día registrado es hoy, sincronizar también con el Dashboard
      if (dia.diaNombre === todayName) {
        try {
          const raw = localStorage.getItem(todayKey);
          const parsed = raw ? JSON.parse(raw) : {};
          dia.ejercicios.forEach((ej) => {
            if (ej?.id) parsed[ej.id] = 'done';
          });
          localStorage.setItem(todayKey, JSON.stringify(parsed));
          saveDailyTracking(userId, formatDate(today), { exercises: parsed });
        } catch (err) {
          console.error('Error sincronizando con Dashboard:', err);
        }
      }

      return updated;
    });

    setMostrarModal(false);
    setDiaSeleccionada(null);
    setIntensidad(3);
    setComentarios('');
  };

  const diasFiltrados = dias.filter((dia) => {
    if (filtro === 'pendientes') return !isDayCompleted(dia);
    if (filtro === 'completadas') return isDayCompleted(dia);
    return true;
  });

  return (
    <div className="progress-wrapper">
      <main className="progress-content">
        <section className="progress-header">
          <h1>Tu Progreso</h1>
          <p>
            {isLoading
              ? 'Cargando tus rutinas...'
              : selectedRoutine
              ? `Rutina seleccionada: ${selectedRoutine.nombre}. ${dias.length} días en la rutina.`
              : 'No hay rutinas guardadas. Crea una desde el Planificador.'}
          </p>
        </section>

        <section className="streak-container">
          <div className="streak-card glass-panel highlight">
            <div className="streak-icon fire-icon">🔥</div>
            <div className="streak-info">
              <h3>Racha Actual</h3>
              <p className="streak-value">{currentStreak} <span className="streak-unit">días</span></p>
            </div>
          </div>
          <div className="streak-card glass-panel">
            <div className="streak-icon trophy-icon">🏆</div>
            <div className="streak-info">
              <h3>Mejor Racha</h3>
              <p className="streak-value">{maxStreak} <span className="streak-unit">días</span></p>
            </div>
          </div>
          <div className="streak-card glass-panel">
            <div className="streak-icon activity-icon">⚡</div>
            <div className="streak-info">
              <h3>Sesiones este Mes</h3>
              <p className="streak-value">{activeDaysThisMonth} <span className="streak-unit">/ {daysInMonth} días</span></p>
            </div>
          </div>
          <div className="streak-card glass-panel">
            <div className="streak-icon time-icon">⏱️</div>
            <div className="streak-info">
              <h3>Tiempo Activo</h3>
              <p className="streak-value">{totalMinutesThisMonth} <span className="streak-unit">min</span></p>
            </div>
          </div>
          <div className="streak-card glass-panel">
            <div className="streak-icon cal-icon">🔥</div>
            <div className="streak-info">
              <h3>Calorías Est.</h3>
              <p className="streak-value">{totalCaloriesThisMonth} <span className="streak-unit">kcal</span></p>
            </div>
          </div>
        </section>

        <section className="chart-section glass-panel">
          <div className="chart-header">
            <h2>Actividad — Últimos 7 días</h2>
            <span className="chart-subtitle">Minutos de entrenamiento por día</span>
          </div>
          <div className="bar-chart">
            {last7Days.map((day) => (
              <div key={day.date} className={`bar-col${day.isToday ? ' bar-today' : ''}`}>
                <div className="bar-label-top">
                  {day.mins > 0 && <span className="bar-value-top">{day.mins}m</span>}
                </div>
                <div className="bar-track">
                  <div
                    className={`bar-fill intensity-bar-${day.intensity}`}
                    style={{ height: `${day.mins === 0 ? 4 : Math.max(8, (day.mins / maxMins) * 100)}%` }}
                  />
                </div>
                <span className={`bar-day-label${day.isToday ? ' today-label' : ''}`}>
                  {day.label}
                </span>
                {day.isToday && <span className="today-dot">●</span>}
              </div>
            ))}
          </div>
          {workouts.length === 0 && (
            <div className="chart-empty">
              <p>Aún no tienes entrenamientos registrados.</p>
              <p>Completa ejercicios en el Dashboard para ver tu progreso aquí.</p>
            </div>
          )}
        </section>

        {muscleFrequency.length > 0 && (
          <section className="muscles-section glass-panel">
            <h2>Grupos Musculares más Trabajados</h2>
            <p className="section-subtitle">Basado en todos tus entrenamientos registrados</p>
            <div className="muscle-bars">
              {muscleFrequency.map(({ name, count, pct }) => (
                <div key={name} className="muscle-row">
                  <span className="muscle-name">{name}</span>
                  <div className="muscle-bar-track">
                    <div className="muscle-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="muscle-count">{count}x</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="calendar-section">
          <h2>Calendario de Intensidad — {MONTH_ES[monthIdx]} {year}</h2>
          <Calendar workoutData={calendarEntries} />
        </section>

        <section className="workouts-section">
          <div className="section-header-flex">
            <div>
              <h2>Mis Entrenamientos Asignados</h2>
              {rutinas.length > 0 && (
                <div className="routine-selector">
                  <label htmlFor="routine-select">Selecciona rutina:</label>
                  <select
                    id="routine-select"
                    value={rutinaSeleccionada || ''}
                    onChange={(e) => setRutinaSeleccionada(e.target.value)}
                  >
                    {rutinas.map((rutina) => (
                      <option key={rutina.id} value={rutina.id}>
                        {rutina.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="filter-buttons">
              <button className={`filter-btn ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>Todas</button>
              <button className={`filter-btn ${filtro === 'pendientes' ? 'active' : ''}`} onClick={() => setFiltro('pendientes')}>Pendientes</button>
              <button className={`filter-btn ${filtro === 'completadas' ? 'active' : ''}`} onClick={() => setFiltro('completadas')}>Completadas</button>
            </div>
          </div>

          <div className="workouts-list">
            {isLoading ? (
              <p className="no-workouts">⏳ Cargando rutinas...</p>
            ) : rutinas.length === 0 ? (
              <p className="no-workouts">No hay rutinas guardadas. Crea una en el Planificador para ver tu progreso.</p>
            ) : diasFiltrados.length === 0 ? (
              <p className="no-workouts">No hay días que coincidan con el filtro seleccionado.</p>
            ) : (
              diasFiltrados.map((dia) => {
                const totalEjercicios = dia.ejercicios?.length || 0;
                const completados = completedExercisesCount(dia);
                const diaCompleted = isDayCompleted(dia);
                const comentario = selectedProgress.dayComments?.[dia.diaNombre];

                return (
                  <div key={dia.diaNombre} className={`workout-card ${diaCompleted ? 'completado' : 'pendiente'}`}>
                    <div className="workout-info">
                      <h3>{dia.diaNombre}</h3>
                      <p className="workout-duration">
                        {dia.isDescanso
                          ? 'Día de descanso'
                          : `${completados} / ${totalEjercicios} ejercicios completados`}
                      </p>
                      {comentario && (
                        <p className="workout-feedback">📝 Intensidad: {comentario.intensidad}/5 - {comentario.comentarios}</p>
                      )}
                      {!dia.isDescanso && totalEjercicios > 0 && (
                        <ul className="exercise-list">
                          {dia.ejercicios.map((ejercicio) => (
                            <li key={ejercicio.id} className={`exercise-item ${isExerciseCompleted(ejercicio.id) ? 'exercise-done' : ''}`}>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={isExerciseCompleted(ejercicio.id)}
                                  onChange={() => toggleEjercicio(dia.diaNombre, ejercicio.id)}
                                />
                                <span>{ejercicio.nombre} • {ejercicio.series}x{ejercicio.repeticiones} • {ejercicio.grupoMuscularPrincipal}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="workout-actions">
                      {dia.isDescanso ? (
                        <span className="status-badge descanso">Descanso</span>
                      ) : totalEjercicios === 0 ? (
                        <span className="status-badge no-exercise">Sin ejercicios</span>
                      ) : (
                        <>
                          <button className="btn-complete" onClick={() => abrirRegistroCumplimiento(dia.diaNombre)}>
                            Registrar sesión
                          </button>
                          {diaCompleted ? (
                            <span className="status-badge completed">✔ Completada</span>
                          ) : (
                            <span className="status-badge pending">⏳ Pendiente</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {mostrarModal && diaSeleccionada !== null && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Registrar Cumplimiento - {dias.find((d) => d.diaNombre === diaSeleccionada)?.diaNombre}</h3>
              <form onSubmit={guardarCumplimiento}>
                <div className="form-group">
                  <label htmlFor="intensidad">Califica tu esfuerzo (1 al 5):</label>
                  <select value={intensidad} onChange={(e) => setIntensidad(Number(e.target.value))}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="comentarios">Notas:</label>
                  <textarea rows="3" value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
                </div>
                <div className="modal-buttons">
                  <button type="button" className="btn-cancel" onClick={() => setMostrarModal(false)}>Cancelar</button>
                  <button type="submit" className="btn-submit">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Progress;