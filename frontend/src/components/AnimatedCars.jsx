import React, { useEffect, useState, useRef } from 'react';
import { CarIcon } from 'lucide-react';
import api from '../utils/axios';

const ANIMATION_DURATION = 8000; // ms

const AnimatedCars = ({ height = '2.5rem', compact = false }) => {
  const [trips, setTrips] = useState([]);

  // Polling para refrescar viajes activos cada 1 minuto
  const pollingRef = useRef();
  useEffect(() => {
    let isMounted = true;
    const fetchTrips = () => {
      api.get('/trips', { params: { status: 'en_curso', limit: 100 } })
        .then(res => {
          if (isMounted) setTrips(res.data.trips || []);
        })
        .catch(() => setTrips([]));
    };
    fetchTrips();
    pollingRef.current = setInterval(fetchTrips, 60000); // 1 minuto
    return () => {
      isMounted = false;
      clearInterval(pollingRef.current);
    };
  }, []);

  if (!trips.length) return null;

  // Espaciado horizontal para que todos los autos estén en la misma fila, uno detrás del otro
  const carSpacing = compact ? 170 : 220; // px, ancho estimado de cada auto+info

  return (
    <div className={`relative w-full ${compact ? '' : 'bg-blue-50 rounded-lg border border-blue-100 mb-6'} flex items-center`} style={{ height }}>
      {trips.map((trip, idx) => {
        const chofer = trip.driver?.name || 'Chofer';
        const chapa = trip.vehicle?.licensePlate || '---';
        const style = {
          animation: `car-move ${ANIMATION_DURATION}ms linear infinite`,
          animationDelay: `${idx * 600}ms`,
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          height: compact ? '2.2rem' : '3rem',
          // Cada auto se separa horizontalmente
          marginLeft: `${idx * carSpacing}px`,
        };
        return (
          <div
            key={trip._id}
            className="flex flex-row items-center gap-2"
            style={style}
          >
            <CarIcon className={compact ? 'w-7 h-7 text-blue-500 drop-shadow-lg' : 'w-12 h-12 text-blue-500 drop-shadow-lg'} fill="white" stroke="currentColor" />
            <div className="flex flex-col justify-center">
              <div className={compact ? "text-xs md:text-sm text-gray-700 font-semibold bg-white bg-opacity-80 rounded px-2 shadow max-w-[8rem] md:max-w-[12rem] whitespace-nowrap overflow-visible" : "text-xs md:text-sm text-gray-700 font-semibold bg-white bg-opacity-80 rounded px-2 shadow max-w-[8rem] md:max-w-[12rem] whitespace-nowrap overflow-visible"}>
                {chofer}
              </div>
              <div className={compact ? "text-xs md:text-sm text-gray-500 bg-white bg-opacity-80 rounded px-2 mt-0.5 mb-1 max-w-[8rem] md:max-w-[12rem] whitespace-nowrap overflow-visible" : "text-xs md:text-sm text-gray-500 bg-white bg-opacity-80 rounded px-2 mt-0.5 max-w-[8rem] md:max-w-[12rem] whitespace-nowrap overflow-visible"}>
                {chapa}
              </div>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes car-move {
          0% { left: -60px; }
          100% { left: calc(100% + 60px); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedCars;
