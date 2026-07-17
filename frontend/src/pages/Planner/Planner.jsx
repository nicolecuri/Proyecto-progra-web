import { useState } from 'react'
import { PlannerProvider, usePlanner } from '../../contexts/PlannerContext'
import { saveRoutineToApi } from '../../services/api'
import DashboardPanel from '../../components/Planner/DashboardPanel'
import DaySelector from '../../components/Planner/DaySelector'
import DayView from '../../components/Planner/DayView'
import RoutineActions from '../../components/Planner/RoutineActions'
import '../../components/Planner/Planner.css'

function PlannerInner(){
  const { state, resumen, actions } = usePlanner()
  const [selected, setSelected] = useState(state.plan.dias[0].diaNombre)
  const dia = state.plan.dias.find((d) => d.diaNombre === selected)

  const handleSave = async (name) => {
    try {
      await actions.saveRoutine(name)
    } catch (error) {
      console.error('Error guardando rutina en API:', error)
      alert('No se pudo guardar la rutina en el servidor. Intenta nuevamente.')
    }
  }

  const handleDownload = () => {
    const filename = `${state.plan.nombre.replace(/\s+/g,'_').toLowerCase() || 'rutina'}.json`
    const blob = new Blob([JSON.stringify(state.plan, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="planner-root">
      <DashboardPanel
        resumen={resumen}
        savedRoutines={state.savedRoutines}
        previewRoutineId={state.previewRoutineId}
        setPreviewRoutine={actions.setPreviewRoutine}
        loadRoutine={actions.loadRoutine}
        deleteRoutine={actions.deleteRoutine}
      />

      <div style={{flex:2}}>
        <RoutineActions
          onSave={handleSave}
          onDownload={handleDownload}
          onPrint={handlePrint}
          editingRoutineId={state.editingRoutineId}
          currentRoutineName={state.plan.nombre}
        />
        <DaySelector dias={state.plan.dias} selected={selected} onSelect={setSelected} />
        <DayView dia={dia} planId={state.plan.id} actions={actions} />
      </div>
    </div>
  )
}

export default function PlannerPage(){
  return (
    <PlannerProvider>
      <PlannerInner />
    </PlannerProvider>
  )
}
