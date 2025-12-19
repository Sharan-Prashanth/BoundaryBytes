import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context';
import {
  Home,
  Login,
  Register,
  ProtectedRoute,
  Layout,
  MatchList,
  CreateMatch,
  MatchSetup,
  MatchDetails,
  MatchHistory,
  ScoringPanel,
  TeamList,
  CreateTeam,
  TeamDetails,
  Tournament,
  PlayerStats
} from './components';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            
            {/* Match Routes */}
            <Route path="matches" element={<MatchList />} />
            <Route path="matches/:id" element={<MatchDetails />} />
            <Route path="match-history" element={<MatchHistory />} />
            
            {/* Public Match View (for sharing) */}
            <Route path="live/:publicLink" element={<MatchDetails isPublic />} />
            
            {/* Protected Match Routes */}
            <Route
              path="matches/create"
              element={
                <ProtectedRoute roles={['admin', 'scorer']}>
                  <CreateMatch />
                </ProtectedRoute>
              }
            />
            <Route
              path="matches/:id/setup"
              element={
                <ProtectedRoute roles={['admin', 'scorer']}>
                  <MatchSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="matches/:id/score"
              element={
                <ProtectedRoute roles={['admin', 'scorer']}>
                  <ScoringPanel />
                </ProtectedRoute>
              }
            />
            
            {/* Team Routes */}
            <Route path="teams" element={<TeamList />} />
            <Route path="teams/:id" element={<TeamDetails />} />
            <Route
              path="teams/create"
              element={
                <ProtectedRoute roles={['admin', 'scorer']}>
                  <CreateTeam />
                </ProtectedRoute>
              }
            />

            {/* Tournament Routes */}
            <Route path="tournaments" element={<Tournament />} />
            <Route
              path="tournaments/create"
              element={
                <ProtectedRoute roles={['admin']}>
                  <Tournament />
                </ProtectedRoute>
              }
            />

            {/* Player Stats Route */}
            <Route path="player-stats" element={<PlayerStats />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
