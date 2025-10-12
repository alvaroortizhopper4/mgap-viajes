import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para auto-refrescar datos cada 30 segundos
 * @param {Function} refreshFunction - Función para ejecutar el refresh
 * @param {boolean} enabled - Si el auto-refresh está activo
 * @param {number} interval - Intervalo en milisegundos (por defecto 30 segundos)
 * @returns {Object} - Estado del auto-refresh y controles
 */
export const useAutoRefresh = (refreshFunction, enabled = true, interval = 30000) => {
  const [isActive, setIsActive] = useState(enabled);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [countdown, setCountdown] = useState(interval / 1000);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  // Función para ejecutar el refresh
  const executeRefresh = async () => {
    try {
      if (typeof refreshFunction === 'function') {
        await refreshFunction();
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error en auto-refresh:', error);
    }
  };

  // Función para iniciar el contador regresivo
  const startCountdown = () => {
    setCountdown(interval / 1000);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          return interval / 1000;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Función para iniciar el auto-refresh
  const start = () => {
    if (intervalRef.current) return;

    setIsActive(true);
    executeRefresh(); // Ejecutar inmediatamente
    startCountdown();
    
    intervalRef.current = setInterval(() => {
      executeRefresh();
    }, interval);
  };

  // Función para detener el auto-refresh
  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setIsActive(false);
    setCountdown(0);
  };

  // Función para refrescar manualmente
  const refreshNow = () => {
    executeRefresh();
    // Reiniciar el timer
    if (isActive) {
      stop();
      setTimeout(start, 100);
    }
  };

  // Efecto principal
  useEffect(() => {
    if (enabled && refreshFunction) {
      start();
    } else {
      stop();
    }

    return () => {
      stop();
    };
  }, [enabled, refreshFunction, interval]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return {
    isActive,
    lastRefresh,
    countdown,
    start,
    stop,
    refreshNow,
    toggle: () => isActive ? stop() : start()
  };
};

export default useAutoRefresh;