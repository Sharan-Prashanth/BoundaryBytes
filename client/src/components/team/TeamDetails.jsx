import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { teamService, playerService } from '../../services';
import { useAuth } from '../../context';
import './Team.css';

export const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, hasRole } = useAuth();
  
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    role: 'batsman',
    battingStyle: 'right_hand',
    bowlingStyle: 'none'
  });

  const roles = ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'];
  const battingStyles = ['right_hand', 'left_hand'];
  const bowlingStyles = [
    'none', 'right_arm_fast', 'right_arm_medium', 'right_arm_off_spin', 'right_arm_leg_spin',
    'left_arm_fast', 'left_arm_medium', 'left_arm_orthodox', 'left_arm_chinaman'
  ];

  useEffect(() => {
    loadTeamData();
  }, [id]);

  const loadTeamData = async () => {
    try {
      const [teamResponse, playersResponse] = await Promise.all([
        teamService.getTeam(id),
        teamService.getTeamPlayers(id)
      ]);
      setTeam(teamResponse.data);
      setPlayers(playersResponse.data);
    } catch (err) {
      setError('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    try {
      const response = await playerService.createPlayer({
        ...newPlayer,
        team: id
      });
      setPlayers([...players, response.data]);
      setShowAddPlayer(false);
      setNewPlayer({ name: '', role: 'batter', battingStyle: 'right_handed', bowlingStyle: '' });
    } catch (err) {
      setError('Failed to add player');
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!confirm('Are you sure you want to remove this player?')) return;
    
    try {
      await playerService.deletePlayer(playerId);
      setPlayers(players.filter(p => p._id !== playerId));
    } catch (err) {
      setError('Failed to remove player');
    }
  };

  const groupedPlayers = players.reduce((acc, player) => {
    const role = player.role || 'other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(player);
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Loading team...</div>;
  }

  if (!team) {
    return (
      <div className="error-container">
        <p>Team not found</p>
        <button onClick={() => navigate('/teams')} className="btn btn-primary">
          Back to Teams
        </button>
      </div>
    );
  }

  return (
    <div className="team-details-container">
      <div className="team-header">
        <div className="team-logo-large">
          {team.logo ? (
            <img src={team.logo} alt={team.name} />
          ) : (
            <span className="logo-placeholder">{team.shortName}</span>
          )}
        </div>
        <div className="team-header-info">
          <h1>{team.name}</h1>
          <span className="short-name">{team.shortName}</span>
          <p>{players.length} Players</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="team-content">
        <div className="section-header">
          <h2>Squad</h2>
          {isAuthenticated && hasRole(['admin', 'scorer']) && (
            <button 
              onClick={() => setShowAddPlayer(!showAddPlayer)}
              className="btn btn-primary btn-sm"
            >
              {showAddPlayer ? 'Cancel' : '+ Add Player'}
            </button>
          )}
        </div>

        {showAddPlayer && (
          <form onSubmit={handleAddPlayer} className="add-player-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newPlayer.role}
                  onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value })}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Batting</label>
                <select
                  value={newPlayer.battingStyle}
                  onChange={(e) => setNewPlayer({ ...newPlayer, battingStyle: e.target.value })}
                >
                  {battingStyles.map(style => (
                    <option key={style} value={style}>{style.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              {(newPlayer.role === 'bowler' || newPlayer.role === 'all_rounder') && (
                <div className="form-group">
                  <label>Bowling</label>
                  <select
                    value={newPlayer.bowlingStyle}
                    onChange={(e) => setNewPlayer({ ...newPlayer, bowlingStyle: e.target.value })}
                  >
                    <option value="">Select</option>
                    {bowlingStyles.map(style => (
                      <option key={style} value={style}>{style.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-success">Add Player</button>
          </form>
        )}

        {players.length === 0 ? (
          <div className="empty-state small">
            <p>No players in this team yet</p>
          </div>
        ) : (
          <div className="players-by-role">
            {Object.entries(groupedPlayers).map(([role, rolePlayers]) => (
              <div key={role} className="role-section">
                <h3 className="role-title">{role.replace('_', ' ')}s</h3>
                <div className="players-list">
                  {rolePlayers.map(player => (
                    <div key={player._id} className="player-card">
                      <div className="player-avatar">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="player-info">
                        <span className="player-name">{player.name}</span>
                        <span className="player-style">
                          {player.battingStyle.replace('_', ' ')}
                          {player.bowlingStyle && ` • ${player.bowlingStyle.replace(/_/g, ' ')}`}
                        </span>
                      </div>
                      <div className="player-stats-mini">
                        <span title="Matches">M: {player.stats?.matches || 0}</span>
                        <span title="Runs">R: {player.stats?.runs || 0}</span>
                        <span title="Wickets">W: {player.stats?.wickets || 0}</span>
                      </div>
                      {isAuthenticated && hasRole(['admin', 'scorer']) && (
                        <button 
                          onClick={() => handleDeletePlayer(player._id)}
                          className="delete-btn"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="team-actions">
        <Link to="/teams" className="btn btn-outline">← Back to Teams</Link>
      </div>
    </div>
  );
};
