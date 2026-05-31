import { useEffect, useMemo, useState } from 'react'
import {
  obtenerUsuarios,
  buscarUsuarioPorId,
  eliminarUsuario,
  obtenerEstadisticasUsuarios,
  obtenerConteoEntrenamientos,
} from '../../services/userStorage'
import UserStatsCards from '../../components/Admin/UserStatsCards'
import UserTable from '../../components/Admin/UserTable'
import UserDetailModal from '../../components/Admin/UserDetailModal'
import './AdminUsuarios.css'

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('todos')
  const [selectedUser, setSelectedUser] = useState(null)
  const [workoutCounts, setWorkoutCounts] = useState({ registrados: 0, completados: 0, pendientes: 0 })
  const [message, setMessage] = useState('')

  useEffect(() => {
    setUsuarios(obtenerUsuarios())
  }, [])

  const stats = useMemo(() => obtenerEstadisticasUsuarios(usuarios), [usuarios])

  const filteredUsers = useMemo(() => {
    return usuarios.filter((user) => {
      const searchTerm = search.trim().toLowerCase()
      const matchesSearch =
        user.nombre.toLowerCase().includes(searchTerm) ||
        user.correo.toLowerCase().includes(searchTerm) ||
        user.rol.toLowerCase().includes(searchTerm)

      const matchesRole =
        filterRole === 'todos' ||
        (filterRole === 'usuario' && user.rol === 'usuario') ||
        (filterRole === 'admin' && user.rol === 'admin')

      return matchesSearch && matchesRole
    })
  }, [usuarios, search, filterRole])

  const handleView = (user) => {
    const counts = obtenerConteoEntrenamientos(user.id)
    setWorkoutCounts(counts)
    setSelectedUser(user)
  }

  const handleDelete = (user) => {
    if (user.rol === 'admin') {
      setMessage('No se pueden eliminar administradores.')
      return
    }

    const confirmDelete = window.confirm(`¿Eliminar al usuario ${user.nombre}? Esta acción no se puede deshacer.`)
    if (!confirmDelete) return

    eliminarUsuario(user.id)
    const currentUsers = obtenerUsuarios()
    setUsuarios(currentUsers)
    setMessage(`Usuario ${user.nombre} eliminado correctamente.`)
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
            placeholder="Buscar por nombre, correo o rol"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        <UserTable users={filteredUsers} onView={handleView} onDelete={handleDelete} />
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
