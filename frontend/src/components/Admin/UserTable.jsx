import { useState } from 'react'

const UserTable = ({ users, onView, onDelete, onToggleBlock, onUpdateUser }) => {
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({ nombre: '', rol: 'usuario' })

  const startEditing = (user) => {
    setEditingId(user.id)
    setEditValues({ nombre: user.nombre, rol: user.rol })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditValues({ nombre: '', rol: 'usuario' })
  }

  const saveEditing = (user) => {
    const payload = { nombre: editValues.nombre }
    if (user.rol !== 'admin') {
      payload.rol = editValues.rol
    }
    onUpdateUser(user.id, payload)
    cancelEditing()
  }

  return (
    <div className="admin-table-container glass-panel">
      <table className="admin-user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Fecha de registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length ? (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  {editingId === user.id ? (
                    <input
                      type="text"
                      value={editValues.nombre}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, nombre: e.target.value }))}
                      className="inline-edit-input"
                    />
                  ) : (
                    user.nombre
                  )}
                </td>
                <td>{user.correo}</td>
                <td>
                  {editingId === user.id ? (
                    <select
                      value={editValues.rol}
                      onChange={(e) => setEditValues((prev) => ({ ...prev, rol: e.target.value }))}
                      disabled={user.id === 0}
                      className="inline-edit-select"
                    >
                      <option value="usuario">Usuario</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    user.rol
                  )}
                </td>
                <td>{user.bloqueado ? 'Bloqueado' : 'Activo'}</td>
                <td>{user.fechaRegistro ? new Date(user.fechaRegistro).toLocaleDateString('es-ES') : '-'}</td>
                <td>
                  {editingId === user.id ? (
                    <>
                      <button className="btn-primary" onClick={() => saveEditing(user)}>
                        Guardar
                      </button>
                      <button className="btn-secondary" onClick={cancelEditing}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-secondary" onClick={() => onView(user)}>
                        Ver
                      </button>
                      <button className="btn-secondary" onClick={() => startEditing(user)}>
                        Editar
                      </button>
                      <button className="btn-danger" onClick={() => onDelete(user)}>
                        Eliminar
                      </button>
                      {user.rol !== 'admin' && (
                        <button
                          className={`btn-secondary${user.bloqueado ? ' unblock' : ' block'}`}
                          onClick={() => onToggleBlock(user)}
                        >
                          {user.bloqueado ? 'Desbloquear' : 'Bloquear'}
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="empty-row">
                No se encontraron usuarios.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default UserTable
