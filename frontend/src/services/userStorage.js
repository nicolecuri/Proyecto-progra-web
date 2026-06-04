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
  bloqueado: false,
}

export function obtenerUsuarios() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_USERS)
    if (!stored) return [defaultAdminUser]
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed)
      ? parsed.map((user) => ({ bloqueado: false, ...user }))
      : [defaultAdminUser]
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
  const adminUser = usuarios.find(
    (user) => user.rol === 'admin' && user.correo.toLowerCase() === defaultAdminUser.correo.toLowerCase()
  )
  const usuariosSinAdminEmail = usuarios.filter(
    (user) => user.correo.toLowerCase() !== defaultAdminUser.correo.toLowerCase()
  )
  if (adminUser) {
    guardarUsuarios([adminUser, ...usuariosSinAdminEmail])
  } else {
    guardarUsuarios([defaultAdminUser, ...usuariosSinAdminEmail])
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER)
    if (!raw) return null
    const sessionUser = JSON.parse(raw)
    if (!sessionUser) return null

    const usuarios = obtenerUsuarios()
    if (sessionUser.rol === 'admin') {
      return (
        usuarios.find(
          (user) => user.rol === 'admin' &&
            user.correo.toLowerCase() === defaultAdminUser.correo.toLowerCase()
        ) || defaultAdminUser
      )
    }

    if (sessionUser.rol && sessionUser.correo) {
      return sessionUser
    }

    const matched = usuarios.find(
      (user) =>
        user.correo.toLowerCase() === (sessionUser.correo || sessionUser.email || '').toLowerCase()
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

  if (usuario.bloqueado) {
    return { blocked: true, correo: usuario.correo }
  }

  const loggedUser = usuario.rol === 'admin'
    ? usuarios.find(
        (user) => user.rol === 'admin' && user.correo.toLowerCase() === defaultAdminUser.correo.toLowerCase()
      ) || defaultAdminUser
    : usuario

  localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(loggedUser))
  return loggedUser
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
    bloqueado: false,
  }

  guardarUsuarios([...usuarios, nuevoUsuario])
  localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(nuevoUsuario))
  return nuevoUsuario
}

export function actualizarPerfil(id, datosActualizados) {
  const usuarios = obtenerUsuarios()
  const index = usuarios.findIndex(u => u.id === Number(id))
  if (index === -1) return null

  usuarios[index] = { ...usuarios[index], ...datosActualizados }
  guardarUsuarios(usuarios)

  const currentUser = getCurrentUser()
  if (currentUser && currentUser.id === Number(id)) {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(usuarios[index]))
  }

  return usuarios[index]
}

export function actualizarBloqueoUsuario(id, bloqueado) {
  const usuarios = obtenerUsuarios()
  const index = usuarios.findIndex((u) => u.id === Number(id))
  if (index === -1) return null

  usuarios[index] = {
    ...usuarios[index],
    bloqueado,
    fechaBloqueo: bloqueado ? new Date().toISOString() : null,
  }
  guardarUsuarios(usuarios)
  return usuarios[index]
}

export function obtenerEntrenamientosDeUsuario() {
  // ⚠️ Función deprecated: STORAGE_KEY_WORKOUTS fue removido en limpieza de datos
  // Las entrenamientos ahora se rastrean en: fitplanner-tracking-YYYY-MM-DD
  console.warn('obtenerEntrenamientosDeUsuario() es deprecated. Usa el tracking diario en Dashboard.')
  return []
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

/**
 * Limpia datos innecesarios de localStorage:
 * - Remova claves obsoletas (fittrack-workouts)
 * - Limpia tracking older than 90 days
 * - Valida y normaliza objetos
 */
export function limpiarDatosInnecesarios() {
  try {
    console.log('🧹 Iniciando limpieza de datos...')
    
    // 1. Remover clave obsoleta fittrack-workouts (nunca se usa)
    if (localStorage.getItem(STORAGE_KEY_WORKOUTS)) {
      localStorage.removeItem(STORAGE_KEY_WORKOUTS)
      console.log('✓ Removido: fittrack-workouts (obsoleto)')
    }

    // 2. Limpiar tracking antiguo (> 90 días)
    const today = new Date()
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
    const keysToRemove = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('fitplanner-tracking-')) {
        const dateStr = key.replace('fitplanner-tracking-', '')
        const trackingDate = new Date(dateStr)
        if (trackingDate < ninetyDaysAgo) {
          keysToRemove.push(key)
        }
      }
    }
    
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
    })
    if (keysToRemove.length > 0) {
      console.log(`✓ Removidos ${keysToRemove.length} archivos de tracking antiguos (>90 días)`)
    }

    // 3. Validar y normalizar usuarios
    const usuarios = obtenerUsuarios()
    const usuariosLimpiados = usuarios.map((user) => ({
      id: user.id,
      nombre: user.nombre || 'Usuario',
      correo: user.correo || '',
      password: user.password || '',
      rol: user.rol || 'usuario',
      fechaRegistro: user.fechaRegistro || new Date().toISOString(),
      bloqueado: user.bloqueado === true,
      fechaBloqueo: user.fechaBloqueo || null,
    }))
    
    if (JSON.stringify(usuarios) !== JSON.stringify(usuariosLimpiados)) {
      guardarUsuarios(usuariosLimpiados)
      console.log('✓ Normalizado: estructura de usuarios')
    }

    // 4. Remover sesión si usuario está bloqueado
    const currentUser = getCurrentUser()
    if (currentUser && currentUser.bloqueado === true) {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER)
      console.log('✓ Removida sesión de usuario bloqueado')
    }

    console.log('✅ Limpieza de datos completada')
    return true
  } catch (error) {
    console.error('Error durante limpieza de datos:', error)
    return false
  }
}
