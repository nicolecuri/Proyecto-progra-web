import React, { useState, useEffect, useRef } from 'react'
import '../Planner/Planner.css'
import { FLATTENED_EXERCISES, EXERCISE_DB } from '../../services/exerciseDB'

export default function SearchBar({ onSelect }){
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('Todos')
  const [isFocused, setIsFocused] = useState(false)
  const wrapperRef = useRef(null)
  const groups = ['Todos', ...Object.keys(EXERCISE_DB)]

  const suggestions = FLATTENED_EXERCISES.filter((e) => {
    const matchesText = q.length === 0 || e.nombre.toLowerCase().includes(q.toLowerCase())
    const matchesGroup = group === 'Todos' || e.grupoMuscularPrincipal === group
    return matchesText && matchesGroup
  }).slice(0, 12)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div ref={wrapperRef} className={`search-suggestions ${isFocused ? 'search-active' : ''}`}>
      <div className="search-controls">
        <input
          placeholder="Buscar ejercicio..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="search-input"
          onFocus={() => setIsFocused(true)}
        />
        <select className="filter-select" value={group} onChange={(e) => setGroup(e.target.value)}>
          {groups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="suggestions-list">
          {suggestions.map((s) => (
            <div
              key={s.id}
              className="suggestion"
              onClick={() => { onSelect(s); setQ(''); setIsFocused(false) }}
            >
              <div>{s.nombre}</div>
              <div className="suggestion-meta">{s.grupoMuscularPrincipal}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
