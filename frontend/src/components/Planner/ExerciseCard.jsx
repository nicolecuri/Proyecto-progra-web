import React from 'react'
import '../Planner/Planner.css'
import { calculateExerciseVolume } from '../../utils/calculations'

export default function ExerciseCard({ ejercicio, diaNombre, onEdit, onDelete }){
  const vol = calculateExerciseVolume(ejercicio)

  const updateField = (field, value) => {
    const nextValue = Math.max(0, Number(value) || 0)
    onEdit({ ...ejercicio, [field]: nextValue })
  }

  return (
    <div className="card exercise-card">
      <div className="exercise-info">
        <div className="exercise-title">{ejercicio.nombre}</div>
        <div className="exercise-subtitle">{ejercicio.grupoMuscularPrincipal}{ejercicio.gruposSecundarios?.length ? ' · ' + ejercicio.gruposSecundarios.join(',') : ''}</div>

        <div className="exercise-meta">
          <div className="field-control">
            <span>Series</span>
            <div className="value-control">
              <button className="step-btn" onClick={() => updateField('series', ejercicio.series - 1)}>-</button>
              <input className="small-input" value={ejercicio.series} onChange={(e) => updateField('series', e.target.value)} />
              <button className="step-btn" onClick={() => updateField('series', ejercicio.series + 1)}>+</button>
            </div>
          </div>

          <div className="field-control">
            <span>Reps</span>
            <div className="value-control">
              <button className="step-btn" onClick={() => updateField('repeticiones', ejercicio.repeticiones - 1)}>-</button>
              <input className="small-input" value={ejercicio.repeticiones} onChange={(e) => updateField('repeticiones', e.target.value)} />
              <button className="step-btn" onClick={() => updateField('repeticiones', ejercicio.repeticiones + 1)}>+</button>
            </div>
          </div>

          <div className="field-control">
            <span>Peso (kg)</span>
            <div className="value-control">
              <button className="step-btn" onClick={() => updateField('peso', ejercicio.peso - 1)}>-</button>
              <input className="small-input" value={ejercicio.peso} onChange={(e) => updateField('peso', e.target.value)} />
              <button className="step-btn" onClick={() => updateField('peso', ejercicio.peso + 1)}>+</button>
            </div>
          </div>
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
