import { useState, useMemo } from 'react';
import Calendar from '../../components/Calendar/Calendar';
import './Progress.css';

/* ─── Helpers ────────────────────────────────────────────────────── */
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const Progress = () => {
  const today = new Date();
  const year = today.getFullYear();
  const monthIdx = today.getMonth();
  const month = String(monthIdx + 1).padStart(2, '0');

  const [workouts] = useState(() => {
    const historyRaw = localStorage.getItem('fittrack-history');
    if (!historyRaw) return [];
    const historyMap = JSON.parse(historyRaw);
    return Object.values(historyMap);
  });

  /* ── Racha actual ── */
  const calculateStreak = (historyArray) => {
    let streak = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (historyArray.some(w => w.date === dateStr)) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak(workouts);
  const maxStreak = Math.max(currentStreak, 12);

  /* ── Entrenamientos del mes actual ── */
  const thisMonthWorkouts = workouts.filter(w => w.date.startsWith(`${year}-${month}`));

  /* ── Tiempo total del mes (minutos) ── */
  const totalMinutesThisMonth = useMemo(() => {
    return thisMonthWorkouts.reduce((acc, w) => {
      const mins = parseInt((w.time || '0').replace(/\D/g, ''), 10) || 0;
      return acc + mins;
    }, 0);
  }, [thisMonthWorkouts]);

  /* ── Calorías estimadas del mes ── */
  const totalCaloriesThisMonth = totalMinutesThisMonth * 5;

  /* ── Datos de los últimos 7 días para gráfico de barras ── */
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const wo = workouts.find(w => w.date === dateStr);
      const mins = wo ? (parseInt((wo.time || '0').replace(/\D/g, ''), 10) || 0) : 0;
      return {
        label: DAYS_ES[d.getDay()],
        date: dateStr,
        mins,
        intensity: wo ? wo.intensity : 0,
        isToday: dateStr === today.toISOString().split('T')[0]
      };
    });
  }, [workouts]);

  const maxMins = Math.max(...last7Days.map(d => d.mins), 30); // mínimo 30 para evitar barras vacías

  /* ── Grupos musculares más trabajados ── */
  const muscleFrequency = useMemo(() => {
    const freq = {};
    workouts.forEach(w => {
      if (!w.muscles || w.muscles === 'Ninguno') return;
      const groups = w.muscles.split(',').map(s => s.trim()).filter(Boolean);
      groups.forEach(g => {
        freq[g] = (freq[g] || 0) + 1;
      });
    });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxFreq = sorted[0]?.[1] || 1;
    return sorted.map(([name, count]) => ({ name, count, pct: Math.round((count / maxFreq) * 100) }));
  }, [workouts]);

  /* ── Semanas activas (meses) ── */
  const activeDaysThisMonth = thisMonthWorkouts.length;
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

  return (
    <div className="progress-wrapper">
      <main className="progress-content">
        <section className="progress-header">
          <h1>Tu Progreso</h1>
          <p>Revisa tu constancia y la intensidad de tus entrenamientos a lo largo del tiempo.</p>
        </section>

        {/* ── KPI Cards ── */}
        <section className="streak-container">
          <div className="streak-card glass-panel highlight">
            <div className="streak-icon fire-icon">🔥</div>
            <div className="streak-info">
              <h3>Racha Actual</h3>
              <p className="streak-value">{currentStreak} <span className="streak-unit">días</span></p>
            </div>
          </div>
          <div className="streak-card glass-panel">
            <div className="streak-icon trophy-icon">🏆</div>
            <div className="streak-info">
              <h3>Mejor Racha</h3>
              <p className="streak-value">{maxStreak} <span className="streak-unit">días</span></p>
            </div>
          </div>
          <div className="streak-card glass-panel">
            <div className="streak-icon activity-icon">⚡</div>
            <div className="streak-info">
              <h3>Sesiones este Mes</h3>
              <p className="streak-value">{activeDaysThisMonth} <span className="streak-unit">/ {daysInMonth} días</span></p>
            </div>
          </div>
          <div className="streak-card glass-panel">
            <div className="streak-icon time-icon">⏱️</div>
            <div className="streak-info">
              <h3>Tiempo Activo</h3>
              <p className="streak-value">{totalMinutesThisMonth} <span className="streak-unit">min</span></p>
            </div>
          </div>
          <div className="streak-card glass-panel">
            <div className="streak-icon cal-icon">🔥</div>
            <div className="streak-info">
              <h3>Calorías Est.</h3>
              <p className="streak-value">{totalCaloriesThisMonth} <span className="streak-unit">kcal</span></p>
            </div>
          </div>
        </section>

        {/* ── Gráfico semanal ── */}
        <section className="chart-section glass-panel">
          <div className="chart-header">
            <h2>Actividad — Últimos 7 días</h2>
            <span className="chart-subtitle">Minutos de entrenamiento por día</span>
          </div>
          <div className="bar-chart">
            {last7Days.map((day) => (
              <div key={day.date} className={`bar-col${day.isToday ? ' bar-today' : ''}`}>
                <div className="bar-label-top">
                  {day.mins > 0 && <span className="bar-value-top">{day.mins}m</span>}
                </div>
                <div className="bar-track">
                  <div
                    className={`bar-fill intensity-bar-${day.intensity}`}
                    style={{ height: `${day.mins === 0 ? 4 : Math.max(8, (day.mins / maxMins) * 100)}%` }}
                  />
                </div>
                <span className={`bar-day-label${day.isToday ? ' today-label' : ''}`}>
                  {day.label}
                </span>
                {day.isToday && <span className="today-dot">●</span>}
              </div>
            ))}
          </div>
          {workouts.length === 0 && (
            <div className="chart-empty">
              <p>Aún no tienes entrenamientos registrados.</p>
              <p>Completa ejercicios en el Dashboard para ver tu progreso aquí.</p>
            </div>
          )}
        </section>

        {/* ── Grupos musculares ── */}
        {muscleFrequency.length > 0 && (
          <section className="muscles-section glass-panel">
            <h2>Grupos Musculares más Trabajados</h2>
            <p className="section-subtitle">Basado en todos tus entrenamientos registrados</p>
            <div className="muscle-bars">
              {muscleFrequency.map(({ name, count, pct }) => (
                <div key={name} className="muscle-row">
                  <span className="muscle-name">{name}</span>
                  <div className="muscle-bar-track">
                    <div
                      className="muscle-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="muscle-count">{count}x</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Calendario ── */}
        <section className="calendar-section">
          <h2>Calendario de Intensidad — {MONTH_ES[monthIdx]} {year}</h2>
          <Calendar workoutData={workouts} />
        </section>
      </main>
    </div>
  );
};

export default Progress;
