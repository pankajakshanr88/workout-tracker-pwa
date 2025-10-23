import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StagnationAlert from '../components/alerts/StagnationAlert';
import SandbaggingAlert from '../components/alerts/SandbaggingAlert';
import WorkoutHeader from '../components/workout/WorkoutHeader';
import { getActiveAlerts } from '../services/database/alerts';
import { analyzeAllExercisesStagnation } from '../services/alerts/stagnationDetector';
import { analyzeAllExercisesSandbagging } from '../services/alerts/sandbaggingDetector';
import type { Alert } from '../types/database';

export default function AlertsScreen() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadAlerts();
  }, [refreshKey]);

  const loadAlerts = () => {
    setIsLoading(true);

    // Get alerts from database
    const dbAlerts = getActiveAlerts();

    // Also run stagnation analysis to catch any new stagnation
    const stagnationAlerts = analyzeAllExercisesStagnation();

    // Also run sandbagging analysis
    const sandbaggingAlerts = analyzeAllExercisesSandbagging();

    // Convert stagnation alerts to database format for display
    const stagnationDbAlerts = stagnationAlerts.map(alert => ({
      id: Date.now() + Math.random(), // Temporary ID for display
      exercise_id: alert.exerciseId,
      alert_type: alert.type,
      severity: alert.severity,
      message: alert.message,
      is_dismissed: false,
      created_at: new Date().toISOString(),
      exercise_name: alert.exerciseName
    }));

    // Convert sandbagging alerts to database format for display
    const sandbaggingDbAlerts = sandbaggingAlerts.map(alert => ({
      id: Date.now() + Math.random(), // Temporary ID for display
      exercise_id: alert.exerciseId,
      alert_type: alert.type,
      severity: alert.severity,
      message: alert.message,
      is_dismissed: false,
      created_at: new Date().toISOString(),
      exercise_name: alert.exerciseName
    }));

    // Combine and deduplicate alerts
    const allAlerts = [...dbAlerts, ...stagnationDbAlerts, ...sandbaggingDbAlerts];
    const uniqueAlerts = allAlerts.filter((alert, index, self) =>
      index === self.findIndex(a => a.exercise_id === alert.exercise_id && a.alert_type === alert.alert_type)
    );

    setAlerts(uniqueAlerts as Alert[]);
    setIsLoading(false);
  };

  const handleDismissAlert = (alertId: number) => {
    // Remove from local state
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const dbStagnationAlerts = alerts.filter(alert => alert.alert_type === 'stagnation');
  const dbSandbaggingAlerts = alerts.filter(alert => alert.alert_type === 'sandbagging');
  const otherAlerts = alerts.filter(alert => !['stagnation', 'sandbagging'].includes(alert.alert_type));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WorkoutHeader
          title="Smart Alerts"
          subtitle="Analyzing your progress..."
        />
        <div className="px-4 py-6">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing workout data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WorkoutHeader
        title="Smart Alerts"
        subtitle={`${alerts.length} active ${alerts.length === 1 ? 'alert' : 'alerts'}`}
      />

      <div className="px-4 py-6 space-y-4">
        {/* Refresh Button */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Alerts are automatically generated based on your workout patterns
          </p>
          <Button
            variant="secondary"
            onClick={handleRefresh}
            className="text-sm"
          >
            🔄 Refresh
          </Button>
        </div>

        {/* No Alerts State */}
        {alerts.length === 0 && (
          <Card className="bg-success-light border-l-4 border-success">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold text-success-dark mb-2">
                All Good!
              </h3>
              <p className="text-gray-700 mb-4">
                No alerts detected. Your training is progressing well!
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/')}
              >
                Continue Training
              </Button>
            </div>
          </Card>
        )}

        {/* Database Stagnation Alerts */}
        {dbStagnationAlerts.map((alert) => (
          <StagnationAlert
            key={`db-stagnation-${alert.id}`}
            alert={{
              type: 'stagnation',
              severity: alert.severity,
              exerciseId: alert.exercise_id,
              exerciseName: alert.exercise_name || 'Unknown Exercise',
              message: alert.message,
              interventions: [], // Will be generated by component
              workoutsAnalyzed: 0,
              stagnantWorkouts: 0,
              currentWeight: 0,
              lastWeightIncrease: null
            } as any}
            onDismiss={() => handleDismissAlert(alert.id)}
          />
        ))}

        {/* Database Sandbagging Alerts */}
        {dbSandbaggingAlerts.map((alert) => (
          <SandbaggingAlert
            key={`db-sandbagging-${alert.id}`}
            alert={{
              type: 'sandbagging',
              severity: alert.severity,
              exerciseId: alert.exercise_id,
              exerciseName: alert.exercise_name || 'Unknown Exercise',
              message: alert.message,
              suggestion: '', // Will be generated by component
              workoutsAnalyzed: 0,
              flatRepWorkouts: 0,
              averageRepRange: 0,
              currentWeight: 0
            } as any}
            onDismiss={() => handleDismissAlert(alert.id)}
          />
        ))}

        {/* Other Alerts */}
        {otherAlerts.map(alert => (
          <Card key={alert.id} className="bg-warning-light border-l-4 border-warning">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-warning-dark">
                    {alert.alert_type}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {alert.exercise_name || 'Exercise Alert'}
                </h3>

                <p className="text-gray-700 mb-3">
                  {alert.message}
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={() => handleDismissAlert(alert.id)}
                className="text-sm"
              >
                ✕
              </Button>
            </div>
          </Card>
        ))}

        {/* Help Text */}
        {alerts.length > 0 && (
          <Card className="bg-info-light border-l-4 border-info">
            <div className="text-xs font-semibold text-info-dark uppercase tracking-wide mb-2">
              💡 How Alerts Work
            </div>
            <div className="text-gray-700 space-y-1">
              <p>• Alerts are generated automatically based on your workout patterns</p>
              <p>• They help identify when you need to make changes to keep progressing</p>
              <p>• Dismissed alerts won't reappear unless the issue persists</p>
            </div>
          </Card>
        )}

        {/* Back to Home */}
        <div className="pt-4">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
