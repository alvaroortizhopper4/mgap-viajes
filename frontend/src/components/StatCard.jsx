import React from "react";
import AnimatedCars from './AnimatedCars';

const colorMap = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  purple: "bg-purple-100 text-purple-800",
  red: "bg-red-100 text-red-800",
};

const StatCard = ({ title, value, icon: Icon, color = "blue", showAnimatedCars }) => {
  return (
    <div className="flex items-center p-4 bg-white rounded-lg shadow border border-gray-100 relative min-h-[3.5rem]">
      {Icon && (
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
      {showAnimatedCars && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-40 md:w-60 max-w-[60%] h-24 flex items-center overflow-visible">
          <AnimatedCars height="4.2rem" compact />
        </div>
      )}
    </div>
  );
};

export default StatCard;
