import { useState, useEffect } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import VolumeCard from './VolumeCard';
import { generateWeeklyVolumeReport } from '../../services/progression/volumeTracker';
import type { WeeklyVolumeReport } from '../../services/progression/volumeTracker';

interface VolumeChartProps {
  onViewDetails?: () => void;
}

export default function VolumeChart({ onViewDetails }: VolumeChartProps) {
  const [report, setReport] = useState<WeeklyVolumeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVolumeReport();
  }, []);

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
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Analyzing weekly volume...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="font-semibold text-gray-900 mb-2">
            No Volume Data Yet
          </h3>
          <p className="text-gray-600 mb-4">
            Complete some workouts to see your weekly volume analysis!
          </p>
          <Button onClick={onViewDetails}>
            View Details
          </Button>
        </div>
      </Card>
    );
  }

  const activeMuscleGroups = report.muscleGroups.filter(group => group.totalSets > 0);
  const totalSets = report.muscleGroups.reduce((sum, group) => sum + group.totalSets, 0);

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            📊 This Week's Volume
          </h2>
          <p className="text-sm text-gray-600">
            {report.weekStart} to {report.weekEnd} • {totalSets} total sets
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={loadVolumeReport}
          className="text-sm"
        >
          🔄
        </Button>
      </div>

      {/* Volume Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {report.muscleGroups.map((analysis) => (
          <VolumeCard
            key={analysis.muscleGroup}
            analysis={analysis}
            onClick={() => {
              // Could navigate to detailed view or show modal
              console.log(`Clicked ${analysis.muscleGroup}:`, analysis);
            }}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="text-sm">
          <span className={`font-medium ${report.overallBalance === 'balanced' ? 'text-success' : 'text-warning'}`}>
            {report.overallBalance === 'balanced' ? '✅ Balanced' : '⚖️ Adjust Balance'}
          </span>
          <p className="text-gray-600">
            {activeMuscleGroups.length}/{report.muscleGroups.length} muscle groups active
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onViewDetails}
          className="text-sm"
        >
          View Details
        </Button>
      </div>
    </Card>
  );
}

