import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Clock from './Clock';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Clock visible para todos los usuarios */}
        <div className="w-full flex justify-end items-center px-4 pt-4 pb-2 bg-white shadow-sm z-10">
          <Clock />
        </div>
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8 pt-10 lg:pt-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;