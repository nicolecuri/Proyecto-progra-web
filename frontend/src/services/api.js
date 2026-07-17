const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function handleResponse(response, fallbackMessage) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || fallbackMessage)
  }
  return response.json()
}

export async function fetchExercises() {
  const response = await fetch(`${API_BASE_URL}/api/exercises`)
  return handleResponse(response, 'No se pudieron cargar los ejercicios')
}

export async function fetchRoutines() {
  const response = await fetch(`${API_BASE_URL}/api/routines`)
  return handleResponse(response, 'No se pudieron cargar las rutinas')
}

export async function fetchUsers() {
  const response = await fetch(`${API_BASE_URL}/api/users`)
  return handleResponse(response, 'No se pudieron cargar los usuarios')
}

export async function updateUserToApi(id, payload) {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(response, 'No se pudo actualizar el usuario')
}

export async function deleteUserFromApi(id) {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    method: 'DELETE',
  })
  return handleResponse(response, 'No se pudo eliminar el usuario')
}

export async function loginUserToApi(correo, password) {
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  })

  return handleResponse(response, 'No se pudo iniciar sesión')
}

export async function registerUserToApi(nombre, correo, password) {
  const response = await fetch(`${API_BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, correo, password }),
  })

  return handleResponse(response, 'No se pudo registrar el usuario')
}

export async function saveRoutineToApi(routine) {
  const response = await fetch(`${API_BASE_URL}/api/routines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(routine),
  })
  return handleResponse(response, 'No se pudo guardar la rutina')
}

export async function fetchTracking(userId, date) {
  const response = await fetch(`${API_BASE_URL}/api/tracking/${userId}/${date}`)
  return handleResponse(response, 'No se pudo obtener el tracking')
}

export async function saveTracking(userId, date, data) {
  const response = await fetch(`${API_BASE_URL}/api/tracking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, date, data }),
  })
  return handleResponse(response, 'No se pudo guardar el tracking')
}

export async function listTracking(userId) {
  const response = await fetch(`${API_BASE_URL}/api/tracking/${userId}`)
  return handleResponse(response, 'No se pudo listar el tracking')
}
