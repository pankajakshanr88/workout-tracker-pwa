import { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { SandbaggingAlert as SandbaggingAlertType } from '../../services/alerts/sandbaggingDetector';
import { dismissAlert } from '../../services/database/alerts';

interface SandbaggingAlertProps {
  alert: SandbaggingAlertType & { id: number };
  onDismiss?: () => void;
}

export default function SandbaggingAlert({ alert, onDismiss }: SandbaggingAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDismiss = () => {
    dismissAlert(alert.id);
    onDismiss?.();
  };

  return (
    <Card className="bg-warning-light border-l-4 border-warning">
      {/* Alert Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-xs font-semibold uppercase tracking-wide text-warning-dark">
              Training Intensity
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {alert.exerciseName} - Push Harder!
          </h3>

          <p className="text-gray-700 mb-3">
            {alert.message}
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Flat Rep Workouts:</span>
              <span className="font-semibold ml-1">{alert.flatRepWorkouts}</span>
            </div>
            <div>
              <span className="text-gray-600">Current Weight:</span>
              <span className="font-semibold ml-1">{alert.currentWeight}lbs</span>
            </div>
            <div>
              <span className="text-gray-600">Avg Rep Range:</span>
              <span className="font-semibold ml-1">{alert.averageRepRange.toFixed(1)} reps</span>
            </div>
            <div>
              <span className="text-gray-600">Analyzed:</span>
              <span className="font-semibold ml-1">{alert.workoutsAnalyzed} workouts</span>
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-2"
        >
          {isExpanded ? '−' : '+'}
        </Button>
      </div>

      {/* Expandable Suggestion */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            💡 How to Fix This:
          </h4>

          <div className="p-3 bg-white rounded-lg border mb-4">
            <div className="text-sm text-gray-700">
              <strong>Current Issue:</strong> Your reps aren't dropping across sets, which suggests you're not training to true 1 RIR (1 rep in reserve).
            </div>
          </div>

          <div className="p-3 bg-primary-light rounded-lg border mb-4">
            <div className="text-sm text-primary-dark font-medium mb-2">
              🎯 Recommended Solution:
            </div>
            <div className="text-sm text-gray-700">
              {alert.suggestion}
            </div>
          </div>

          <div className="text-xs text-gray-600 mb-4">
            <strong>Why this matters:</strong> Training to 1 RIR is proven to maximize muscle growth and strength gains.
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              fullWidth
              onClick={() => setIsExpanded(false)}
            >
              Got It - I'll Push Harder
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={handleDismiss}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Compact Actions */}
      {!isExpanded && (
        <div className="flex gap-2 mt-4">
          <Button
            variant="primary"
            onClick={() => setIsExpanded(true)}
            className="text-sm"
          >
            View Solution
          </Button>
          <Button
            variant="secondary"
            onClick={handleDismiss}
            className="text-sm"
          >
            Dismiss
          </Button>
        </div>
      )}
    </Card>
  );
}
