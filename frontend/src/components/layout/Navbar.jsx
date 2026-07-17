import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clearCurrentUser, getCurrentUser } from '../../services/userStorage';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard',  icon: '🏠' },
  { to: '/progress',  label: 'Progreso',   icon: '📈' },
  { to: '/planner',   label: 'Planificar', icon: '📋' },
];

const Navbar = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const dropdownRef = useRef(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen,   setIsMobileOpen]   = useState(false);
  const [isDarkTheme,    setIsDarkTheme]    = useState(true);

  const [userData, setUserData] = useState(
    () => getCurrentUser() || { nombre: 'Usuario', correo: 'usuario@correo.com', rol: 'usuario' }
  );

  /* Escuchar cambios de perfil */
  useEffect(() => {
    const handleProfileUpdate = () => {
      const user = getCurrentUser();
      if (user) setUserData(user);
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, []);

  /* Actualizar userData cuando la ruta cambia (ej: después del login) */
  useEffect(() => {
    if (location.pathname !== '/' && location.pathname !== '/register') {
      const currentUser = getCurrentUser();
      if (currentUser) {
        queueMicrotask(() => setUserData(currentUser));
      }
    }
  }, [location.pathname]);

  /* Cerrar dropdown al hacer click fuera */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Cerrar mobile menu en cambio de ruta */
  useEffect(() => {
    queueMicrotask(() => {
      setIsMobileOpen(false);
      setIsDropdownOpen(false);
    });
  }, [location.pathname]);

  /* Tema */
  useEffect(() => {
    document.body.classList.toggle('light-theme', !isDarkTheme);
  }, [isDarkTheme]);

  const isAdmin      = userData.rol === 'admin';
  const displayName  = userData.nombre  || userData.name  || 'Usuario';
  const displayEmail = userData.correo  || userData.email || '';

  const handleLogout = () => {
    clearCurrentUser();
    setUserData({ nombre: 'Usuario', correo: 'usuario@correo.com', rol: 'usuario' });
    navigate('/');
  };

  /* No renderizar en login/registro */
  if (location.pathname === '/' || location.pathname === '/register') return null;

  return (
    <header className="navbar-container glass-panel">
      {/* Brand */}
      <div className="navbar-brand">
        <div className="brand-icon">🏋️</div>
        <h2>FitTrack</h2>
      </div>

      {/* Desktop nav */}
      <nav className="navbar-links">
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={location.pathname === to ? 'active' : ''}
          >
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            to="/admin"
            className={location.pathname === '/admin' ? 'active' : ''}
          >
            Admin
          </Link>
        )}
      </nav>

      {/* Actions */}
      <div className="navbar-actions">
        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={() => setIsDarkTheme(p => !p)}
          title={isDarkTheme ? 'Modo claro' : 'Modo oscuro'}
          aria-label="Cambiar tema"
        >
          {isDarkTheme ? '☀️' : '🌙'}
        </button>

        {/* User avatar + dropdown */}
        <div className="user-profile-container" ref={dropdownRef}>
          <button className="avatar" onClick={() => setIsDropdownOpen(p => !p)} aria-label="Menú de usuario">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff&bold=true`}
              alt={displayName}
            />
          </button>

          {isDropdownOpen && (
            <div className="profile-dropdown glass-panel">
              <div className="dropdown-header">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff&bold=true`}
                  alt={displayName}
                  className="dropdown-avatar"
                />
                <div>
                  <h4>{displayName}</h4>
                  <span>{displayEmail}</span>
                </div>
              </div>
              <div className="dropdown-divider" />

              <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}>
                <span className="dropdown-icon">👤</span> Mi Perfil
              </button>
              <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/progress'); }}>
                <span className="dropdown-icon">📊</span> Mi Progreso
              </button>

              <div className="dropdown-divider" />

              <button className="dropdown-item" onClick={() => setIsDarkTheme(p => !p)}>
                <span className="dropdown-icon">{isDarkTheme ? '☀️' : '🌙'}</span>
                Modo {isDarkTheme ? 'Claro' : 'Oscuro'}
              </button>

              <div className="dropdown-divider" />

              <button className="dropdown-item text-error" onClick={handleLogout}>
                <span className="dropdown-icon">🚪</span> Cerrar Sesión
              </button>
            </div>
          )}
        </div>

        {/* Hamburger button (mobile) */}
        <button
          className={`hamburger${isMobileOpen ? ' open' : ''}`}
          onClick={() => setIsMobileOpen(p => !p)}
          aria-label="Menú móvil"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <nav className="mobile-menu glass-panel">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`mobile-link${location.pathname === to ? ' active' : ''}`}
            >
              <span className="mobile-link-icon">{icon}</span>
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`mobile-link${location.pathname === '/admin' ? ' active' : ''}`}
            >
              <span className="mobile-link-icon">🛡️</span>
              Admin
            </Link>
          )}
          <div className="mobile-divider" />
          <Link to="/profile" className="mobile-link">
            <span className="mobile-link-icon">👤</span>
            Mi Perfil
          </Link>
          <button className="mobile-link text-error" onClick={handleLogout}>
            <span className="mobile-link-icon">🚪</span>
            Cerrar Sesión
          </button>
        </nav>
      )}
    </header>
  );
};

export default Navbar;