import { clsx } from 'clsx';
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
    <div className="bg-gray-50 rounded-lg p-5">
      <label className="block font-semibold text-gray-900 mb-3">
        Could you do 1 more rep?
      </label>
      
      <div className="flex gap-2">
        {buttons.map((btn) => (
          <button
            key={btn.value}
            type="button"
            onClick={() => handleSelect(btn.value)}
            className={clsx(
              'flex-1 touch-target px-3 py-3 rounded-lg border-2 transition-all',
              'flex flex-col items-center justify-center',
              {
                'border-success bg-success-light text-success-dark font-semibold': 
                  value === btn.value && btn.value === 'yes_maybe',
                'border-warning bg-warning-light text-warning-dark font-semibold': 
                  value === btn.value && btn.value !== 'yes_maybe',
                'border-gray-300 bg-white text-gray-700': value !== btn.value
              }
            )}
          >
            <span className="text-sm font-medium">{btn.label}</span>
            {value === btn.value && (
              <span className="text-xs mt-1 opacity-90">{btn.sublabel}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

