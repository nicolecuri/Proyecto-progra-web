import React from 'react'
import '../Planner/Planner.css'
import ExerciseCard from './ExerciseCard'
import SearchBar from './SearchBar'

export default function DayView({ dia, planId, actions }){
  const handleAdd = (ex) => {
    const ejercicioPlanificado = { nombre: ex.nombre, grupoMuscularPrincipal: ex.grupoMuscularPrincipal, gruposSecundarios: ex.gruposSecundarios || [], series: 3, repeticiones: 8, peso: 0, notas: '', orden: 0 }
    actions.addExercise(dia.diaNombre, ejercicioPlanificado)
  }

  return (
    <div className="card planner-right">
      <div className="day-view-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
        <h3>{dia.diaNombre}</h3>
        <button className="btn" onClick={()=>actions.toggleDescanso(dia.diaNombre)}>
          {dia.isDescanso ? 'Quitar descanso' : 'Marcar día de descanso'}
        </button>
      </div>

      {dia.isDescanso ? (
        <div className="rest-day-banner">
          <strong>Día de descanso</strong>
          <p>Este día se marcará como descanso y no contará en el volumen semanal.</p>
        </div>
      ) : (
        <>
          <SearchBar key={planId} onSelect={handleAdd} />
          <div className="exercise-list" style={{marginTop:12}}>
            {dia.ejercicios.map(ex => (
              <ExerciseCard key={ex.id} ejercicio={ex} diaNombre={dia.diaNombre}
                onEdit={(updated)=>actions.editExercise(dia.diaNombre, ex.id, updated)}
                onDelete={actions.deleteExercise}
              />
            ))}
            {dia.ejercicios.length===0 && <div className="empty-state">Aún no hay ejercicios en este día. Usa el buscador para agregarlos.</div>}
          </div>
        </>
      )}
    </div>
  )
}
