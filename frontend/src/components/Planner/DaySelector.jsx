import React from 'react'
import '../Planner/Planner.css'

export default function DaySelector({ dias, selected, onSelect }){
  return (
    <div className="card">
      <h4>Días</h4>
      <div className="days-list">
        {dias.map(d => (
          <div
            key={d.diaNombre}
            className={`day-pill ${selected===d.diaNombre? 'active':''} ${d.isDescanso ? 'rest-day' : ''}`}
            onClick={()=>onSelect(d.diaNombre)}
          >
            {d.diaNombre}
            {d.isDescanso && <span style={{fontSize:'0.75rem',marginLeft:6}}>Descanso</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
