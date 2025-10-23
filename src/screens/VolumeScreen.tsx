import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import VolumeCard from '../components/charts/VolumeCard';
import WorkoutHeader from '../components/workout/WorkoutHeader';
import { generateWeeklyVolumeReport } from '../services/progression/volumeTracker';
import type { WeeklyVolumeReport } from '../services/progression/volumeTracker';

export default function VolumeScreen() {
  const navigate = useNavigate();
  const [report, setReport] = useState<WeeklyVolumeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadVolumeReport();
  }, [selectedPeriod]);

  const loadVolumeReport = () => {
    setIsLoading(true);
    try {
      const volumeReport = generateWeeklyVolumeReport();
      setReport(volumeReport);
    } catch (error) {
      console.error('Error loading volume report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WorkoutHeader
          title="Volume Analysis"
          subtitle="Analyzing your training volume..."
        />
        <div className="px-4 py-6">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Calculating volume metrics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <WorkoutHeader
          title="Volume Analysis"
          subtitle="Track your weekly training volume"
        />
        <div className="px-4 py-6">
          <Card className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Volume Data Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Complete some workouts to see detailed volume analysis and muscle group balance.
            </p>
            <Button onClick={() => navigate('/')}>
              Start Your First Workout
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const activeMuscleGroups = report.muscleGroups.filter(group => group.totalSets > 0);
  const totalSets = report.muscleGroups.reduce((sum, group) => sum + group.totalSets, 0);
  const optimalGroups = report.muscleGroups.filter(group => group.status === 'optimal').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WorkoutHeader
        title="Volume Analysis"
        subtitle={`${report.weekStart} to ${report.weekEnd} • ${totalSets} total sets`}
      />

      <div className="px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center p-4">
            <div className="text-2xl mb-2">
              {report.overallBalance === 'balanced' ? '⚖️' : '📊'}
            </div>
            <div className={`font-semibold ${report.overallBalance === 'balanced' ? 'text-success' : 'text-warning'}`}>
              {report.overallBalance === 'balanced' ? 'Balanced' : 'Unbalanced'}
            </div>
            <div className="text-sm text-gray-600">
              {optimalGroups}/{report.muscleGroups.length} optimal
            </div>
          </Card>

          <Card className="text-center p-4">
            <div className="text-2xl mb-2">🏋️</div>
            <div className="font-semibold text-primary">
              {totalSets}
            </div>
            <div className="text-sm text-gray-600">
              Total Sets
            </div>
          </Card>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'week' ? 'primary' : 'outline'}
            onClick={() => setSelectedPeriod('week')}
            className="flex-1"
          >
            This Week
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'primary' : 'outline'}
            onClick={() => setSelectedPeriod('month')}
            className="flex-1"
          >
            Last 4 Weeks
          </Button>
        </div>

        {/* Muscle Group Analysis */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Muscle Group Breakdown
          </h2>

          {activeMuscleGroups.length === 0 ? (
            <Card className="text-center py-8">
              <div className="text-4xl mb-4">💪</div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Start Training!
              </h3>
              <p className="text-gray-600 mb-4">
                Complete workouts to see your muscle group volume analysis.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {report.muscleGroups.map((analysis) => (
                <VolumeCard
                  key={analysis.muscleGroup}
                  analysis={analysis}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              💡 Recommendations
            </h2>
            <Card className="bg-info-light border-l-4 border-info">
              <div className="space-y-3">
                {report.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-info font-bold text-sm mt-0.5">
                      {index + 1}.
                    </span>
                    <span className="text-gray-700 flex-1">
                      {recommendation}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Volume Guidelines */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📚 Volume Guidelines
          </h2>
          <Card className="bg-blue-50 border-l-4 border-blue-500">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-success font-bold">✅ Optimal:</span>
                <span className="text-gray-700">10-15 sets per muscle group per week</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-warning font-bold">⚠️ Too Low:</span>
                <span className="text-gray-700">Less than 10 sets - may not provide enough stimulus</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-error font-bold">🔥 Too High:</span>
                <span className="text-gray-700">More than 15 sets - consider deload or recovery</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation */}
        <div className="pt-4 space-y-3">
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/')}
          >
            Start New Workout
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/progress')}
          >
            View Progress Charts
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate('/alerts')}
          >
            Check Smart Alerts
          </Button>
        </div>
      </div>
    </div>
  );
}

