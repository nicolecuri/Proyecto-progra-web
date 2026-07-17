import { useState, useMemo } from 'react';
import { getCurrentUser, setCurrentUser } from '../../services/userStorage';
import { updateUserToApi } from '../../services/api';
import './Profile.css';

/* ── Helpers ────────────────────────────────────────── */
const calcBMI = (pesoKg, alturaCm) => {
  if (!pesoKg || !alturaCm || alturaCm <= 0) return null;
  const altM = alturaCm / 100;
  return (pesoKg / (altM * altM)).toFixed(1);
};

const getBMICategory = (bmi) => {
  if (!bmi) return null;
  const b = parseFloat(bmi);
  if (b < 18.5) return { label: 'Bajo peso',      color: '#06b6d4', icon: '⬇️' };
  if (b < 25)   return { label: 'Peso normal',     color: '#10b981', icon: '✅' };
  if (b < 30)   return { label: 'Sobrepeso',       color: '#f59e0b', icon: '⚠️' };
  return           { label: 'Obesidad',            color: '#ef4444', icon: '🔴' };
};

const calcIMC_bar = (bmi) => {
  // Mapear BMI 10–40 → 0–100%
  if (!bmi) return 0;
  return Math.min(100, Math.max(0, ((parseFloat(bmi) - 10) / 30) * 100));
};

