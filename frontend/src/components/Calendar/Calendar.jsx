import './Calendar.css';

const Calendar = ({ workoutData }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Helper para formatear YYYY-MM-DD
  const formatDate = (d) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const getIntensity = (day) => {
    const dateStr = formatDate(day);
    const workout = workoutData.find(w => w.date === dateStr);
    return workout ? workout.intensity : 0;
  };

  // Rellenar espacios en blanco antes del primer día
  const blanks = Array(firstDay === 0 ? 6 : firstDay - 1).fill(null); // Empezando el Lunes
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="calendar-container glass-panel">
      <div className="calendar-header">
        <h3>{monthNames[month]} {year}</h3>
        <div className="intensity-legend">
          <span>Menos</span>
          <div className="legend-box intensity-0"></div>
          <div className="legend-box intensity-1"></div>
          <div className="legend-box intensity-2"></div>
          <div className="legend-box intensity-3"></div>
          <div className="legend-box intensity-4"></div>
          <span>Más</span>
        </div>
      </div>
      
      <div className="calendar-grid">
        <div className="day-name">Lun</div>
        <div className="day-name">Mar</div>
        <div className="day-name">Mié</div>
        <div className="day-name">Jue</div>
        <div className="day-name">Vie</div>
        <div className="day-name">Sáb</div>
        <div className="day-name">Dom</div>

        {blanks.map((_, index) => (
          <div key={`blank-${index}`} className="calendar-day empty"></div>
        ))}

        {days.map(day => {
          const dateStr = formatDate(day);
          const workout = workoutData.find(w => w.date === dateStr);
          const intensity = getIntensity(day);
          return (
            <div 
              key={day} 
              className={`calendar-day intensity-${intensity} ${day === today.getDate() ? 'today' : ''}`}
            >
              <span className="day-number">{day}</span>
              {workout && workout.muscles && (
                <div className="calendar-tooltip">
                  <strong>{workout.muscles}</strong>
                  <span>{workout.time}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
