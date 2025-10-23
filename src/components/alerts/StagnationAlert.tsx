import { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { StagnationAlert as StagnationAlertType } from '../../services/alerts/stagnationDetector';
import { dismissAlert } from '../../services/database/alerts';

interface StagnationAlertProps {
  alert: StagnationAlertType & { id: number };
  onDismiss?: () => void;
}

export default function StagnationAlert({ alert, onDismiss }: StagnationAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDismiss = () => {
    dismissAlert(alert.id);
    onDismiss?.();
  };

  const getSeverityColor = () => {
    return alert.severity === 'error' ? 'border-error' : 'border-warning';
  };

  const getSeverityBg = () => {
    return alert.severity === 'error' ? 'bg-error-light' : 'bg-warning-light';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className={`${getSeverityBg()} border-l-4 ${getSeverityColor()}`}>
      {/* Alert Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${alert.severity === 'error' ? 'bg-error' : 'bg-warning'}`} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${alert.severity === 'error' ? 'text-error-dark' : 'text-warning-dark'}`}>
              {alert.severity === 'error' ? 'Critical' : 'Warning'}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {alert.exerciseName} - Stagnation Detected
          </h3>

          <p className="text-gray-700 mb-3">
            {alert.message}
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600">Stagnant Workouts:</span>
              <span className="font-semibold ml-1">{alert.stagnantWorkouts}</span>
            </div>
            <div>
              <span className="text-gray-600">Current Weight:</span>
              <span className="font-semibold ml-1">{alert.currentWeight}lbs</span>
            </div>
            <div>
              <span className="text-gray-600">Last Increase:</span>
              <span className="font-semibold ml-1">{formatDate(alert.lastWeightIncrease)}</span>
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

      {/* Expandable Interventions */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            💡 Recommended Interventions:
          </h4>

          <div className="space-y-2">
            {alert.interventions.map((intervention, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-white rounded-lg border">
                <span className="text-primary font-bold text-sm mt-0.5">
                  {index + 1}.
                </span>
                <span className="text-sm text-gray-700 flex-1">
                  {intervention}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="primary"
              fullWidth
              onClick={() => setIsExpanded(false)}
            >
              Apply Interventions
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
            View Solutions
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
