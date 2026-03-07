import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

const DemoEnvironmentBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2.5 shadow-md border-b border-orange-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center space-x-3 mb-1">
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <div className="text-center">
            <span className="font-bold text-lg">DEMO/PROOF-OF-CONCEPT ENVIRONMENT</span>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Administrator-managed users only • Custom auth with plaintext passwords • Unrestricted database access • NOT production-ready
          </span>
        </div>
      </div>
    </div>
  );
};

export default DemoEnvironmentBanner;
