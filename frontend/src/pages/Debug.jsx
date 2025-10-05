import React from 'react';

const Debug = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Debug Page</h1>
        <p className="text-gray-600 mb-4">If you can see this, the React app is working!</p>
        <div className="space-y-2">
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Debug;


