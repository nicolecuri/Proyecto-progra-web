
import '../Planner/Planner.css'
import { calculateExerciseVolume } from '../../utils/calculations'

export default function ExerciseCard({ ejercicio, diaNombre, onEdit, onDelete }){
  const vol = calculateExerciseVolume(ejercicio)

  const updateField = (field, value) => {
    const nextValue = Math.max(0, Number(value) || 0)
    onEdit({ ...ejercicio, [field]: nextValue })
  }

  const renderFieldControl = (label, fieldName, value, fallback = 0) => {
    const val = value !== undefined ? value : fallback;
    return (
      <div className="field-control">
        <span>{label}</span>
        <div className="value-control">
          <button className="step-btn" onClick={() => updateField(fieldName, val - 1)}>-</button>
          <input className="small-input" value={val} onChange={(e) => updateField(fieldName, e.target.value)} />
          <button className="step-btn" onClick={() => updateField(fieldName, val + 1)}>+</button>
        </div>
      </div>
    );
  };

  return (
    <div className="card exercise-card">
      <div className="exercise-info">
        <div className="exercise-title">{ejercicio.nombre}</div>
        <div className="exercise-subtitle">{ejercicio.grupoMuscularPrincipal}{ejercicio.gruposSecundarios?.length ? ' · ' + ejercicio.gruposSecundarios.join(',') : ''}</div>

        <div className="exercise-meta">
          {renderFieldControl('Series', 'series', ejercicio.series)}
          {renderFieldControl('Reps', 'repeticiones', ejercicio.repeticiones)}
          {renderFieldControl('Peso (kg)', 'peso', ejercicio.peso)}
          {renderFieldControl('Min / Serie', 'tiempoPorSerie', ejercicio.tiempoPorSerie, 3)}
        </div>

        <div className="exercise-volume"><strong>Volumen:</strong> {vol} kg</div>
        <div className="notes-block">
          <textarea
            placeholder="Notas"
            value={ejercicio.notas || ''}
            onChange={(e) => onEdit({ ...ejercicio, notas: e.target.value })}
          />
        </div>
      </div>

      <div className="controls">
        <button className="btn secondary" onClick={() => onDelete(diaNombre, ejercicio.id)}>Eliminar</button>
      </div>
    </div>
  )
}
