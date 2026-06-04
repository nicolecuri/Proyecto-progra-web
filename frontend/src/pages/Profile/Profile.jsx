import { useState } from 'react';
import { getCurrentUser, actualizarPerfil } from '../../services/userStorage';
import './Profile.css';

const Profile = () => {
  const [userId] = useState(() => {
    const user = getCurrentUser();
    return user ? user.id : null;
  });

  const [formData, setFormData] = useState(() => {
    const user = getCurrentUser();
    return {
      nombre: user?.nombre || user?.name || '',
      edad: user?.edad || '',
      peso: user?.peso || '',
      altura: user?.altura || ''
    };
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userId) return;

    // Convert strings to numbers where appropriate
    const dataToSave = {
      nombre: formData.nombre,
      edad: formData.edad ? Number(formData.edad) : null,
      peso: formData.peso ? Number(formData.peso) : null,
      altura: formData.altura ? Number(formData.altura) : null
    };

    const result = actualizarPerfil(userId, dataToSave);
    if (result) {
      setMessage('¡Perfil actualizado con éxito!');
      // Hide message after 3s
      setTimeout(() => setMessage(''), 3000);
      
      // Dispatch custom event to tell Navbar to update the name
      window.dispatchEvent(new Event('profileUpdated'));
    }
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-header">
        <h1>Mi Perfil</h1>
        <p>Actualiza tus datos biométricos para un mejor seguimiento.</p>
      </div>

      <div className="glass-panel profile-form-container">
        {message && <div className="success-message">{message}</div>}
        
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre o Apodo</label>
            <input 
              type="text" 
              id="nombre" 
              name="nombre" 
              value={formData.nombre} 
              onChange={handleChange} 
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edad">Edad (años)</label>
            <input 
              type="number" 
              id="edad" 
              name="edad" 
              value={formData.edad} 
              onChange={handleChange} 
              placeholder="Ej. 25"
              min="10"
              max="100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="peso">Peso (kg)</label>
            <input 
              type="number" 
              id="peso" 
              name="peso" 
              value={formData.peso} 
              onChange={handleChange} 
              placeholder="Ej. 70.5"
              step="0.1"
              min="30"
              max="300"
            />
          </div>

          <div className="form-group">
            <label htmlFor="altura">Altura (cm)</label>
            <input 
              type="number" 
              id="altura" 
              name="altura" 
              value={formData.altura} 
              onChange={handleChange} 
              placeholder="Ej. 175"
              min="100"
              max="250"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
