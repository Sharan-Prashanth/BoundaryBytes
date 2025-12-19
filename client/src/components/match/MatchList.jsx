import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchService } from '../../services';
import './Match.css';

export const MatchList = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMatches();
  }, [filter]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await matchService.getMatches(params);
      setMatches(response.data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'badge-info',
      live: 'badge-success',
      completed: 'badge-secondary',
      abandoned: 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return <div className="loading">Loading matches...</div>;
  }

  return (
    <div className="match-list-container">
      <div className="match-list-header">
        <h1>Matches</h1>
        <div className="filter-buttons">
          {['all', 'live', 'upcoming', 'completed'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="no-matches">
          <p>No matches found</p>
        </div>
      ) : (
        <div className="match-grid">
          {matches.map(match => (
            <Link to={`/matches/${match._id}`} key={match._id} className="match-card">
              <div className="match-status">
                <span className={`badge ${getStatusBadge(match.status)}`}>
                  {match.status === 'live' && <span className="live-dot"></span>}
                  {match.status}
                </span>
              </div>
              
              <div className="match-teams">
                <div className="team">
                  <span className="team-name">{match.teamA.team.name}</span>
                  <span className="team-short">{match.teamA.team.shortName}</span>
                </div>
                <span className="vs">VS</span>
                <div className="team">
                  <span className="team-name">{match.teamB.team.name}</span>
                  <span className="team-short">{match.teamB.team.shortName}</span>
                </div>
              </div>

              <div className="match-info">
                <span className="overs">{match.totalOvers} Overs</span>
                <span className="venue">{match.venue}</span>
              </div>

              {match.result?.summary && (
                <div className="match-result">
                  {match.result.summary}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
