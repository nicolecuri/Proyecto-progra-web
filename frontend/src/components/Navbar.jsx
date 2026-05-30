import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  
  // Leer datos del usuario simulado
  const userData = JSON.parse(localStorage.getItem('user')) || { 
    name: 'Usuario', 
    email: 'usuario@correo.com' 
  };

  useEffect(() => {
    if (isDarkTheme) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }, [isDarkTheme]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // No renderizar Navbar en Login o Registro
  if (location.pathname === '/' || location.pathname === '/register') {
    return null;
  }

  return (
    <header className="navbar-container glass-panel">
      <div className="navbar-brand">
        <div className="brand-icon"></div>
        <h2>FitTrack</h2>
      </div>

      <nav className="navbar-links">
        <Link 
          to="/dashboard" 
          className={location.pathname === '/dashboard' ? 'active' : ''}
        >
          Dashboard
        </Link>
        <Link 
          to="/progress" 
          className={location.pathname === '/progress' ? 'active' : ''}
        >
          Progreso
        </Link>
        <Link
          to="/planner"
          className={location.pathname === '/planner' ? 'active' : ''}
        >
          Planificar de rutina
        </Link>
      </nav>

      <div className="navbar-actions">
        <div className="user-profile-container">
          <div className="avatar" onClick={toggleDropdown}>
            <img src={`https://ui-avatars.com/api/?name=${userData.name}&background=14b8a6&color=fff`} alt="User" />
          </div>
          
          {isDropdownOpen && (
            <div className="profile-dropdown glass-panel">
              <div className="dropdown-header">
                <img src={`https://ui-avatars.com/api/?name=${userData.name}&background=14b8a6&color=fff`} alt="User" className="dropdown-avatar" />
                <div>
                  <h4>{userData.name}</h4>
                  <span>{userData.email}</span>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              
              <button className="dropdown-item">
                <span className="dropdown-icon">⭐</span> Mi Plan: <strong>Pro</strong>
              </button>
              <button className="dropdown-item">
                <span className="dropdown-icon">⚙️</span> Configuración
              </button>
              <button className="dropdown-item">
                <span className="dropdown-icon">🔗</span> Enlaces Rápidos
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button className="dropdown-item" onClick={toggleTheme}>
                <span className="dropdown-icon">{isDarkTheme ? '☀️' : '🌙'}</span> 
                Modo {isDarkTheme ? 'Claro' : 'Oscuro'}
              </button>
              
              <div className="dropdown-divider"></div>
              
              <button className="dropdown-item text-error" onClick={handleLogout}>
                <span className="dropdown-icon">🚪</span> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;