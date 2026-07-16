const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function fetchExercises() {
  const response = await fetch(`${API_BASE_URL}/api/exercises`)
  if (!response.ok) throw new Error('No se pudieron cargar los ejercicios')
  return response.json()
}

export async function fetchRoutines() {
  const response = await fetch(`${API_BASE_URL}/api/routines`)
  if (!response.ok) throw new Error('No se pudieron cargar las rutinas')
  return response.json()
}

export async function loginUserToApi(correo, password) {
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'No se pudo iniciar sesión')
  }

  return response.json()
}

export async function registerUserToApi(nombre, correo, password) {
  const response = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, correo, password }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'No se pudo registrar el usuario')
  }

  return response.json()
}

export async function saveRoutineToApi(routine) {
  const response = await fetch(`${API_BASE_URL}/api/routines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(routine),
  })
  if (!response.ok) throw new Error('No se pudo guardar la rutina')
  return response.json()
}
