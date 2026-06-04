/**
 * Utilidad de diagnóstico y limpieza de localStorage
 * Proporciona reporte detallado del estado de datos almacenados
 */

export function obtenerEstadoStorage() {
  const estado = {
    keysTotal: localStorage.length,
    tamaño: 0,
    categorías: {
      usuarios: [],
      rutinas: [],
      progreso: [],
      tracking: [],
      sesión: [],
      otros: [],
    },
    resumen: {},
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    const value = localStorage.getItem(key)
    const sizeBytes = new Blob([value]).size
    estado.tamaño += sizeBytes

    let categoría = 'otros'
    if (key === 'fittrack-users') {
      categoría = 'usuarios'
    } else if (key === 'user') {
      categoría = 'sesión'
    } else if (key === 'fitplanner-active-routine') {
      categoría = 'sesión'
    } else if (key.startsWith('fitplanner-v1') && key.includes(':progress')) {
      categoría = 'progreso'
    } else if (key.startsWith('fitplanner-v1') && !key.includes(':progress')) {
      categoría = 'rutinas'
    } else if (key.startsWith('fitplanner-tracking-')) {
      categoría = 'tracking'
    }

    estado.categorías[categoría].push({ key, sizeKB: (sizeBytes / 1024).toFixed(2) })
  }

  // Resumen por categoría
  Object.entries(estado.categorías).forEach(([cat, items]) => {
    if (items.length > 0) {
      const totalKB = items.reduce((sum, item) => sum + parseFloat(item.sizeKB), 0)
      estado.resumen[cat] = { cantidad: items.length, tamaño: totalKB.toFixed(2) + ' KB' }
    }
  })

  return estado
}

export function generarReporteStorage() {
  const estado = obtenerEstadoStorage()

  let reporte = '\n╔═══════════════════════════════════════════════════════╗\n'
  reporte += '║           REPORTE DE ALMACENAMIENTO (localStorage)      ║\n'
  reporte += '╚═══════════════════════════════════════════════════════╝\n\n'

  reporte += `📊 RESUMEN GENERAL:\n`
  reporte += `  • Total de claves: ${estado.keysTotal}\n`
  reporte += `  • Tamaño total: ${(estado.tamaño / 1024).toFixed(2)} KB\n\n`

  reporte += `📂 POR CATEGORÍA:\n`
  Object.entries(estado.resumen).forEach(([cat, datos]) => {
    const iconos = {
      usuarios: '👥',
      rutinas: '💪',
      progreso: '📈',
      tracking: '📅',
      sesión: '🔐',
      otros: '📦',
    }
    reporte += `  ${iconos[cat] || '•'} ${cat}: ${datos.cantidad} items (${datos.tamaño})\n`
  })

  reporte += `\n📝 DETALLES:\n`
  Object.entries(estado.categorías).forEach(([cat, items]) => {
    if (items.length > 0) {
      reporte += `\n  ${cat.toUpperCase()}:\n`
      items.forEach(({ key, sizeKB }) => {
        reporte += `    • ${key} (${sizeKB} KB)\n`
      })
    }
  })

  console.log(reporte)
  return reporte
}

export function verificarIntegridad() {
  const problemas = []

  // Verificar que exista admin
  try {
    const usersRaw = localStorage.getItem('fittrack-users')
    if (usersRaw) {
      const users = JSON.parse(usersRaw)
      const hasAdmin = users.some((u) => u.rol === 'admin' && u.correo === 'admin@gmail.com')
      if (!hasAdmin) problemas.push('⚠️  No hay usuario administrador válido')
    }
  } catch (e) {
    problemas.push('❌ Error leyendo usuarios: ' + e.message)
  }

  // Verificar que no exista clave obsoleta
  if (localStorage.getItem('fittrack-workouts')) {
    problemas.push('⚠️  Detectado: fittrack-workouts (debe removerse)')
  }

  // Advertencia sobre datos muy antiguos
  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  let trackingAntiguo = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key.startsWith('fitplanner-tracking-')) {
      const dateStr = key.replace('fitplanner-tracking-', '')
      const trackingDate = new Date(dateStr)
      if (trackingDate < ninetyDaysAgo) {
        trackingAntiguo++
      }
    }
  }

  if (trackingAntiguo > 0) {
    problemas.push(`ℹ️  ${trackingAntiguo} archivos de tracking mayores a 90 días (considerar limpiar)`)
  }

  return {
    válido: problemas.length === 0,
    problemas,
  }
}
