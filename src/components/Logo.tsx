import React from 'react';
import { Zap, Brain } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <Brain className="h-4 w-4 text-blue-300 absolute -bottom-1 -right-1" />
      </div>
      <div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
          AICryptoSense
        </h1>
        <span className="text-xs text-gray-400">Intelligent Market Analysis</span>
      </div>
    </div>
  );
}