import { useState, useEffect, useMemo } from 'react';
import { getCurrentUser } from '../../services/userStorage';
import { fetchRoutines, fetchTracking, saveTracking } from '../../services/api';
import Calendar from '../../components/Calendar/Calendar';
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
  return `${BASE_KEY}:${user.correo || user.id || user.nombre || 'guest'}`;
};

const getProgressStorageKey = () => `${getStorageKey()}:progress`;

const formatDate = (date) => date.toISOString().split('T')[0];

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

  const [rutinas, setRutinas] = useState([])
  const [loadingRutinas, setLoadingRutinas] = useState(true)
  const [rutinasError, setRutinasError] = useState(null)

  useEffect(() => {
    let mounted = true
    const loadRutinas = async () => {
      try {
        const fetched = await fetchRoutines()
        if (mounted) setRutinas(Array.isArray(fetched) ? fetched : [])
      } catch (error) {
        if (mounted) setRutinasError(error.message || 'No se pudieron cargar las rutinas')
      } finally {
        if (mounted) setLoadingRutinas(false)
      }
    }

    loadRutinas()
    return () => { mounted = false }
  }, [])

  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(() => {
    try {
      const savedActive = localStorage.getItem(ACTIVE_ROUTINE_KEY);
      if (savedActive) return savedActive;
      const persisted = localStorage.getItem(getStorageKey());
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (Array.isArray(parsed.savedRoutines) && parsed.savedRoutines.length > 0) {
          return parsed.savedRoutines[0].id;
        }
      }
    } catch (e) {
      console.error('Error al inicializar la rutina seleccionada:', e);
    }
    return null;
  });

  const [progressByRoutine, setProgressByRoutine] = useState(() => {
    try {
      const saved = localStorage.getItem(getProgressStorageKey());
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Error al cargar progreso por rutina:', e);
      return {};
    }
  });

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
      return Object.entries(progressByRoutine).flatMap(([routineId, progress]) => {
        try {
          const rutina = rutinas.find((r) => r.id === routineId);
          const diasRutina = Array.isArray(rutina?.plan?.dias) ? rutina.plan.dias : [];
          
          return Object.entries(progress?.dayComments || {}).map(([diaNombre, comentario]) => {
            try {
              if (!comentario || !comentario.fecha) return null;
              
              // Asegurar que fecha es string antes de slice
              const fechaStr = String(comentario.fecha);
              const fecha = fechaStr.slice(0, 10);
              
              const dia = diasRutina.find((d) => d?.diaNombre === diaNombre);
              const muscles = dia?.ejercicios?.map((ej) => ej?.grupoMuscularPrincipal).filter(Boolean).join(', ') || 'Entrenamiento';
              const time = comentario.tiempo || (Array.isArray(dia?.ejercicios) && dia.ejercicios.length ? `${dia.ejercicios.reduce((sum, ej) => sum + (Number(ej?.tiempoPorSerie) || 0), 0)} min` : 'N/A');
              
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
      }).sort((a, b) => {
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
  }, [progressByRoutine, rutinas]);

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

  const updateTodayTrackingIfNeeded = async (exerciseId, completed, dayName) => {
    const activeRoutineId = localStorage.getItem(ACTIVE_ROUTINE_KEY);
    if (rutinaSeleccionada !== activeRoutineId || dayName !== todayName) return;

    try {
      const user = getCurrentUser();
      const raw = await (async () => {
        if (!user) return null
        return fetchTracking(user.id, todayKey.replace('fitplanner-tracking-', ''))
      })()
      const parsed = raw ? raw : {};
      if (completed) parsed[exerciseId] = 'done'; else delete parsed[exerciseId];
      if (user) await saveTracking(user.id, new Date().toISOString().split('T')[0], parsed)
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
      const updated = {
        ...prev,
        [rutinaSeleccionada]: {
          ...current,
          completedExercises,
        },
      };
      updateTodayTrackingIfNeeded(exerciseId, !completed, dayName);
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
      const completada = isDayCompleted(dia);
      return {
        ...prev,
        [rutinaSeleccionada]: {
          ...current,
          dayComments: {
            ...current.dayComments,
            [dia.diaNombre]: {
              completed: completada,
              intensidad: Number(intensidad),
              comentarios,
              fecha: today.toISOString(),
            },
          },
        },
      };
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
            {selectedRoutine
              ? `Rutina seleccionada: ${selectedRoutine.nombre}. ${dias.length} días en la rutina.`
              : loadingRutinas
                ? 'Cargando rutinas desde el servidor...'
                : rutinasError
                  ? 'No se pudieron cargar las rutinas desde el servidor.'
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
            {rutinas.length === 0 ? (
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