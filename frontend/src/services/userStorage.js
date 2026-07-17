const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const STORAGE_KEY_CURRENT_USER = 'user'

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    console.warn('Error leyendo usuario actual:', error)
    return null
  }
}

export async function loginUsuario(correo, password) {
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password })
    })
    
    if (!response.ok) {
      if (response.status === 403) return { blocked: true, correo }
      return null
    }

    const user = await response.json()
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user))
    return user
  } catch (error) {
    console.error('Error en login:', error)
    return null
  }
}

export async function registrarUsuario({ nombre, correo, password }) {
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, password })
    })
    
    if (!response.ok) return null

    const user = await response.json()
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user))
    return user
  } catch (error) {
    console.error('Error en registro:', error)
    return null
  }
}

export async function obtenerUsuarios() {
  try {
    const response = await fetch(`${API_URL}/users`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
    return []
  }
}

export async function buscarUsuarioPorId(id) {
  try {
    const response = await fetch(`${API_URL}/users/${id}`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error buscando usuario:', error)
    return null
  }
}

export async function eliminarUsuario(id) {
  try {
    const response = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' })
    if (!response.ok) return null
    return { ok: true }
  } catch (error) {
    console.error('Error eliminando usuario:', error)
    return null
  }
}

export async function actualizarPerfil(id, datosActualizados) {
  try {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosActualizados)
    })
    
    if (!response.ok) return null
    const user = await response.json()

    const currentUser = getCurrentUser()
    if (currentUser && currentUser.id === user.id) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user))
    }

    return user
  } catch (error) {
    console.error('Error actualizando perfil:', error)
    return null
  }
}

export async function actualizarBloqueoUsuario(id, bloqueado) {
  return actualizarPerfil(id, { bloqueado })
}

export async function obtenerEstadisticasUsuarios(usuarios = []) {
  const totalUsuarios = usuarios.filter((user) => user.rol === 'usuario').length
  const totalAdmins = usuarios.filter((user) => user.rol === 'admin').length

  return {
    usuarios: totalUsuarios,
    administradores: totalAdmins,
    totalCuentas: usuarios.length,
  }
}

export function ensureAdminUser() {
  // Manejado ahora en el script de carga de base de datos del backend (initSeed)
}

export function obtenerEntrenamientosDeUsuario() {
  console.warn('obtenerEntrenamientosDeUsuario() es deprecated. Usa el tracking diario en Dashboard.')
  return []
}

export function obtenerConteoEntrenamientos() {
  return { registrados: 0, completados: 0, pendientes: 0 }
}

export function limpiarDatosInnecesarios() {
  try {
    // Solo eliminamos la sesión si estamos bloqueados (como seguridad extra)
    const currentUser = getCurrentUser()
    if (currentUser && currentUser.bloqueado === true) {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER)
    }
    return true
  } catch (error) {
    console.error('Error durante limpieza de datos:', error)
    return false
  }
}
