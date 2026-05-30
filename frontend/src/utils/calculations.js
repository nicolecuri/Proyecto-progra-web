export function calculateExerciseVolume(e) {
  const s = Number(e.series) || 0
  const r = Number(e.repeticiones) || 0
  const p = Number(e.peso) || 0
  return s * r * p
}

export function volumeStatus(seriesCount) {
  if (seriesCount <= 5) return 'Muy bajo'
  if (seriesCount <= 9) return 'Mínimo'
  if (seriesCount <= 20) return 'Óptimo'
  return 'Alto'
}

export function summarizeWeek(plan) {
  const resumen = {
    totalSeries: 0,
    totalEjercicios: 0,
    totalRepeticiones: 0,
    volumenTotal: 0,
    frecuenciaPorMusculo: {},
    volumenPorMusculo: {},
    diasActivos: 0,
    diasDescanso: 0,
  }

  plan.dias.forEach((dia) => {
    const isDescanso = dia.isDescanso || !dia.ejercicios || dia.ejercicios.length === 0
    if (isDescanso) {
      resumen.diasDescanso += 1
      return
    }

    resumen.diasActivos += 1
    dia.ejercicios.forEach((ex) => {
      resumen.totalEjercicios += 1
      resumen.totalSeries += Number(ex.series) || 0
      resumen.totalRepeticiones += (Number(ex.series) || 0) * (Number(ex.repeticiones) || 0)
      const vol = calculateExerciseVolume(ex)
      resumen.volumenTotal += vol
      const m = ex.grupoMuscularPrincipal || 'Otros'
      resumen.frecuenciaPorMusculo[m] = (resumen.frecuenciaPorMusculo[m] || 0) + 1
      resumen.volumenPorMusculo[m] = (resumen.volumenPorMusculo[m] || 0) + (Number(ex.series) || 0)
    })
  })

  return resumen
}
