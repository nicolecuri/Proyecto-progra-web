const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export async function getRoutinesByUser(userId) {
  try {
    const response = await fetch(`${API_URL}/routines/user/${userId}`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Error fetching routines:', error)
    return []
  }
}

export async function saveRoutine(userId, nombre, plan) {
  try {
    const response = await fetch(`${API_URL}/routines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, nombre, plan })
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error saving routine:', error)
    return null
  }
}

export async function updateRoutine(id, nombre, plan) {
  try {
    const response = await fetch(`${API_URL}/routines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, plan })
    })
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error updating routine:', error)
    return null
  }
}

export async function deleteRoutine(id) {
  try {
    const response = await fetch(`${API_URL}/routines/${id}`, {
      method: 'DELETE'
    })
    return response.ok
  } catch (error) {
    console.error('Error deleting routine:', error)
    return false
  }
}
