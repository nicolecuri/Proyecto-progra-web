import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUsuario, ensureAdminUser } from '../../services/userStorage';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    ensureAdminUser()
    const usuario = loginUsuario(email, password)

    if (!usuario) {
      setError('Correo o contraseña incorrectos.')
      return
    }

    if (usuario.rol === 'admin') {
      navigate('/admin')
      return
    }

    navigate('/dashboard')
  };

  return (
    <div className="login-wrapper">
      <div className="login-container glass-panel">
        <div className="login-header">
          <h1>Bienvenido de vuelta</h1>
          <p>Ingresa a tu cuenta para continuar tu entrenamiento</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              placeholder="tu@correo.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn-primary login-btn">
            Iniciar Sesión
          </button>
        </form>

        <div className="login-footer">
          <p>¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
