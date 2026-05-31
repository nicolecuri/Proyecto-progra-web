const UserTable = ({ users, onView, onDelete }) => {
  return (
    <div className="admin-table-container glass-panel">
      <table className="admin-user-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Fecha de registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.length ? (
            users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.nombre}</td>
                <td>{user.correo}</td>
                <td>{user.rol}</td>
                <td>{user.fechaRegistro ? new Date(user.fechaRegistro).toLocaleDateString('es-ES') : '-'}</td>
                <td>
                  <button className="btn-secondary" onClick={() => onView(user)}>
                    Ver
                  </button>
                  <button className="btn-danger" onClick={() => onDelete(user)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="empty-row">
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
