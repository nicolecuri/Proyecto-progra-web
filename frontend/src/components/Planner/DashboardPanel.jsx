import '../Planner/Planner.css'
import { volumeStatus } from '../../utils/calculations'

export default function DashboardPanel({ resumen, savedRoutines = [], previewRoutineId, setPreviewRoutine, loadRoutine, deleteRoutine }){
  const muscles = Object.keys(resumen.volumenPorMusculo || {})
  const previewRoutine = savedRoutines.find((routine) => routine.id === previewRoutineId) || savedRoutines[savedRoutines.length - 1]

  return (
    <aside className="planner-left">
      <div className="card">
        <h3>Resumen Semanal</h3>
        <div className="stat-row" style={{marginTop:12}}>
          <div className="stat"><strong>{resumen.totalSeries}</strong><div>Total Series</div></div>
          <div className="stat"><strong>{resumen.totalEjercicios}</strong><div>Ejercicios</div></div>
          <div className="stat"><strong>{resumen.diasActivos}</strong><div>Días Entreno</div></div>
        </div>
      </div>

      {previewRoutine && (
        <div className="card preview-card">
          <h4>Vista previa de rutina</h4>
          <div className="muscle-item preview-summary-card">
            <div style={{fontWeight:700}}>{previewRoutine.nombre}</div>
            <div style={{fontSize:'0.9rem',color:'#475569'}}>Guardada el {new Date(previewRoutine.createdAt).toLocaleDateString()}</div>
          </div>
          <table className="preview-table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Ejercicios</th>
              </tr>
            </thead>
            <tbody>
              {previewRoutine.plan.dias.map((dia) => (
                <tr key={dia.diaNombre}>
                  <td>{dia.diaNombre}</td>
                  <td>
                    {dia.isDescanso || dia.ejercicios.length === 0 ? (
                      <span className="rest-badge">Día de descanso</span>
                    ) : (
                      <ul className="preview-exercise-list">
                        {dia.ejercicios.map((ex) => (
                          <li key={ex.id}>{ex.nombre} · {ex.series}x{ex.repeticiones} · {ex.peso}kg</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h4>Rutinas guardadas</h4>
        <div className="routine-list">
          {savedRoutines.length === 0 && <div className="muscle-item">Aún no has guardado ninguna rutina.</div>}
          {savedRoutines.map((routine) => (
            <div key={routine.id} className={`muscle-item routine-item ${routine.id === previewRoutine?.id ? 'active-preview' : ''}`}>
              <button className="routine-item-name" onClick={() => setPreviewRoutine(routine.id)}>
                <div>{routine.nombre}</div>
                <div style={{fontSize:'0.8rem',color:'#64748b'}}>Guardada {new Date(routine.createdAt).toLocaleDateString()}</div>
              </button>
              <div className="routine-actions-row">
                <button className="btn" onClick={() => loadRoutine(routine.id)}>Editar</button>
                <button className="btn" onClick={() => deleteRoutine(routine.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h4>Volumen por músculo</h4>
        <div className="muscle-list">
          {muscles.length===0 && <div className="muscle-item">Sin datos aún</div>}
          {muscles.map((m)=> (
            <div key={m} className="muscle-item">
              <div>{m} → {resumen.volumenPorMusculo[m]} series</div>
              <div>{volumeStatus(resumen.volumenPorMusculo[m])}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h4>Frecuencia</h4>
        <div className="muscle-list">
          {Object.keys(resumen.frecuenciaPorMusculo).length===0 && <div className="muscle-item">Sin datos</div>}
          {Object.entries(resumen.frecuenciaPorMusculo).map(([m,c])=> (
            <div key={m} className="muscle-item">{m} → {c} veces/semana</div>
          ))}
        </div>
      </div>
    </aside>
  )
}
