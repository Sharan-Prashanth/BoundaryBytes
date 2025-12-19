import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchService } from '../../services';
import './Home.css';

export const Home = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [liveResponse, recentResponse] = await Promise.all([
        matchService.getLiveMatches(),
        matchService.getMatches({ status: 'completed', limit: 5 })
      ]);
      setLiveMatches(liveResponse.data);
      setRecentMatches(recentResponse.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-bg-animation"></div>
        <div className="hero-content animate-fade-in-up">
          <h1>🏏 BoundaryBytes</h1>
          <p>Professional Cricket Scoring Made Simple</p>
          <div className="hero-actions">
            <Link to="/matches/create" className="btn btn-primary btn-lg btn-glow">
              <span className="btn-icon">⚡</span>
              Start New Match
            </Link>
            <Link to="/matches" className="btn btn-outline btn-lg">
              View All Matches
            </Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-value">{liveMatches.length}</span>
            <span className="stat-label">Live Now</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{recentMatches.length}+</span>
            <span className="stat-label">Recent</span>
          </div>
        </div>
      </section>

      {liveMatches.length > 0 && (
        <section className="live-section">
          <div className="section-header">
            <h2>
              <span className="live-dot"></span>
              Live Matches
            </h2>
          </div>
          <div className="matches-scroll">
            {liveMatches.map((match, index) => (
              <Link 
                to={`/matches/${match._id}`} 
                key={match._id} 
                className="live-match-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="match-teams">
                  <div className="team">
                    <span className="team-name">{match.teamA.team.shortName}</span>
                    {match.innings && match.innings[0]?.battingTeam._id === match.teamA.team._id && (
                      <span className="score">
                        {match.innings[0]?.totalRuns}/{match.innings[0]?.totalWickets}
                        <small>({match.innings[0]?.currentOver}.{match.innings[0]?.currentOverBalls})</small>
                      </span>
                    )}
                    {match.innings && match.innings[1]?.battingTeam._id === match.teamA.team._id && (
                      <span className="score">
                        {match.innings[1]?.totalRuns}/{match.innings[1]?.totalWickets}
                        <small>({match.innings[1]?.currentOver}.{match.innings[1]?.currentOverBalls})</small>
                      </span>
                    )}
                  </div>
                  <span className="vs">vs</span>
                  <div className="team">
                    <span className="team-name">{match.teamB.team.shortName}</span>
                    {match.innings && match.innings[0]?.battingTeam._id === match.teamB.team._id && (
                      <span className="score">
                        {match.innings[0]?.totalRuns}/{match.innings[0]?.totalWickets}
                        <small>({match.innings[0]?.currentOver}.{match.innings[0]?.currentOverBalls})</small>
                      </span>
                    )}
                    {match.innings && match.innings[1]?.battingTeam._id === match.teamB.team._id && (
                      <span className="score">
                        {match.innings[1]?.totalRuns}/{match.innings[1]?.totalWickets}
                        <small>({match.innings[1]?.currentOver}.{match.innings[1]?.currentOverBalls})</small>
                      </span>
                    )}
                  </div>
                </div>
                <div className="match-status">
                  <span className="status-badge live">
                    <span className="live-indicator"></span>
                    LIVE
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="features-section">
        <h2 className="section-title">Features</h2>
        <div className="features-grid">
          <div className="feature-card" style={{ animationDelay: '0s' }}>
            <span className="feature-icon">⚡</span>
            <h3>Real-time Scoring</h3>
            <p>Ball-by-ball live updates with Socket.IO</p>
          </div>
          <div className="feature-card" style={{ animationDelay: '0.1s' }}>
            <span className="feature-icon">📊</span>
            <h3>Complete Statistics</h3>
            <p>Detailed batting, bowling and match stats</p>
          </div>
          <div className="feature-card" style={{ animationDelay: '0.2s' }}>
            <span className="feature-icon">👥</span>
            <h3>Team Management</h3>
            <p>Create and manage teams with full squads</p>
          </div>
          <div className="feature-card" style={{ animationDelay: '0.3s' }}>
            <span className="feature-icon">🔗</span>
            <h3>Share Live Scores</h3>
            <p>Public links for spectators to follow</p>
          </div>
        </div>
      </section>

      {recentMatches.length > 0 && (
        <section className="recent-section">
          <div className="section-header">
            <h2>Recent Matches</h2>
            <Link to="/match-history" className="view-all">View All →</Link>
          </div>
          <div className="recent-matches-list">
            {recentMatches.map((match, index) => (
              <Link 
                to={`/matches/${match._id}`} 
                key={match._id} 
                className="recent-match-card"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="match-info">
                  <span className="teams">
                    {match.teamA.team.shortName} vs {match.teamB.team.shortName}
                  </span>
                  <span className="result">{match.result}</span>
                </div>
                <span className="match-date">
                  {new Date(match.matchDate).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/teams" className="action-card">
            <span className="action-icon">🏆</span>
            <span>Manage Teams</span>
          </Link>
          <Link to="/matches/create" className="action-card">
            <span className="action-icon">➕</span>
            <span>New Match</span>
          </Link>
          <Link to="/matches" className="action-card">
            <span className="action-icon">📋</span>
            <span>All Matches</span>
          </Link>
          <Link to="/tournaments" className="action-card">
            <span className="action-icon">🎯</span>
            <span>Tournaments</span>
          </Link>
          <Link to="/match-history" className="action-card">
            <span className="action-icon">📜</span>
            <span>Match History</span>
          </Link>
          <Link to="/player-stats" className="action-card">
            <span className="action-icon">📈</span>
            <span>Player Stats</span>
          </Link>
        </div>
      </section>
    </div>
  );
};
