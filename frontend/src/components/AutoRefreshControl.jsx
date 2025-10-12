import React from 'react';

const AutoRefreshControl = ({ 
  isActive, 
  countdown, 
  lastRefresh, 
  onToggle, 
  onRefreshNow,
  className = "" 
}) => {
  const formatTime = (seconds) => {
    return `${seconds}s`;
  };

  const formatLastRefresh = (date) => {
    if (!date) return 'Nunca';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `Hace ${diff}s`;
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}min`;
    return date.toLocaleTimeString();
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Indicador de estado */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
        <span className="text-sm text-gray-600">
          {isActive ? `Actualizando en ${formatTime(countdown)}` : 'Auto-refresh pausado'}
        </span>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2">
        {/* Botón toggle */}
        <button
          onClick={onToggle}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            isActive 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isActive ? '⏸️ Pausar' : '▶️ Activar'}
        </button>

        {/* Botón refresh manual */}
        <button
          onClick={onRefreshNow}
          className="px-3 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          title="Actualizar ahora"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Última actualización */}
      {lastRefresh && (
        <span className="text-xs text-gray-500">
          Última: {formatLastRefresh(lastRefresh)}
        </span>
      )}
    </div>
  );
};

export default AutoRefreshControl;