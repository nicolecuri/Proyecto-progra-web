export const EXERCISE_DB = {
  Pectoral: [
    { id: 'pec-press', nombre: 'Press banca', grupoMuscularPrincipal: 'Pectoral', gruposSecundarios: ['Tríceps','Hombros'] },
    { id: 'pec-incline', nombre: 'Press inclinado', grupoMuscularPrincipal: 'Pectoral', gruposSecundarios: ['Hombros'] },
    { id: 'pec-flies', nombre: 'Aperturas', grupoMuscularPrincipal: 'Pectoral', gruposSecundarios: [] },
    { id: 'pec-dips', nombre: 'Fondos', grupoMuscularPrincipal: 'Pectoral', gruposSecundarios: ['Tríceps'] },
    { id: 'pec-cable', nombre: 'Press en máquina', grupoMuscularPrincipal: 'Pectoral', gruposSecundarios: ['Hombros'] },
    { id: 'pec-decline', nombre: 'Press declinado', grupoMuscularPrincipal: 'Pectoral', gruposSecundarios: ['Tríceps'] },
  ],
  Espalda: [
    { id: 'esp-row', nombre: 'Remo con barra', grupoMuscularPrincipal: 'Espalda', gruposSecundarios: ['Bíceps'] },
    { id: 'esp-pullup', nombre: 'Dominadas', grupoMuscularPrincipal: 'Espalda', gruposSecundarios: ['Bíceps'] },
    { id: 'esp-lat', nombre: 'Jalón al pecho', grupoMuscularPrincipal: 'Espalda', gruposSecundarios: ['Bíceps'] },
    { id: 'esp-machine', nombre: 'Remo en máquina', grupoMuscularPrincipal: 'Espalda', gruposSecundarios: [] },
    { id: 'esp-tbar', nombre: 'Remo T-bar', grupoMuscularPrincipal: 'Espalda', gruposSecundarios: ['Bíceps'] },
    { id: 'esp-deadlift', nombre: 'Peso muerto', grupoMuscularPrincipal: 'Espalda', gruposSecundarios: ['Piernas'] },
  ],
  Hombros: [
    { id: 'hom-press', nombre: 'Press militar', grupoMuscularPrincipal: 'Hombros', gruposSecundarios: ['Tríceps'] },
    { id: 'hom-lateral', nombre: 'Elevaciones laterales', grupoMuscularPrincipal: 'Hombros', gruposSecundarios: [] },
    { id: 'hom-facepull', nombre: 'Face Pull', grupoMuscularPrincipal: 'Hombros', gruposSecundarios: [] },
    { id: 'hom-frontraise', nombre: 'Elevaciones frontales', grupoMuscularPrincipal: 'Hombros', gruposSecundarios: [] },
    { id: 'hom-shrug', nombre: 'Encogimientos', grupoMuscularPrincipal: 'Hombros', gruposSecundarios: [] },
  ],
  Piernas: [
    { id: 'leg-squat', nombre: 'Sentadilla', grupoMuscularPrincipal: 'Piernas', gruposSecundarios: ['Glúteos'] },
    { id: 'leg-press', nombre: 'Prensa', grupoMuscularPrincipal: 'Piernas', gruposSecundarios: [] },
    { id: 'leg-rd', nombre: 'Peso muerto rumano', grupoMuscularPrincipal: 'Piernas', gruposSecundarios: ['Isquiotibiales'] },
    { id: 'leg-lunge', nombre: 'Zancadas', grupoMuscularPrincipal: 'Piernas', gruposSecundarios: [] },
    { id: 'leg-legcurl', nombre: 'Curl femoral', grupoMuscularPrincipal: 'Piernas', gruposSecundarios: [] },
    { id: 'leg-legext', nombre: 'Extensiones', grupoMuscularPrincipal: 'Piernas', gruposSecundarios: [] },
  ],
  Bíceps: [
    { id: 'bic-bar', nombre: 'Curl barra', grupoMuscularPrincipal: 'Bíceps', gruposSecundarios: [] },
    { id: 'bic-hammer', nombre: 'Curl martillo', grupoMuscularPrincipal: 'Bíceps', gruposSecundarios: [] },
    { id: 'bic-incline', nombre: 'Curl inclinado', grupoMuscularPrincipal: 'Bíceps', gruposSecundarios: [] },
    { id: 'bic-21s', nombre: 'Curl 21s', grupoMuscularPrincipal: 'Bíceps', gruposSecundarios: [] },
  ],
  Tríceps: [
    { id: 'tri-pushdown', nombre: 'Extensión polea', grupoMuscularPrincipal: 'Tríceps', gruposSecundarios: [] },
    { id: 'tri-french', nombre: 'Press francés', grupoMuscularPrincipal: 'Tríceps', gruposSecundarios: [] },
    { id: 'tri-dips', nombre: 'Fondos tríceps', grupoMuscularPrincipal: 'Tríceps', gruposSecundarios: [] },
    { id: 'tri-close', nombre: 'Press cerrado', grupoMuscularPrincipal: 'Tríceps', gruposSecundarios: ['Pectoral'] },
  ],
  Gemelos: [
    { id: 'calf-raise', nombre: 'Elevación de talones', grupoMuscularPrincipal: 'Gemelos', gruposSecundarios: [] },
    { id: 'calf-seated', nombre: 'Gemelos sentado', grupoMuscularPrincipal: 'Gemelos', gruposSecundarios: [] },
    { id: 'calf-single', nombre: 'Elevación a una pierna', grupoMuscularPrincipal: 'Gemelos', gruposSecundarios: [] },
  ],
  Abdominales: [
    { id: 'abs-crunch', nombre: 'Crunch', grupoMuscularPrincipal: 'Abdominales', gruposSecundarios: [] },
    { id: 'abs-legraise', nombre: 'Elevación de piernas', grupoMuscularPrincipal: 'Abdominales', gruposSecundarios: [] },
    { id: 'abs-plank', nombre: 'Plancha', grupoMuscularPrincipal: 'Abdominales', gruposSecundarios: [] },
    { id: 'abs-russian', nombre: 'Russian twist', grupoMuscularPrincipal: 'Abdominales', gruposSecundarios: [] },
    { id: 'abs-hanging', nombre: 'Elevación colgado', grupoMuscularPrincipal: 'Abdominales', gruposSecundarios: [] },
  ],
}

export const FLATTENED_EXERCISES = Object.values(EXERCISE_DB).flat()
