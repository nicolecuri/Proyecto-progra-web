import { useMemo, useState, useEffect } from 'react'
import {
  obtenerUsuarios,
  eliminarUsuario,
  obtenerEstadisticasUsuarios,
  obtenerConteoEntrenamientos,
  actualizarPerfil,
  actualizarBloqueoUsuario,
} from '../../services/userStorage'
import UserStatsCards from '../../components/Admin/UserStatsCards'
import UserTable from '../../components/Admin/UserTable'
import UserDetailModal from '../../components/Admin/UserDetailModal'
import './AdminUsuarios.css'

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [searchEmail, setSearchEmail] = useState('')
  const [filterRole, setFilterRole] = useState('todos')
  const [selectedUser, setSelectedUser] = useState(null)
  const [workoutCounts, setWorkoutCounts] = useState({ registrados: 0, completados: 0, pendientes: 0 })
  const [message, setMessage] = useState('')

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    const data = await obtenerUsuarios()
    setUsuarios(data)
  }

  const stats = useMemo(() => obtenerEstadisticasUsuarios(usuarios), [usuarios])

  const filteredUsers = useMemo(() => {
    const emailTerm = searchEmail.trim().toLowerCase()

    return usuarios.filter((user) => {
      const matchesEmail =
        emailTerm === '' || user.correo.toLowerCase().includes(emailTerm)

      const matchesRole =
        filterRole === 'todos' ||
        (filterRole === 'usuario' && user.rol === 'usuario') ||
        (filterRole === 'admin' && user.rol === 'admin')

      return matchesEmail && matchesRole
    })
  }, [usuarios, searchEmail, filterRole])

  const handleView = (user) => {
    const counts = obtenerConteoEntrenamientos(user.id)
    setWorkoutCounts(counts)
    setSelectedUser(user)
  }

  const handleUpdateUser = async (id, updatedData) => {
    const result = await actualizarPerfil(id, updatedData)
    if (!result) {
      setMessage('No se pudo actualizar el usuario.')
      return
    }

    await cargarUsuarios()
    setMessage(`Usuario ${result.nombre} actualizado correctamente.`)
    if (selectedUser?.id === id) {
      setSelectedUser(result)
    }
  }

  const handleDelete = async (user) => {
    if (user.rol === 'admin') {
      setMessage('No se pueden eliminar administradores.')
      return
    }

    const confirmDelete = window.confirm(`¿Eliminar al usuario ${user.nombre}? Esta acción no se puede deshacer.`)
    if (!confirmDelete) return

    await eliminarUsuario(user.id)
    await cargarUsuarios()
    setMessage(`Usuario ${user.nombre} eliminado correctamente.`)
  }

  const handleToggleBlock = async (user) => {
    if (user.rol === 'admin') {
      setMessage('No se puede bloquear al administrador.')
      return
    }

    const action = user.bloqueado ? 'desbloquear' : 'bloquear'
    const confirmBlock = window.confirm(`¿Deseas ${action} al usuario ${user.nombre}?`)
    if (!confirmBlock) return

    await actualizarBloqueoUsuario(user.id, !user.bloqueado)
    await cargarUsuarios()
    setMessage(`Usuario ${user.nombre} ${user.bloqueado ? 'desbloqueado' : 'bloqueado'} correctamente.`)

    if (selectedUser?.id === user.id) {
      const actualizados = await obtenerUsuarios()
      setSelectedUser(actualizados.find((u) => u.id === user.id))
    }
  }

  return (
    <div className="admin-page-wrapper">
      <div className="admin-header glass-panel">
        <div>
          <p className="subtitle">Panel de administración</p>
          <h1>Administración de Usuarios</h1>
        </div>
        <div className="admin-header-actions">
          <input
            type="search"
            placeholder="Buscar por correo"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="admin-search"
          />
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="admin-filter">
            <option value="todos">Todos</option>
            <option value="usuario">Usuarios</option>
            <option value="admin">Administradores</option>
          </select>
        </div>
      </div>

      <section className="admin-summary-section">
        <UserStatsCards stats={stats} />
      </section>

      {message && <div className="admin-notice glass-panel">{message}</div>}

      <section className="admin-table-section">
        <UserTable
          users={filteredUsers}
          onView={handleView}
          onDelete={handleDelete}
          onToggleBlock={handleToggleBlock}
          onUpdateUser={handleUpdateUser}
        />
      </section>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          workoutCounts={workoutCounts}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

export default AdminUsuarios
