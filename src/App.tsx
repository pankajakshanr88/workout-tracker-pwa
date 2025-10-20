import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import RestScreen from './screens/RestScreen';
import ProgressScreen from './screens/ProgressScreen';
import ExerciseCompleteScreen from './screens/ExerciseCompleteScreen';
import ExerciseSelectScreen from './screens/ExerciseSelectScreen';
import LoadingSpinner from './components/common/LoadingSpinner';
import { initDatabase } from './services/database/init';
import { useOnlineStatus } from './hooks/useOnlineStatus';

function App() {
  const isOnline = useOnlineStatus();
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize database on app startup
    initDatabase()
      .then(() => {
        console.log('Database initialized successfully');
        setIsDbReady(true);
      })
      .catch(error => {
        console.error('Failed to initialize database:', error);
        setDbError(error.message);
      });
  }, []);

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-error mb-2">Database Error</h1>
          <p className="text-gray-600">{dbError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Initializing workout tracker...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {!isOnline && (
        <div className="bg-warning text-white p-2 text-center text-sm font-medium">
          ⚠️ You're offline. Changes will sync when reconnected.
        </div>
      )}
      
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/workout" element={<WorkoutScreen />} />
        <Route path="/workout/rest" element={<RestScreen />} />
        <Route path="/exercise-complete" element={<ExerciseCompleteScreen />} />
        <Route path="/exercise-select" element={<ExerciseSelectScreen />} />
        <Route path="/progress" element={<ProgressScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