const Profile = () => {
  const [userId] = useState(() => {
    const user = getCurrentUser();
    return user ? user.id : null;
  });

  const [formData, setFormData] = useState(() => {
    const user = getCurrentUser();
    return {
      nombre:  user?.nombre  || user?.name   || '',
      edad:    user?.edad    || '',
      peso:    user?.peso    || '',
      altura:  user?.altura  || '',
      genero:  user?.genero  || '',
      objetivo: user?.objetivo || '',
    };
  });

  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('datos'); // 'datos' | 'biometrico'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return;

    const dataToSave = {
      nombre:   formData.nombre,
      edad:     formData.edad    ? Number(formData.edad)    : null,
      peso:     formData.peso    ? Number(formData.peso)    : null,
      altura:   formData.altura  ? Number(formData.altura)  : null,
      genero:   formData.genero,
      objetivo: formData.objetivo,
    };

    try {
      const updatedUser = await updateUserToApi(userId, dataToSave);
      setCurrentUser(updatedUser);
      setMessage('¡Perfil actualizado con éxito!');
      setTimeout(() => setMessage(''), 3000);
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (error) {
      setMessage(error.message || 'No se pudo actualizar el perfil.');
    }
  };

  /* ── Métricas calculadas ── */
  const bmi = useMemo(
    () => calcBMI(Number(formData.peso), Number(formData.altura)),
    [formData.peso, formData.altura]
  );
  const bmiCategory = getBMICategory(bmi);
  const bmiBarPct   = calcIMC_bar(bmi);

  const pesoIdealMin = formData.altura
    ? (18.5 * Math.pow(Number(formData.altura) / 100, 2)).toFixed(1)
    : null;
  const pesoIdealMax = formData.altura
    ? (24.9 * Math.pow(Number(formData.altura) / 100, 2)).toFixed(1)
    : null;

  // TMB (Mifflin-St Jeor simplificado)
  const tmb = useMemo(() => {
    const p = Number(formData.peso);
    const a = Number(formData.altura);
    const e = Number(formData.edad);
    if (!p || !a || !e) return null;
    if (formData.genero === 'M') return Math.round(10 * p + 6.25 * a - 5 * e + 5);
    if (formData.genero === 'F') return Math.round(10 * p + 6.25 * a - 5 * e - 161);
    return Math.round(10 * p + 6.25 * a - 5 * e - 78); // promedio si no definido
  }, [formData]);

  const displayName = formData.nombre || 'Atleta';
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="profile-wrapper">
      {/* ── Cabecera con avatar ── */}
      <div className="profile-hero">
        <div className="profile-avatar-ring">
          <div className="profile-avatar-circle">
            <span className="profile-avatar-initials">{initials}</span>
          </div>
        </div>
        <div className="profile-hero-info">
          <h1>{displayName}</h1>
          <p className="profile-hero-sub">
            {formData.objetivo
              ? `Objetivo: ${formData.objetivo}`
              : 'Actualiza tu perfil para personalizar tu experiencia'}
          </p>
          {bmi && (
            <span
              className="profile-bmi-badge"
              style={{ background: `${bmiCategory?.color}22`, borderColor: `${bmiCategory?.color}55`, color: bmiCategory?.color }}
            >
              {bmiCategory?.icon} IMC {bmi} — {bmiCategory?.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        <button
          className={`profile-tab${activeTab === 'datos' ? ' active' : ''}`}
          onClick={() => setActiveTab('datos')}
        >
          👤 Datos Personales
        </button>
        <button
          className={`profile-tab${activeTab === 'biometrico' ? ' active' : ''}`}
          onClick={() => setActiveTab('biometrico')}
        >
          📊 Análisis Biométrico
        </button>
      </div>

      {/* ── TAB: Datos personales ── */}
      {activeTab === 'datos' && (
        <div className="glass-panel profile-form-container">
          {message && <div className="success-message">{message}</div>}

          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-row">
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
            </div>

            <div className="form-row">
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="genero">Género</label>
                <select id="genero" name="genero" value={formData.genero} onChange={handleChange}>
                  <option value="">Prefiero no indicar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="objetivo">Objetivo Principal</label>
                <select id="objetivo" name="objetivo" value={formData.objetivo} onChange={handleChange}>
                  <option value="">Sin objetivo definido</option>
                  <option value="Perder peso">Perder peso</option>
                  <option value="Ganar músculo">Ganar músculo</option>
                  <option value="Mejorar resistencia">Mejorar resistencia</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="Tonificar">Tonificar</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '12px 32px' }}>
                💾 Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB: Análisis biométrico ── */}
      {activeTab === 'biometrico' && (
        <div className="biometric-section">
          {(!formData.peso || !formData.altura) ? (
            <div className="glass-panel biometric-empty">
              <span className="biometric-empty-icon">📏</span>
              <h3>Completa tus datos primero</h3>
              <p>Ingresa tu peso y altura en la pestaña <strong>Datos Personales</strong> para ver tu análisis biométrico.</p>
              <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px', marginTop: '16px' }}
                onClick={() => setActiveTab('datos')}>
                Ir a Datos Personales
              </button>
            </div>
          ) : (
            <>
              {/* IMC */}
              <div className="glass-panel bmi-card">
                <div className="bmi-card-header">
                  <h2>Índice de Masa Corporal (IMC)</h2>
                  <span className="bmi-value" style={{ color: bmiCategory?.color }}>
                    {bmi}
                  </span>
                </div>
                <div className="bmi-bar-track">
                  <div className="bmi-bar-fill" style={{ width: `${bmiBarPct}%`, background: bmiCategory?.color }} />
                  <div className="bmi-bar-pointer" style={{ left: `${bmiBarPct}%` }} />
                </div>
                <div className="bmi-scale-labels">
                  <span style={{ color: '#06b6d4' }}>Bajo peso</span>
                  <span style={{ color: '#10b981' }}>Normal</span>
                  <span style={{ color: '#f59e0b' }}>Sobrepeso</span>
                  <span style={{ color: '#ef4444' }}>Obesidad</span>
                </div>
                <div className="bmi-result-badge" style={{ background: `${bmiCategory?.color}18`, borderColor: `${bmiCategory?.color}44` }}>
                  <span style={{ fontSize: '1.5rem' }}>{bmiCategory?.icon}</span>
                  <div>
                    <strong style={{ color: bmiCategory?.color }}>{bmiCategory?.label}</strong>
                    <p>Tu IMC es <strong>{bmi}</strong>. {
                      bmiCategory?.label === 'Peso normal'
                        ? '¡Estás en un rango saludable, sigue así!'
                        : `Tu rango saludable es entre ${pesoIdealMin} kg y ${pesoIdealMax} kg.`
                    }</p>
                  </div>
                </div>
              </div>

              {/* Métricas extra */}
              <div className="biometric-grid">
                <div className="glass-panel biometric-metric">
                  <div className="biometric-metric-icon">⚖️</div>
                  <div className="biometric-metric-info">
                    <h4>Peso Ideal</h4>
                    <p className="biometric-metric-value">
                      {pesoIdealMin} – {pesoIdealMax} <span>kg</span>
                    </p>
                    <span className="biometric-metric-sub">Rango normal de IMC 18.5–24.9</span>
                  </div>
                </div>

                <div className="glass-panel biometric-metric">
                  <div className="biometric-metric-icon">🔥</div>
                  <div className="biometric-metric-info">
                    <h4>Tasa Metabólica Basal</h4>
                    <p className="biometric-metric-value">
                      {tmb ?? '—'} <span>kcal/día</span>
                    </p>
                    <span className="biometric-metric-sub">Calorías en reposo total</span>
                  </div>
                </div>

                <div className="glass-panel biometric-metric">
                  <div className="biometric-metric-icon">💧</div>
                  <div className="biometric-metric-info">
                    <h4>Agua Recomendada</h4>
                    <p className="biometric-metric-value">
                      {formData.peso ? (Number(formData.peso) * 0.035).toFixed(1) : '—'} <span>L/día</span>
                    </p>
                    <span className="biometric-metric-sub">Basado en tu peso actual</span>
                  </div>
                </div>

                <div className="glass-panel biometric-metric">
                  <div className="biometric-metric-icon">📐</div>
                  <div className="biometric-metric-info">
                    <h4>Altura</h4>
                    <p className="biometric-metric-value">
                      {formData.altura} <span>cm</span>
                    </p>
                    <span className="biometric-metric-sub">
                      {formData.altura ? `${(Number(formData.altura) / 100).toFixed(2)} m` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {tmb && (
                <div className="glass-panel calorie-guide">
                  <h3>🍽️ Guía de Calorías Diarias según Objetivo</h3>
                  <div className="calorie-rows">
                    {[
                      { label: 'Perder peso',       kcal: Math.round(tmb * 1.375 - 500), icon: '⬇️' },
                      { label: 'Mantenimiento',     kcal: Math.round(tmb * 1.375),        icon: '⚖️' },
                      { label: 'Ganar músculo',     kcal: Math.round(tmb * 1.375 + 300),  icon: '⬆️' },
                    ].map(({ label, kcal, icon }) => (
                      <div
                        key={label}
                        className={`calorie-row${formData.objetivo === label ? ' calorie-row-active' : ''}`}
                      >
                        <span className="calorie-row-icon">{icon}</span>
                        <span className="calorie-row-label">{label}</span>
                        <span className="calorie-row-value">{kcal.toLocaleString()} kcal</span>
                      </div>
                    ))}
                  </div>
                  <p className="calorie-disclaimer">
                    * Estimación basada en actividad moderada (1–3 días/semana). Consulta a un profesional de la salud para una dieta personalizada.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
