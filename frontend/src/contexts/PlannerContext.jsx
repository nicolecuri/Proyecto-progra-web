import React, { createContext, useContext, useReducer, useMemo, useEffect } from 'react'
import { plannerReducer, initialPlan } from './plannerReducer'
import { summarizeWeek } from '../utils/calculations'

const PlannerContext = createContext(null)
const STORAGE_KEY = 'fitplanner-v1'

const loadInitialState = () => {
  try {
    const persisted = localStorage.getItem(STORAGE_KEY)
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
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
