import React, { useEffect, useState } from 'react';
import { CarIcon } from 'lucide-react';
import api from '../utils/axios';

const ANIMATION_DURATION = 8000; // ms

const AnimatedCars = () => {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    let isMounted = true;
    api.get('/trips', { params: { status: 'en_curso', limit: 100 } })
      .then(res => {
        if (isMounted) setTrips(res.data.trips || []);
      })
      .catch(() => setTrips([]));
    return () => { isMounted = false; };
  }, []);

  if (!trips.length) return null;

  return (
    <div className="relative w-full h-32 overflow-hidden bg-blue-50 rounded-lg border border-blue-100 mb-6">
      {trips.map((trip, idx) => {
        const chofer = trip.driver?.name || 'Chofer';
        const chapa = trip.vehicle?.licensePlate || '---';
        // Animación: cada auto sale con un pequeño delay
        const style = {
          animation: `car-move ${ANIMATION_DURATION}ms linear infinite`,
          animationDelay: `${idx * 600}ms`,
          top: `${20 + (idx % 3) * 32}px`,
        };
        return (
          <div
            key={trip._id}
            className="absolute left-0 flex flex-col items-center"
            style={style}
          >
            <CarIcon className="w-12 h-12 text-blue-500 drop-shadow-lg" />
            <div className="text-xs text-gray-700 font-semibold bg-white bg-opacity-80 rounded px-2 mt-1 shadow">
              {chofer}
            </div>
            <div className="text-xs text-gray-500 bg-white bg-opacity-80 rounded px-2 mt-0.5">
              {chapa}
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
