/**
 * Progress Chart Component
 * 
 * Displays weight progression over time using Chart.js
 */

import { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format, parseISO } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WorkoutDataPoint {
  date: string;
  weight: number;
  reps: number;
}

interface ProgressChartProps {
  data: WorkoutDataPoint[];
  exerciseName: string;
  currentPR?: number;
}

export default function ProgressChart({ data, currentPR }: ProgressChartProps) {
  const chartRef = useRef(null);

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">No workout data yet. Complete your first workout to see progress!</p>
      </div>
    );
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Prepare chart data
  const labels = sortedData.map(d => format(parseISO(d.date), 'MMM d'));
  const weights = sortedData.map(d => d.weight);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Weight (lbs)',
        data: weights,
        borderColor: 'rgb(33, 150, 243)', // primary color
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgb(33, 150, 243)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: 'rgb(33, 150, 243)',
        pointHoverBorderColor: '#fff',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgb(33, 150, 243)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex;
            const weight = sortedData[index].weight;
            const reps = sortedData[index].reps;
            return `${weight}lbs × ${reps} reps`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return value + 'lbs';
          },
          color: '#666'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          color: '#666',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Weight Progression</h3>
        {currentPR && (
          <div className="text-sm">
            <span className="text-gray-600">PR: </span>
            <span className="text-primary font-bold">{currentPR}lbs</span>
          </div>
        )}
      </div>
      
      <div className="h-64">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {sortedData.length}
          </div>
          <div className="text-xs text-gray-600 mt-1">Workouts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-success">
            +{(sortedData[sortedData.length - 1].weight - sortedData[0].weight).toFixed(1)}
          </div>
          <div className="text-xs text-gray-600 mt-1">lbs Gained</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">
            {sortedData[sortedData.length - 1].weight}
          </div>
          <div className="text-xs text-gray-600 mt-1">Current</div>
        </div>
      </div>
    </div>
  );
}

