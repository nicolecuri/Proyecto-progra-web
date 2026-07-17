import { createContext, useReducer, useEffect, useMemo, useContext } from 'react'
import { plannerReducer, initialPlan } from './plannerReducer'
import { getCurrentUser } from '../services/userStorage'
import { summarizeWeek } from '../utils/calculations'
import { getRoutinesByUser, saveRoutine as saveRoutineApi, updateRoutine as updateRoutineApi, deleteRoutine as deleteRoutineApi } from '../services/routineApi'

const PlannerContext = createContext(null)
const BASE_KEY = 'fitplanner-v1'

const getStorageKey = () => {
  const user = getCurrentUser()
  if (!user) return `${BASE_KEY}:guest`
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
    async function fetchRoutines() {
      const user = getCurrentUser()
      if (user) {
        const routines = await getRoutinesByUser(user.id || user.correo)
        dispatch({ type: 'SET_SAVED_ROUTINES', payload: routines })
      }
    }
    fetchRoutines()
  }, [])

  useEffect(() => {
    try {
      const key = getStorageKey()
      // Only store local state for recovery, but we will rely on API for savedRoutines
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
    moveExercise: (diaNombre, id, direction) => dispatch({ type: 'MOVE_EXERCISE', payload: { diaNombre, id, direction } }),
    reorderExercises: (diaNombre, newOrder) => dispatch({ type: 'REORDER_EXERCISES', payload: { diaNombre, newOrder } }),
    toggleDescanso: (diaNombre) => dispatch({ type: 'TOGGLE_DESCANSO', payload: { diaNombre } }),
    saveRoutine: async (name) => {
      const user = getCurrentUser()
      if (!user) {
        dispatch({ type: 'SAVE_ROUTINE_LOCAL', payload: { name } })
        return
      }
      
      const routineName = name?.trim() || state.plan.nombre || `Rutina ${state.savedRoutines.length + 1}`
      let savedData;

      if (state.editingRoutineId && !String(state.editingRoutineId).startsWith('local-')) {
        savedData = await updateRoutineApi(state.editingRoutineId, routineName, state.plan)
      } else {
        savedData = await saveRoutineApi(user.id || user.correo, routineName, state.plan)
      }

      if (savedData) {
        const routines = await getRoutinesByUser(user.id || user.correo)
        dispatch({ type: 'SET_SAVED_ROUTINES', payload: routines })
        dispatch({ type: 'RESET_PLAN' })
      }
    },
    setPreviewRoutine: (id) => dispatch({ type: 'SET_PREVIEW_ROUTINE', payload: { id } }),
    loadRoutine: (id) => dispatch({ type: 'LOAD_ROUTINE', payload: { id } }),
    deleteRoutine: async (id) => {
      const user = getCurrentUser()
      if (user && !String(id).startsWith('local-')) {
        await deleteRoutineApi(id)
        const routines = await getRoutinesByUser(user.id || user.correo)
        dispatch({ type: 'SET_SAVED_ROUTINES', payload: routines })
      } else {
        dispatch({ type: 'DELETE_ROUTINE', payload: { id } })
      }
    },
  }

  return (
    <PlannerContext.Provider value={{ state, dispatch, actions, resumen }}>
      {children}
    </PlannerContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlanner() {
  const ctx = useContext(PlannerContext)
  if (!ctx) throw new Error('usePlanner must be used inside PlannerProvider')
  return ctx
}
