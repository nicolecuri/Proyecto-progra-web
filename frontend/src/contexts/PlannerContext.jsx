import React, { createContext, useContext, useReducer, useMemo, useEffect } from 'react'
import { plannerReducer, initialPlan } from './plannerReducer'
import { getCurrentUser } from '../services/userStorage'
import { summarizeWeek } from '../utils/calculations'

const PlannerContext = createContext(null)
const BASE_KEY = 'fitplanner-v1'

const getStorageKey = () => {
  const user = getCurrentUser()
  if (!user) return `${BASE_KEY}:guest`
  // use correo if available, fall back to id or name
  const ident = user.correo || user.id || user.nombre || 'guest'
  return `${BASE_KEY}:${ident}`
}

const loadInitialState = () => {
  try {
    const key = getStorageKey()
    const persisted = localStorage.getItem(key)
    if (persisted) {
      const parsed = JSON.parse(persisted)
      if (parsed && parsed.plan) return parsed
    }
  } catch (error) {
    console.warn('No se pudo cargar el estado del planificador:', error)
  }
  return {
    plan: initialPlan(),
    savedRoutines: [],
    previewRoutineId: null,
    editingRoutineId: null,
  }
}

export function PlannerProvider({ children }) {
  const [state, dispatch] = useReducer(plannerReducer, null, loadInitialState)

  useEffect(() => {
    try {
      const key = getStorageKey()
      localStorage.setItem(key, JSON.stringify(state))
    } catch (error) {
      console.warn('No se pudo guardar el estado del planificador:', error)
    }
  }, [state])

  const resumen = useMemo(() => summarizeWeek(state.plan), [state.plan])

  const actions = {
    addExercise: (diaNombre, ejercicio) => dispatch({ type: 'ADD_EXERCISE', payload: { diaNombre, ejercicio } }),
    editExercise: (diaNombre, id, updates) => dispatch({ type: 'EDIT_EXERCISE', payload: { diaNombre, id, updates } }),
    deleteExercise: (diaNombre, id) => dispatch({ type: 'DELETE_EXERCISE', payload: { diaNombre, id } }),
    duplicateExercise: (diaNombre, id) => dispatch({ type: 'DUPLICATE_EXERCISE', payload: { diaNombre, id } }),
    moveExercise: (diaNombre, id, direction) => dispatch({ type: 'MOVE_EXERCISE', payload: { diaNombre, id, direction } }),
    reorderExercises: (diaNombre, newOrder) => dispatch({ type: 'REORDER_EXERCISES', payload: { diaNombre, newOrder } }),
    toggleDescanso: (diaNombre) => dispatch({ type: 'TOGGLE_DESCANSO', payload: { diaNombre } }),
    saveRoutine: (name) => dispatch({ type: 'SAVE_ROUTINE', payload: { name } }),
    setPreviewRoutine: (id) => dispatch({ type: 'SET_PREVIEW_ROUTINE', payload: { id } }),
    loadRoutine: (id) => dispatch({ type: 'LOAD_ROUTINE', payload: { id } }),
    deleteRoutine: (id) => dispatch({ type: 'DELETE_ROUTINE', payload: { id } }),
  }

  return (
    <PlannerContext.Provider value={{ state, dispatch, actions, resumen }}>
      {children}
    </PlannerContext.Provider>
  )
}

export function usePlanner() {
  const ctx = useContext(PlannerContext)
  if (!ctx) throw new Error('usePlanner must be used inside PlannerProvider')
  return ctx
}
