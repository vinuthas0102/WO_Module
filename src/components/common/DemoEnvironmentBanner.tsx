import React from 'react';
import { AlertCircle } from 'lucide-react';

const DemoEnvironmentBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div className="text-center">
          <span className="font-bold">DEMO ENVIRONMENT</span>
          <span className="mx-2">|</span>
          <span className="text-sm">
            For Internal Team Review Only - Not for Production Use
          </span>
        </div>
      </div>
    </div>
  );
};

export default DemoEnvironmentBanner;
