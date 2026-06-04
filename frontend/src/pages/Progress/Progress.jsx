import { useState, useEffect, useMemo } from 'react';
import { getCurrentUser } from '../../services/userStorage';
import Calendar from '../../components/Calendar/Calendar';
import './Progress.css';

const BASE_KEY = 'fitplanner-v1';
const ACTIVE_ROUTINE_KEY = 'fitplanner-active-routine';
const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const getStorageKey = () => {
  const user = getCurrentUser();
  if (!user) return `${BASE_KEY}:guest`;
  return `${BASE_KEY}:${user.correo || user.id || user.nombre || 'guest'}`;
};

const getProgressStorageKey = () => `${getStorageKey()}:progress`;

const Progress = () => {
  const today = new Date();
  const todayName = dayNames[today.getDay()];
  const todayKey = `fitplanner-tracking-${today.toISOString().split('T')[0]}`;

  const [rutinas] = useState(() => {
    try {
      const persisted = localStorage.getItem(getStorageKey());
      if (persisted) {
        const parsed = JSON.parse(persisted);
        return Array.isArray(parsed.savedRoutines) ? parsed.savedRoutines : [];
      }
    } catch (e) {
      console.error('Error al cargar rutinas guardadas:', e);
    }
    return [];
  });

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
    return Object.entries(progressByRoutine).flatMap(([routineId, progress]) => {
      const rutina = rutinas.find((r) => r.id === routineId);
      const diasRutina = rutina?.plan?.dias || [];
      return Object.entries(progress.dayComments || {}).map(([diaNombre, comentario]) => {
        if (!comentario?.fecha) return null;
        const fecha = comentario.fecha.slice(0, 10);
        const dia = diasRutina.find((d) => d.diaNombre === diaNombre);
        const muscles = dia?.ejercicios?.map((ej) => ej.grupoMuscularPrincipal).filter(Boolean).join(', ') || 'Entrenamiento';
        const time = comentario.tiempo || (dia?.ejercicios?.length ? `${dia.ejercicios.reduce((sum, ej) => sum + (Number(ej.tiempoPorSerie) || 0), 0)} min` : 'N/A');
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
      }).filter(Boolean);
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [progressByRoutine, rutinas]);

  const isExerciseCompleted = (exerciseId) => Boolean(selectedProgress.completedExercises?.[exerciseId]);

  const completedExercisesCount = (day) => day.ejercicios?.filter((ej) => isExerciseCompleted(ej.id)).length || 0;

  const isDayCompleted = (day) => {
    if (day.isDescanso || !day.ejercicios || day.ejercicios.length === 0) return false;
    return completedExercisesCount(day) === day.ejercicios.length;
  };

  const updateTodayTrackingIfNeeded = (exerciseId, completed, dayName) => {
    const activeRoutineId = localStorage.getItem(ACTIVE_ROUTINE_KEY);
    if (rutinaSeleccionada !== activeRoutineId || dayName !== todayName) return;

    try {
      const raw = localStorage.getItem(todayKey);
      const parsed = raw ? JSON.parse(raw) : {};
      if (completed) {
        parsed[exerciseId] = 'done';
      } else {
        delete parsed[exerciseId];
      }
      localStorage.setItem(todayKey, JSON.stringify(parsed));
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
              : 'No hay rutinas guardadas. Crea una desde el Planificador.'}
          </p>
        </section>

        <section className="calendar-section">
          <h2>Calendario de Intensidad</h2>
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