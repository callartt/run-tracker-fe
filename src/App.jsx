import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { WorkoutProvider } from './context/WorkoutContext'
import { UserProvider } from './context/UserContext'
import { GoalProvider } from './context/GoalsContext';
import { AuthProvider } from './context/AuthContext';
import SimulationButton from './components/debug/SimulationButton';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home'
import ActiveRun from './pages/ActiveRun'
import History from './pages/History'
import WorkoutDetailPage from './pages/WorkoutDetail.jsx'
import Settings from './pages/Settings'
import Challenge from './pages/Challenge'
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
// Import the missing components (you'll need to ensure these exist)
import Goals from './pages/Goals'
import Statistics from './pages/Statistics'
import Leaderboard from './pages/Leaderboard'
import Friends from './pages/Friends'

import Header from './components/common/Header'
import Footer from './components/common/Footer'

function App() {
  const [onlineStatus, setOnlineStatus] = useState(navigator.onLine)

  const [showDebug, setShowDebug] = useState(import.meta.env.DEV)

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <AuthProvider>
      <UserProvider>
        <WorkoutProvider>
          <GoalProvider>
            <div className="flex flex-col min-h-screen bg-background dark:bg-background-dark">
              <Header />

              <main className="flex-grow container-mobile py-4">
                <Routes>
                  <Route path="/login" element={<SignIn />} />
                  <Route path="/sign-up" element={<SignUp />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/run" element={<ActiveRun />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/workout/:id" element={<WorkoutDetailPage />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/stats" element={<Statistics />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/friends" element={<Friends />} />
                    <Route path="/challenge/:id" element={<Challenge />} />
                  </Route>
                </Routes>
              </main>

              <Footer />

              {/* Add the simulation button */}
              {showDebug && <SimulationButton />}

              {/* Optional: Display an offline notification */}
              {!onlineStatus && (
                <div className="fixed bottom-20 left-0 right-0 bg-red-500 text-white text-center py-1 text-sm">
                  You are offline. Some features may be limited.
                </div>
              )}
            </div>
          </GoalProvider>
        </WorkoutProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App