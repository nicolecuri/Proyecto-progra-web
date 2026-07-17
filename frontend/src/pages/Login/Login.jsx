import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUserToApi } from '../../services/api';
import { setCurrentUser } from '../../services/userStorage';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const usuario = await loginUserToApi(email, password);
      setCurrentUser(usuario);

      if (usuario.blocked) {
        setError('Su cuenta se encuentra bloqueada.');
        return;
      }

      if (usuario.rol === 'admin') {
        navigate('/admin');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Hero / Branding */}
      <div className="login-hero">
        <div className="hero-logo">
          <div className="hero-logo-icon">🏋️</div>
          <h1>FitTrack</h1>
        </div>

        <p className="hero-tagline">
          Tu entrenamiento.<br />Tu progreso.<br />Tu éxito.
        </p>
        <p className="hero-subtitle">
          Registra rutinas, controla tu avance y alcanza tus metas con una plataforma diseñada para ti.
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">100%</span>
            <span className="hero-stat-label">Personal</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">∞</span>
            <span className="hero-stat-label">Rutinas</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">24/7</span>
            <span className="hero-stat-label">Disponible</span>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="login-form-side">
        <div className="login-container glass-panel">
          <div className="login-header">
            <h2>Bienvenido de vuelta</h2>
            <p>Ingresa a tu cuenta para continuar</p>
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
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary login-btn"
              disabled={loading}
              style={{ opacity: loading ? 0.75 : 1 }}
            >
              {loading ? '⏳ Verificando...' : '🚀 Iniciar Sesión'}
            </button>
          </form>

          <div className="login-footer">
            <p>¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
