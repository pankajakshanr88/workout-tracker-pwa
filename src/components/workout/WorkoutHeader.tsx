import { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import { useWorkoutStore } from '../../stores/workoutStore';

interface WorkoutHeaderProps {
  title: string;
  subtitle: string;
}

export default function WorkoutHeader({ title, subtitle }: WorkoutHeaderProps) {
  const navigate = useNavigate();
  const { discardWorkout } = useWorkoutStore();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const handleGoHome = () => {
    setShowDiscardDialog(true);
  };

  const handleDiscardWorkout = () => {
    discardWorkout();
    navigate('/');
  };

  return (
    <>
      <div className="bg-gradient-primary text-white px-6 py-8 shadow-strong animate-slide-down">
        <div className="flex items-start justify-between mb-3">
          {/* Home button */}
          <Button
            variant="glass"
            size="sm"
            onClick={handleGoHome}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            }
            className="animate-float"
          >
            Home
          </Button>

          {/* Menu button */}
          <Menu as="div" className="relative">
            <Menu.Button as={Button} variant="glass" size="sm" className="animate-float">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
              Menu
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setShowDiscardDialog(true)}
                        className={`${
                          active ? 'bg-gray-100' : ''
                        } flex w-full items-center px-4 py-3 text-sm text-error font-medium`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Discard Workout
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2 animate-scale-in">{title}</h1>
          <p className="text-blue-100 text-xl font-medium animate-fade-in">{subtitle}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse"></div>
            <span className="text-blue-100/90 text-sm font-medium">Active Workout Session</span>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={handleDiscardWorkout}
        title="Discard Workout?"
        message="Are you sure you want to discard this workout? All progress will be lost and cannot be recovered."
        confirmText="Discard"
        cancelText="Keep Working Out"
        confirmVariant="error"
      />
    </>
  );
}

