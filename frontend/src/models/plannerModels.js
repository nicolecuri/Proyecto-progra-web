/**
 * Model definitions for the Planner module.
 * These are lightweight JS representations with JSDoc for clarity.
 */

/** @typedef {{ id: string, nombre: string, grupoMuscularPrincipal: string, gruposSecundarios: string[] }} GrupoEjercicio */

/** @typedef {{ id: string, nombre: string, grupoMuscularPrincipal: string, gruposSecundarios: string[], series: number, repeticiones: number, peso: number, notas?: string, orden: number }} EjercicioPlanificado */

/** @typedef {{ diaNombre: string, ejercicios: EjercicioPlanificado[], isDescanso?: boolean }} DiaEntrenamiento */

/** @typedef {{ id: string, nombre: string, dias: DiaEntrenamiento[] }} PlanSemanal */

/** @typedef {{ id: string, nombre: string, createdAt: string, plan: PlanSemanal }} RutinaGuardada */

/** @typedef {{ totalSeries: number, totalEjercicios: number, totalRepeticiones: number, volumenTotal: number, frecuenciaPorMusculo: Record<string,number>, volumenPorMusculo: Record<string,number>, diasActivos: number, diasDescanso: number }} ResumenSemanal */

export {}
