import type { WorkoutSet } from '../../types/database';
import Card from '../common/Card';

interface SetListProps {
  completedSets: WorkoutSet[];
  currentSetNumber: number;
  totalSets: number;
  weight: number;
}

export default function SetList({ completedSets, currentSetNumber, totalSets, weight }: SetListProps) {
  const sets = Array.from({ length: totalSets }, (_, i) => i + 1);

  return (
    <Card className="font-mono text-sm">
      {sets.map((setNum) => {
        const completedSet = completedSets.find(s => s.set_number === setNum);
        const isCompleted = !!completedSet;
        const isCurrent = setNum === currentSetNumber;

        return (
          <div
            key={setNum}
            className={`py-2 ${setNum < totalSets ? 'border-b border-gray-200' : ''}`}
          >
            {isCompleted ? (
              <div className="flex items-center">
                <span className="text-success mr-2">✓</span>
                <span className="text-gray-900">
                  Set {setNum}: {completedSet.weight}lbs × {completedSet.reps} reps
                </span>
              </div>
            ) : isCurrent ? (
              <div className="flex items-center text-primary font-semibold">
                <span className="mr-2">→</span>
                <span>Set {setNum}: {weight}lbs × ? reps</span>
              </div>
            ) : (
              <div className="flex items-center text-gray-400">
                <span className="mr-2">&nbsp;&nbsp;</span>
                <span>Set {setNum}: {weight}lbs × ? reps</span>
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

