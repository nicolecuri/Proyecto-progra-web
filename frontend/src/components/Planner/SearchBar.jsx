import { useState, useEffect, useRef } from 'react'
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
        <select 
          className="filter-select" 
          value={group} 
          onChange={(e) => setGroup(e.target.value)}
          style={{ 
            padding: '10px 36px 10px 10px', 
            borderRadius: '8px', 
            background: `var(--panel-bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right 12px center`, 
            color: 'var(--text-primary)', 
            border: '1px solid var(--border-color)', 
            boxSizing: 'border-box',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none'
          }}
        >
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
