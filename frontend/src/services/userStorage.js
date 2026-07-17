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

export function setCurrentUser(user) {
  if (!user) return
  localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user))
}

export function clearCurrentUser() {
  localStorage.removeItem(STORAGE_KEY_CURRENT_USER)
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

export function limpiarDatosInnecesarios() {
  try {
    console.log('🧹 Iniciando limpieza de datos...')

    const obsoleteKeys = ['fittrack-users', 'fittrack-workouts']
    obsoleteKeys.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key)
        console.log(`✓ Removido: ${key} (obsoleto)`)
      }
    })

    const today = new Date()
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000)
    const keysToRemove = []

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith('fitplanner-tracking-')) {
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

    console.log('✅ Limpieza de datos completada')
    return true
  } catch (error) {
    console.error('Error durante limpieza de datos:', error)
    return false
  }
}
