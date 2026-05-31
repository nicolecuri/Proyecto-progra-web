const STORAGE_KEY_USERS = 'fittrack-users'
const STORAGE_KEY_CURRENT_USER = 'user'
const STORAGE_KEY_WORKOUTS = 'fittrack-workouts'

const defaultAdminUser = {
  id: 0,
  nombre: 'Administrador',
  correo: 'admin@gmail.com',
  password: 'admin123',
  rol: 'admin',
  fechaRegistro: new Date().toISOString(),
}

export function obtenerUsuarios() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USERS)
    if (!stored) return [defaultAdminUser]
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : [defaultAdminUser]
  } catch (error) {
    console.warn('Error leyendo usuarios desde localStorage:', error)
    return [defaultAdminUser]
  }
}

export function guardarUsuarios(usuarios) {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(usuarios))
}

export function buscarUsuarioPorId(id) {
  const usuarios = obtenerUsuarios()
  return usuarios.find((usuario) => usuario.id === Number(id)) || null
}

export function eliminarUsuario(id) {
  const usuarios = obtenerUsuarios()
  const usuario = usuarios.find((user) => user.id === Number(id))
  if (!usuario) return null
  if (usuario.rol === 'admin') {
    return null
  }

  const restante = usuarios.filter((user) => user.id !== Number(id))
  guardarUsuarios(restante)
  return usuario
}

export function obtenerEstadisticasUsuarios(usuarios = []) {
  const totalUsuarios = usuarios.filter((user) => user.rol === 'usuario').length
  const totalAdmins = usuarios.filter((user) => user.rol === 'admin').length

  return {
    usuarios: totalUsuarios,
    administradores: totalAdmins,
    totalCuentas: usuarios.length,
  }
}

export function ensureAdminUser() {
  const usuarios = obtenerUsuarios()
  const adminExists = usuarios.some((user) => user.rol === 'admin' && user.correo === defaultAdminUser.correo)
  if (!adminExists) {
    guardarUsuarios([defaultAdminUser, ...usuarios.filter((user) => user.rol !== 'admin' || user.correo !== defaultAdminUser.correo)])
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER)
    if (!raw) return null
    const sessionUser = JSON.parse(raw)
    if (!sessionUser) return null

    if (sessionUser.rol && sessionUser.correo) {
      return sessionUser
    }

    const usuarios = obtenerUsuarios()
    const matched = usuarios.find(
      (user) => user.correo === sessionUser.correo || user.correo === sessionUser.email
    )
    return matched || {
      nombre: sessionUser.nombre || sessionUser.name || 'Usuario',
      correo: sessionUser.correo || sessionUser.email || '',
      rol: 'usuario',
    }
  } catch (error) {
    console.warn('Error leyendo usuario actual:', error)
    return null
  }
}

export function loginUsuario(correo, password) {
  ensureAdminUser()
  const usuarios = obtenerUsuarios()
  const usuario = usuarios.find(
    (user) => user.correo.toLowerCase() === correo.toLowerCase() && user.password === password
  )
  if (!usuario) {
    return null
  }

  localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(usuario))
  return usuario
}

export function registrarUsuario({ nombre, correo, password }) {
  ensureAdminUser()
  const usuarios = obtenerUsuarios()
  const existe = usuarios.some((user) => user.correo.toLowerCase() === correo.toLowerCase())
  if (existe) {
    return null
  }

  const nuevoUsuario = {
    id: usuarios.length ? Math.max(...usuarios.map((user) => user.id)) + 1 : 1,
    nombre,
    correo,
    password,
    rol: 'usuario',
    fechaRegistro: new Date().toISOString(),
  }

  guardarUsuarios([...usuarios, nuevoUsuario])
  localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(nuevoUsuario))
  return nuevoUsuario
}

export function obtenerEntrenamientosDeUsuario(userId) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_WORKOUTS)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => Number(item.userId) === Number(userId))
  } catch (error) {
    console.warn('Error leyendo entrenamientos de usuario:', error)
    return []
  }
}

export function obtenerConteoEntrenamientos(userId) {
  const workouts = obtenerEntrenamientosDeUsuario(userId)
  const completados = workouts.filter((workout) => workout.status === 'completed' || workout.completado === true).length
  const registrados = workouts.length
  return {
    registrados,
    completados,
    pendientes: registrados - completados,
  }
}
