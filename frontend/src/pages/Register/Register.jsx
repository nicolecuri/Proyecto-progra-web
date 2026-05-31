import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registrarUsuario, ensureAdminUser } from '../../services/userStorage';
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    if (error) setError('');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    ensureAdminUser()
    const nuevoUsuario = registrarUsuario({
      nombre: formData.nombre,
      correo: formData.correo,
      password: formData.password,
    })

    if (!nuevoUsuario) {
      setError('Ya existe una cuenta con este correo.')
      return;
    }

    navigate('/dashboard');
  };

  return (
    <div className="register-wrapper">
      <div className="register-container glass-panel">
        <div className="register-header">
          <h1>Crea tu cuenta</h1>
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
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              placeholder="••••••••" 
              value={formData.password}
              onChange={handleChange}
              required 
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
            />
          </div>

          <button type="submit" className="btn-primary register-btn">
            Registrarse
          </button>
        </form>

        <div className="register-footer">
          <p>¿Ya tienes una cuenta? <Link to="/">Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
