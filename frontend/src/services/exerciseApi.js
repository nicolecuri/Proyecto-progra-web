const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export async function getAllExercises() {
  try {
    const response = await fetch(`${API_URL}/exercises`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return []
  }
}
