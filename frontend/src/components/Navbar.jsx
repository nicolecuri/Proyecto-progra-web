import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
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
      </nav>

      <div className="navbar-actions">
        <div className="user-profile">
          <div className="avatar">U</div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>Salir</button>
      </div>
    </header>
  );
};

export default Navbar;