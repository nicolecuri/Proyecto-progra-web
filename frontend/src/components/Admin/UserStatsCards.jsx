const UserStatsCards = ({ stats }) => {
  return (
    <div className="admin-stats-grid">
      <div className="admin-stat-card glass-panel">
        <h3>Usuarios</h3>
        <p>{stats.usuarios}</p>
      </div>
      <div className="admin-stat-card glass-panel">
        <h3>Administradores</h3>
        <p>{stats.administradores}</p>
      </div>
      <div className="admin-stat-card glass-panel">
        <h3>Total cuentas</h3>
        <p>{stats.totalCuentas}</p>
      </div>
    </div>
  )
}

export default UserStatsCards
