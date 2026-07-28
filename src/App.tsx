import React, { useState } from 'react';
import BadgeCreator from './components/BadgeCreator';
export function App() {
  return <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gray-100 p-2 sm:p-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-green-800 mb-4 sm:mb-6 text-center">
        Créateur de Badge
      </h1>
      <BadgeCreator />
    </div>;
}