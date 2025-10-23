import Card from '../common/Card';
import { VolumeAnalysis } from '../../services/progression/volumeTracker';

interface VolumeCardProps {
  analysis: VolumeAnalysis;
  onClick?: () => void;
}

export default function VolumeCard({ analysis, onClick }: VolumeCardProps) {
  const getStatusIcon = () => {
    switch (analysis.status) {
      case 'too_low': return '⚠️';
      case 'optimal': return '✅';
      case 'too_high': return '🔥';
      default: return '📊';
    }
  };

  const getStatusColor = () => {
    switch (analysis.status) {
      case 'too_low': return 'text-error border-error';
      case 'optimal': return 'text-success border-success';
      case 'too_high': return 'text-warning border-warning';
      default: return 'text-gray-500 border-gray-300';
    }
  };

  const getProgressColor = () => {
    switch (analysis.status) {
      case 'too_low': return 'bg-error';
      case 'optimal': return 'bg-success';
      case 'too_high': return 'bg-warning';
      default: return 'bg-gray-400';
    }
  };

  const formatPercentage = (percentage: number) => {
    if (percentage < 100) return `${Math.round(percentage)}%`;
    return '100%+';
  };

  return (
    <Card
      className={`border-l-4 ${getStatusColor()} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <h3 className="font-semibold text-gray-900 capitalize">
            {analysis.muscleGroup}
          </h3>
        </div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {formatPercentage(analysis.percentage)}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>{analysis.totalSets} sets</span>
          <span>Target: 10-15</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{
              width: `${Math.min(analysis.percentage, 100)}%`,
              maxWidth: '100%'
            }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="text-sm">
        <span className={`font-medium ${getStatusColor()}`}>
          {analysis.status.replace('_', ' ').toUpperCase()}
        </span>
        <p className="text-gray-600 mt-1">
          {analysis.recommendation}
        </p>
      </div>
    </Card>
  );
}

