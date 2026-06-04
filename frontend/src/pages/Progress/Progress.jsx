import { useState, useEffect } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import './Progress.css';

const Progress = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');

  // Inicialización corregida para extraer los nombres de los ejercicios del objeto guardado
  const [rutinas, setRutinas] = useState(() => {
    try {
      const persisted = localStorage.getItem('fitplanner-v1');
      if (persisted) {
        const { plan } = JSON.parse(persisted);
        return plan.dias.map(d => ({
          nombre: d.diaNombre,
          // Accedemos explícitamente a 'nombre' dentro de cada objeto ejercicio
          ejercicios: d.ejercicios ? d.ejercicios.map(ex => ex.nombre) : [],
          completada: false,
          calificacion: null,
          isDescanso: d.isDescanso
        }));
      }
    } catch (e) {
      console.error("Error al cargar datos del planner:", e);
    }
    return []; 
  });

  const [historialEntrenamientos, setHistorialEntrenamientos] = useState(() => {
    const guardado = localStorage.getItem('historial_intensidad');
    return guardado ? JSON.parse(guardado) : [];
  });

  useEffect(() => {
    localStorage.setItem('historial_intensidad', JSON.stringify(historialEntrenamientos));
  }, [historialEntrenamientos]);

  const [filtro, setFiltro] = useState('todas'); 
  const [mostrarModal, setMostrarModal] = useState(false);
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState(null);
  const [intensidad, setIntensidad] = useState(3);
  const [comentarios, setComentarios] = useState('');

  const abrirRegistroCumplimiento = (index) => {
    setRutinaSeleccionada(index);
    setMostrarModal(true);
  };

  const guardarCumplimiento = (e) => {
    e.preventDefault();
    const nuevasRutinas = [...rutinas];
    nuevasRutinas[rutinaSeleccionada].completada = true;
    nuevasRutinas[rutinaSeleccionada].calificacion = `Intensidad: ${intensidad}/5 - ${comentarios}`;
    setRutinas(nuevasRutinas);

    const fechaHoy = `${year}-${month}-${String(today.getDate()).padStart(2, '0')}`;
    const nuevoRegistroCalendario = { date: fechaHoy, intensity: Number(intensidad) };
    setHistorialEntrenamientos([...historialEntrenamientos, nuevoRegistroCalendario]);

    setMostrarModal(false);
    setIntensidad(3);
    setComentarios('');
  };

  const rutinasFiltradas = rutinas.filter(rutina => {
    if (filtro === 'pendientes') return !rutina.completada;
    if (filtro === 'completadas') return rutina.completada;
    return true;
  });

  return (
    <div className="progress-wrapper">
      <main className="progress-content">
        <section className="progress-header">
          <h1>Tu Progreso</h1>
          <p>Tus entrenamientos planificados: {rutinas.length} días configurados.</p>
        </section>

        <section className="calendar-section">
          <h2>Calendario de Intensidad</h2>
          <Calendar workoutData={historialEntrenamientos} />
        </section>

        <section className="workouts-section">
          <div className="section-header-flex">
            <h2>Mis Entrenamientos Asignados</h2>
            <div className="filter-buttons">
              <button className={`filter-btn ${filtro === 'todas' ? 'active' : ''}`} onClick={() => setFiltro('todas')}>Todas</button>
              <button className={`filter-btn ${filtro === 'pendientes' ? 'active' : ''}`} onClick={() => setFiltro('pendientes')}>Pendientes</button>
              <button className={`filter-btn ${filtro === 'completadas' ? 'active' : ''}`} onClick={() => setFiltro('completadas')}>Completadas</button>
            </div>
          </div>

          <div className="workouts-list">
            {rutinasFiltradas.length === 0 ? (
              <p className="no-workouts">No hay rutinas en esta categoría. Crea una en el Planificador.</p>
            ) : (
              rutinasFiltradas.map((rutina, index) => (
                <div key={index} className={`workout-card ${rutina.completada ? 'completado' : 'pendiente'}`}>
                  <div className="workout-info">
                    <h3>{rutina.nombre}</h3>
                    <p className="workout-duration">
                      {rutina.isDescanso ? "Día de descanso" : `Ejercicios: ${rutina.ejercicios.length > 0 ? rutina.ejercicios.join(', ') : 'Sin ejercicios'}`}
                    </p>
                    {rutina.completada && <p className="workout-feedback">📝 {rutina.calificacion}</p>}
                  </div>
                  <div className="workout-actions">
                    {rutina.completada ? (
                      <span className="status-badge completed">✔ Completada</span>
                    ) : (
                      !rutina.isDescanso && (
                        <button className="btn-complete" onClick={() => abrirRegistroCumplimiento(index)}>
                          Marcar Cumplimiento
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {mostrarModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Registrar Cumplimiento</h3>
              <form onSubmit={guardarCumplimiento}>
                <div className="form-group">
                  <label htmlFor="intensidad">Califica tu esfuerzo (1 al 5):</label>
                  <select value={intensidad} onChange={(e) => setIntensidad(e.target.value)}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="comentarios">Notas:</label>
                  <textarea rows="3" value={comentarios} onChange={(e) => setComentarios(e.target.value)}></textarea>
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