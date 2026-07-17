import { useEffect, useMemo, useState } from 'react'
import {
  deleteUserFromApi,
  fetchUsers,
  updateUserToApi,
} from '../../services/api'
import { obtenerEstadisticasUsuarios } from '../../services/userStorage'
import UserStatsCards from '../../components/Admin/UserStatsCards'
import UserTable from '../../components/Admin/UserTable'
import UserDetailModal from '../../components/Admin/UserDetailModal'
import './AdminUsuarios.css'

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([])
  const [searchEmail, setSearchEmail] = useState('')
  const [filterRole, setFilterRole] = useState('todos')
  const [selectedUser, setSelectedUser] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    const loadUsers = async () => {
      try {
        const users = await fetchUsers()
        if (mounted) setUsuarios(users)
      } catch (err) {
        if (mounted) setError(err.message || 'No se pudieron cargar los usuarios')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadUsers()
    return () => { mounted = false }
  }, [])

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
    setSelectedUser(user)
  }

  const handleUpdateUser = async (id, updatedData) => {
    try {
      const result = await updateUserToApi(id, updatedData)
      setUsuarios((prev) => prev.map((user) => (user.id === id ? result : user)))
      setMessage(`Usuario ${result.nombre} actualizado correctamente.`)
      if (selectedUser?.id === id) {
        setSelectedUser(result)
      }
    } catch (error) {
      setMessage(error.message || 'No se pudo actualizar el usuario.')
    }
  }

  const handleDelete = async (user) => {
    if (user.rol === 'admin') {
      setMessage('No se pueden eliminar administradores.')
      return
    }

    const confirmDelete = window.confirm(`¿Eliminar al usuario ${user.nombre}? Esta acción no se puede deshacer.`)
    if (!confirmDelete) return

    try {
      await deleteUserFromApi(user.id)
      setUsuarios((prev) => prev.filter((u) => u.id !== user.id))
      setMessage(`Usuario ${user.nombre} eliminado correctamente.`)
      if (selectedUser?.id === user.id) {
        setSelectedUser(null)
      }
    } catch (error) {
      setMessage(error.message || `No se pudo eliminar al usuario ${user.nombre}.`)
    }
  }

  const handleToggleBlock = async (user) => {
    if (user.rol === 'admin') {
      setMessage('No se puede bloquear al administrador.')
      return
    }

    const action = user.bloqueado ? 'desbloquear' : 'bloquear'
    const confirmBlock = window.confirm(`¿Deseas ${action} al usuario ${user.nombre}?`)
    if (!confirmBlock) return

    try {
      const updatedUser = await updateUserToApi(user.id, {
        bloqueado: !user.bloqueado,
        fechaBloqueo: !user.bloqueado ? new Date().toISOString() : null,
      })
      setUsuarios((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)))
      setMessage(`Usuario ${user.nombre} ${user.bloqueado ? 'desbloqueado' : 'bloqueado'} correctamente.`)
      if (selectedUser?.id === user.id) {
        setSelectedUser(updatedUser)
      }
    } catch (error) {
      setMessage(error.message || `No se pudo ${action} al usuario ${user.nombre}.`)
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
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

export default AdminUsuarios
