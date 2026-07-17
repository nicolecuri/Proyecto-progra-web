import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUserToApi } from '../../services/api';
import { setCurrentUser } from '../../services/userStorage';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    if (error) setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    try {
      const nuevoUsuario = await registerUserToApi(
        formData.nombre,
        formData.correo,
        formData.password
      );
      setCurrentUser(nuevoUsuario);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Ya existe una cuenta con este correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      {/* Hero / Branding */}
      <div className="register-hero">
        <div className="register-hero-logo">
          <div className="register-hero-logo-icon">🏋️</div>
          <h1>FitTrack</h1>
        </div>

        <p className="register-hero-tagline">
          Comienza tu<br />transformación<br />hoy mismo.
        </p>
        <p className="register-hero-subtitle">
          Únete y empieza a registrar tus entrenamientos, crear rutinas y ver tu progreso crecer día a día.
        </p>

        <div className="register-features">
          <div className="register-feature">
            <div className="register-feature-icon">📋</div>
            <div className="register-feature-text">
              <strong>Crea rutinas personalizadas</strong>
              Diseña planes adaptados a tus objetivos
            </div>
          </div>
          <div className="register-feature">
            <div className="register-feature-icon">📈</div>
            <div className="register-feature-text">
              <strong>Visualiza tu progreso</strong>
              Estadísticas y calendario de entrenamiento
            </div>
          </div>
          <div className="register-feature">
            <div className="register-feature-icon">⏱️</div>
            <div className="register-feature-text">
              <strong>Seguimiento en tiempo real</strong>
              Timer integrado para cada ejercicio
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="register-form-side">
        <div className="register-container glass-panel">
          <div className="register-header">
            <h2>Crea tu cuenta</h2>
            <p>Únete para empezar a llevar el control de tus metas</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form className="register-form" onSubmit={handleRegister}>
            <div className="input-group">
              <label htmlFor="nombre">Nombre Completo</label>
              <input
                type="text"
                id="nombre"
                placeholder="Juan Pérez"
                value={formData.nombre}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            <div className="input-group">
              <label htmlFor="correo">Correo Electrónico</label>
              <input
                type="email"
                id="correo"
                placeholder="tu@correo.com"
                value={formData.correo}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="btn-primary register-btn"
              disabled={loading}
              style={{ opacity: loading ? 0.75 : 1 }}
            >
              {loading ? '⏳ Creando cuenta...' : '✨ Registrarse'}
            </button>
          </form>

          <div className="register-footer">
            <p>¿Ya tienes una cuenta? <Link to="/">Inicia sesión</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
