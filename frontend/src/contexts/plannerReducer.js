const genId = () => Math.random().toString(36).slice(2,9)

const normalizePlan = (plan) => ({
  ...plan,
  dias: plan.dias.map((dia) => ({
    ...dia,
    isDescanso: dia.isDescanso || !dia.ejercicios || dia.ejercicios.length === 0,
  })),
})

export const initialPlan = () => {
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((d) => ({ diaNombre: d, ejercicios: [], isDescanso: false }))
  return { id: genId(), nombre: 'Plan semanal', dias }
}

export function plannerReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return action.payload

    case 'SET_SAVED_ROUTINES':
      return {
        ...state,
        savedRoutines: action.payload
      }

    case 'RESET_PLAN':
      return {
        ...state,
        plan: initialPlan(),
        editingRoutineId: null,
      }

    case 'ADD_EXERCISE': {
      const { diaNombre, ejercicio } = action.payload
      return {
        ...state,
        plan: {
          ...state.plan,
          dias: state.plan.dias.map((d) => {
            if (d.diaNombre !== diaNombre) return d
            const orden = d.ejercicios.length ? Math.max(...d.ejercicios.map((e) => e.orden)) + 1 : 1
            const ex = { ...ejercicio, id: genId(), orden }
            return { ...d, ejercicios: [...d.ejercicios, ex] }
          }),
        },
      }
    }

    case 'EDIT_EXERCISE': {
      const { diaNombre, id, updates } = action.payload
      return {
        ...state,
        plan: {
          ...state.plan,
          dias: state.plan.dias.map((d) => {
            if (d.diaNombre !== diaNombre) return d
            return { ...d, ejercicios: d.ejercicios.map((ex) => (ex.id === id ? { ...ex, ...updates } : ex)) }
          }),
        },
      }
    }

    case 'DELETE_EXERCISE': {
      const { diaNombre, id } = action.payload
      return {
        ...state,
        plan: {
          ...state.plan,
          dias: state.plan.dias.map((d) => (d.diaNombre === diaNombre ? { ...d, ejercicios: d.ejercicios.filter((e) => e.id !== id) } : d)),
        },
      }
    }

    case 'MOVE_EXERCISE': {
      const { diaNombre, id, direction } = action.payload
      return {
        ...state,
        plan: {
          ...state.plan,
          dias: state.plan.dias.map((d) => {
            if (d.diaNombre !== diaNombre) return d
            const idx = d.ejercicios.findIndex((e) => e.id === id)
            if (idx === -1) return d
            const arr = [...d.ejercicios]
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1
            if (swapIdx < 0 || swapIdx >= arr.length) return d
            const tmp = arr[swapIdx]
            arr[swapIdx] = arr[idx]
            arr[idx] = tmp
            return { ...d, ejercicios: arr.map((e, i) => ({ ...e, orden: i + 1 })) }
          }),
        },
      }
    }

    case 'REORDER_EXERCISES': {
      const { diaNombre, newOrder } = action.payload
      return {
        ...state,
        plan: {
          ...state.plan,
          dias: state.plan.dias.map((d) => {
            if (d.diaNombre !== diaNombre) return d
            const idToEx = Object.fromEntries(d.ejercicios.map((e) => [e.id, e]))
            const reordered = newOrder.map((id, i) => ({ ...idToEx[id], orden: i + 1 }))
            return { ...d, ejercicios: reordered }
          }),
        },
      }
    }

    case 'TOGGLE_DESCANSO': {
      const { diaNombre } = action.payload
      return {
        ...state,
        plan: {
          ...state.plan,
          dias: state.plan.dias.map((d) => (d.diaNombre === diaNombre ? { ...d, isDescanso: !d.isDescanso } : d)),
        },
      }
    }

    case 'SAVE_ROUTINE_LOCAL': {
      const { name } = action.payload
      const routineName = name?.trim() || state.plan.nombre || `Rutina ${state.savedRoutines.length + 1}`
      const normalizedPlan = normalizePlan({ ...state.plan, nombre: routineName })
      if (state.editingRoutineId) {
        const updatedRoutines = state.savedRoutines.map((routine) =>
          routine.id === state.editingRoutineId
            ? { ...routine, nombre: routineName, plan: { ...normalizedPlan, id: routine.id, nombre: routineName } }
            : routine,
        )
        return {
          ...state,
          savedRoutines: updatedRoutines,
          previewRoutineId: state.editingRoutineId,
          editingRoutineId: null,
          plan: initialPlan(),
        }
      }

      const newRoutine = {
        id: 'local-' + genId(),
        nombre: routineName,
        createdAt: new Date().toISOString(),
        plan: { ...normalizedPlan, id: genId(), nombre: routineName },
      }
      return {
        ...state,
        savedRoutines: [...state.savedRoutines, newRoutine],
        previewRoutineId: newRoutine.id,
        plan: initialPlan(),
      }
    }

    case 'LOAD_ROUTINE': {
      const { id } = action.payload
      const target = state.savedRoutines.find((routine) => routine.id === id)
      if (!target) return state
      return {
        ...state,
        plan: normalizePlan(target.plan),
        previewRoutineId: target.id,
        editingRoutineId: target.id,
      }
    }

    case 'DELETE_ROUTINE': {
      const { id } = action.payload
      const remaining = state.savedRoutines.filter((routine) => routine.id !== id)
      const nextPreview = remaining.length ? remaining[remaining.length - 1].id : null
      return {
        ...state,
        savedRoutines: remaining,
        previewRoutineId: state.previewRoutineId === id ? nextPreview : state.previewRoutineId,
        editingRoutineId: state.editingRoutineId === id ? null : state.editingRoutineId,
      }
    }

    case 'SET_PREVIEW_ROUTINE': {
      return {
        ...state,
        previewRoutineId: action.payload.id,
      }
    }

    default:
      return state
  }
}
