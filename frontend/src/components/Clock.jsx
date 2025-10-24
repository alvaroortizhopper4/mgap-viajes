import React, { useEffect, useState } from 'react';

function formatDateTime(date) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = days[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  return {
    dayName,
    date: `${day}/${month}/${year}`,
    time: `${hour}:${minute}:${second}`
  };
}

const Clock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { dayName, date, time } = formatDateTime(now);

  return (
  <div className="backdrop-blur-md bg-white/60 dark:bg-gray-900/60 rounded-lg shadow-md px-2 py-1 flex items-center gap-2 border border-gray-200 dark:border-gray-700 w-fit min-w-0">
      <span className="animate-pulse text-blue-500 text-2xl">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
      </span>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-[10px] font-semibold text-gray-500 tracking-wide uppercase">{dayName}</span>
        <span className="text-xs font-mono text-gray-800 dark:text-gray-100 tracking-widest">{date}</span>
        <span className="text-lg font-mono text-blue-600 dark:text-blue-400 tracking-widest drop-shadow-sm" style={{letterSpacing: '0.08em'}}>{time}</span>
      </div>
    </div>
  );
};

export default Clock;
