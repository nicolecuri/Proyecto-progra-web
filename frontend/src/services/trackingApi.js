// Asume que la URL del backend está en una variable de entorno o usa localhost por defecto
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export async function getDailyTracking(userId, date) {
  try {
    const response = await fetch(`${API_URL}/tracking/daily/${userId}/${date}`)
    if (!response.ok) throw new Error('Error al obtener tracking diario')
    return await response.json()
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function saveDailyTracking(userId, date, data) {
  try {
    const response = await fetch(`${API_URL}/tracking/daily/${userId}/${date}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Error al guardar tracking diario')
    return await response.json()
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function getRoutineProgress(userId, routineId) {
  try {
    const response = await fetch(`${API_URL}/tracking/progress/${userId}/${routineId}`)
    if (!response.ok) throw new Error('Error al obtener progreso de rutina')
    return await response.json()
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function getAllRoutineProgress(userId) {
  try {
    const response = await fetch(`${API_URL}/tracking/progress/${userId}`)
    if (!response.ok) throw new Error('Error al obtener todos los progresos')
    const results = await response.json()
    // Transform array format from backend to the map format expected by frontend: { routineId: { completedExercises, dayComments } }
    const progressMap = {}
    if (Array.isArray(results)) {
      results.forEach(p => {
        progressMap[p.routineId] = {
          completedExercises: p.completedExercises || {},
          dayComments: p.dayComments || {},
        }
      })
    }
    return progressMap
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function saveRoutineProgress(userId, routineId, data) {
  try {
    const response = await fetch(`${API_URL}/tracking/progress/${userId}/${routineId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Error al guardar progreso de rutina')
    return await response.json()
  } catch (error) {
    console.error(error)
    return null
  }
}

export async function getHistory(userId) {
  try {
    const response = await fetch(`${API_URL}/tracking/history/${userId}`)
    if (!response.ok) throw new Error('Error al obtener historial')
    return await response.json()
  } catch (error) {
    console.error(error)
    return []
  }
}
