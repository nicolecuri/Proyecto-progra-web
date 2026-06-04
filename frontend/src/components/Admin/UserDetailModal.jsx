const UserDetailModal = ({ user, workoutCounts, onClose }) => {
  if (!user) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>Detalle de Usuario</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="modal-body">
          <div className="modal-row">
            <span>ID</span>
            <strong>{user.id}</strong>
          </div>
          <div className="modal-row">
            <span>Nombre</span>
            <strong>{user.nombre}</strong>
          </div>
          <div className="modal-row">
            <span>Correo</span>
            <strong>{user.correo}</strong>
          </div>
          <div className="modal-row">
            <span>Rol</span>
            <strong>{user.rol}</strong>
          </div>
          <div className="modal-row">
            <span>Estado</span>
            <strong>{user.bloqueado ? 'Bloqueado' : 'Activo'}</strong>
          </div>
          {user.bloqueado && (
            <div className="modal-row">
              <span>Fecha de bloqueo</span>
              <strong>{user.fechaBloqueo ? new Date(user.fechaBloqueo).toLocaleString('es-ES') : '-'}</strong>
            </div>
          )}
          <div className="modal-row">
            <span>Fecha de registro</span>
            <strong>{user.fechaRegistro ? new Date(user.fechaRegistro).toLocaleString('es-ES') : '-'}</strong>
          </div>
          <div className="modal-row">
            <span>Entrenamientos registrados</span>
            <strong>{workoutCounts.registrados}</strong>
          </div>
          <div className="modal-row">
            <span>Entrenamientos completados</span>
            <strong>{workoutCounts.completados}</strong>
          </div>
          <div className="modal-row">
            <span>Entrenamientos pendientes</span>
            <strong>{workoutCounts.pendientes}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDetailModal
