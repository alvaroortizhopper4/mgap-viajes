import React from 'react';

const Dashboard = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: 'black', fontSize: '24px' }}>Dashboard Test</h1>
      <p style={{ color: 'black' }}>Si ves esto, el Dashboard funciona básicamente</p>
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', marginTop: '10px' }}>
        <p style={{ color: 'black' }}>Información del sistema:</p>
        <ul style={{ color: 'black' }}>
          <li>Frontend corriendo ✓</li>
          <li>Componente Dashboard renderizando ✓</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;