import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamService } from '../../services';
import { useAuth } from '../../context';
import './Team.css';

export const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, hasRole } = useAuth();

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await teamService.getTeams();
      setTeams(response.data);
    } catch (err) {
      setError('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teamId) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    
    try {
      await teamService.deleteTeam(teamId);
      setTeams(teams.filter(t => t._id !== teamId));
    } catch (err) {
      setError('Failed to delete team');
    }
  };

  if (loading) {
    return <div className="loading">Loading teams...</div>;
  }

  return (
    <div className="team-list-container">
      <div className="page-header">
        <h1>Teams</h1>
        {isAuthenticated && hasRole(['admin', 'scorer']) && (
          <Link to="/teams/create" className="btn btn-primary">
            + Create Team
          </Link>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {teams.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🏏</span>
          <h3>No Teams Yet</h3>
          <p>Create your first team to get started</p>
        </div>
      ) : (
        <div className="team-grid">
          {teams.map(team => (
            <div key={team._id} className="team-card">
              <div className="team-logo">
                {team.logo ? (
                  <img src={team.logo} alt={team.name} />
                ) : (
                  <span className="logo-placeholder">{team.shortName}</span>
                )}
              </div>
              <div className="team-info">
                <h3>{team.name}</h3>
                <span className="short-name">{team.shortName}</span>
                <p className="player-count">{team.playerCount || 0} Players</p>
              </div>
              <div className="team-actions">
                <Link to={`/teams/${team._id}`} className="btn btn-sm btn-outline">
                  View
                </Link>
                {isAuthenticated && hasRole(['admin', 'scorer']) && (
                  <button 
                    onClick={() => handleDelete(team._id)}
                    className="btn btn-sm btn-danger-outline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
