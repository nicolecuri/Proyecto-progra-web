import React, { useState } from 'react'
import '../Planner/Planner.css'

export default function RoutineActions({ onSave, onDownload, onPrint, editingRoutineId, currentRoutineName }){
  const [name, setName] = useState('')

  React.useEffect(() => {
    if (editingRoutineId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(currentRoutineName || '')
    } else {
      setName('')
    }
  }, [editingRoutineId, currentRoutineName])

  const actionLabel = editingRoutineId ? 'Actualizar rutina' : 'Guardar rutina'

  return (
    <div className="card routine-actions-card">
      <div className="routine-actions-row">
        <div style={{flex:1}}>
          <label className="routine-label">Nombre de rutina</label>
          <input
            className="routine-input"
            placeholder="Escribe un nombre para tu rutina"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />
        </div>
        <div className="routine-buttons">
          <button className="btn primary" onClick={()=>{ onSave(name); if (!editingRoutineId) setName('') }}>
            {actionLabel}
          </button>
          <button className="btn" onClick={onDownload}>Descargar</button>
          <button className="btn" onClick={onPrint}>Imprimir</button>
        </div>
      </div>
    </div>
  )
}
