import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Arhivare Web App
        </h1>
        <p className="text-gray-600 text-center">
          React Frontend funcționează!
        </p>
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-blue-800 text-sm">
            Această aplicație React comunică cu API-ul FastAPI pentru căutarea fondurilor arhivistice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
