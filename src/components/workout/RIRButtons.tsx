import { clsx } from 'clsx';
import Card from '../common/Card';
import Button from '../common/Button';
import type { RIRResponse } from '../../types/database';
import { hapticFeedback } from '../../utils/haptics';

interface RIRButtonsProps {
  value: RIRResponse | null;
  onChange: (value: RIRResponse) => void;
}

export default function RIRButtons({ value, onChange }: RIRButtonsProps) {
  const handleSelect = (rir: RIRResponse) => {
    hapticFeedback('light');
    onChange(rir);
  };

  const buttons: { value: RIRResponse; label: string; sublabel: string }[] = [
    { value: 'yes_maybe', label: '✓ Yes, maybe', sublabel: 'Perfect!' },
    { value: 'yes_easily', label: 'Yes, easily', sublabel: 'Too easy' },
    { value: 'no_way', label: 'No way', sublabel: 'Failure' }
  ];

  return (
    <Card variant="modern" shadow="medium" animate className="animate-scale-in">
      <div className="text-center mb-4">
        <div className="text-lg font-bold text-gray-900 mb-2">1-Rep In Reserve Check</div>
        <div className="text-sm text-gray-600 font-medium">Could you do 1 more rep?</div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {buttons.map((btn) => (
          <Button
            key={btn.value}
            variant={value === btn.value ? 'primary' : 'outline'}
            size="lg"
            fullWidth
            onClick={() => handleSelect(btn.value)}
            className={clsx(
              'text-left justify-start p-4 h-auto animate-fade-in',
              {
                'animate-bounce-soft': value === btn.value,
              }
            )}
          >
            <div className="flex items-center gap-3">
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                {
                  'bg-white text-primary': value === btn.value,
                  'bg-gray-100 text-gray-400': value !== btn.value,
                }
              )}>
                {btn.value === 'yes_maybe' ? '✓' : btn.value === 'yes_easily' ? '⚠️' : '❌'}
              </div>
              <div className="flex-1">
                <div className={`font-bold text-base ${value === btn.value ? 'text-white' : 'text-gray-900'}`}>
                  {btn.label}
                </div>
                <div className={`text-sm font-medium ${
                  value === btn.value ? 'text-blue-100' : 'text-gray-600'
                }`}>
                  {btn.sublabel}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
}

