import React, { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { triggerOverdueReturnsCheck } from '../../utils/returnTaskAutomation';

interface ReturnTaskCheckerProps {
  className?: string;
}

const ReturnTaskChecker: React.FC<ReturnTaskCheckerProps> = ({ className = '' }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      await triggerOverdueReturnsCheck();
      setLastChecked(new Date());
    } catch (error) {
      console.error('Failed to check overdue returns:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Return Task Automation</h3>
          <p className="text-xs text-gray-600 mt-1">
            Automatically create tasks for overdue returns
          </p>
        </div>
        <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
      </div>

      <div className="space-y-3">
        <div className="text-xs text-gray-600">
          <div className="flex items-center space-x-2 mb-1">
            <CheckCircle className="w-3 h-3 text-blue-500" />
            <span>Auto-task on return creation</span>
          </div>
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-3 h-3 text-orange-500" />
            <span>High priority if &lt;5 days</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span>Medium/Low based on timeline</span>
          </div>
        </div>

        <button
          onClick={handleCheck}
          disabled={isChecking}
          className="w-full bg-orange-50 hover:bg-orange-100 text-orange-700 py-2 px-3 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isChecking ? (
            <>
              <div className="w-3 h-3 border border-orange-600 border-t-transparent rounded-full animate-spin" />
              <span>Checking...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-3 h-3" />
              <span>Check Now</span>
            </>
          )}
        </button>

        {lastChecked && (
          <p className="text-xs text-gray-500 text-center">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReturnTaskChecker;