import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService, playerService } from '../../services';
import './Team.css';

export const CreateTeam = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [teamData, setTeamData] = useState({
    name: '',
    shortName: '',
    logo: ''
  });
  
  const [players, setPlayers] = useState([
    { name: '', role: 'batsman', battingStyle: 'right_hand', bowlingStyle: 'none' }
  ]);
  
  const [createdTeam, setCreatedTeam] = useState(null);

  const roles = ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'];
  const battingStyles = ['right_hand', 'left_hand'];
  const bowlingStyles = [
    'none', 'right_arm_fast', 'right_arm_medium', 'right_arm_off_spin', 'right_arm_leg_spin',
    'left_arm_fast', 'left_arm_medium', 'left_arm_orthodox', 'left_arm_chinaman'
  ];

  const handleTeamChange = (e) => {
    setTeamData({ ...teamData, [e.target.name]: e.target.value });
  };

  const handlePlayerChange = (index, field, value) => {
    const updatedPlayers = [...players];
    updatedPlayers[index][field] = value;
    setPlayers(updatedPlayers);
  };

  const addPlayer = () => {
    setPlayers([...players, { name: '', role: 'batsman', battingStyle: 'right_hand', bowlingStyle: 'none' }]);
  };

  const removePlayer = (index) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await teamService.createTeam(teamData);
      setCreatedTeam(response.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayers = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validPlayers = players.filter(p => p.name.trim() !== '');
    if (validPlayers.length === 0) {
      navigate(`/teams/${createdTeam._id}`);
      return;
    }

    try {
      const playersWithTeam = validPlayers.map(p => ({
        ...p,
        team: createdTeam._id
      }));

      await playerService.bulkCreatePlayers(playersWithTeam);
      navigate(`/teams/${createdTeam._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add players');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-team-container">
      <div className="page-header">
        <h1>{step === 1 ? 'Create Team' : 'Add Players'}</h1>
      </div>

      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Team Info</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Add Players</div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {step === 1 && (
        <form onSubmit={handleCreateTeam} className="team-form">
          <div className="form-group">
            <label>Team Name *</label>
            <input
              type="text"
              name="name"
              value={teamData.name}
              onChange={handleTeamChange}
              placeholder="e.g., Mumbai Indians"
              required
            />
          </div>

          <div className="form-group">
            <label>Short Name *</label>
            <input
              type="text"
              name="shortName"
              value={teamData.shortName}
              onChange={handleTeamChange}
              placeholder="e.g., MI"
              maxLength="5"
              required
            />
          </div>

          <div className="form-group">
            <label>Logo URL</label>
            <input
              type="url"
              name="logo"
              value={teamData.logo}
              onChange={handleTeamChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/teams')} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Next: Add Players'}
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleAddPlayers} className="players-form">
          <div className="players-list">
            {players.map((player, index) => (
              <div key={index} className="player-form-card">
                <div className="player-form-header">
                  <span>Player {index + 1}</span>
                  {players.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removePlayer(index)}
                      className="remove-btn"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="player-form-grid">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => handlePlayerChange(index, 'name', e.target.value)}
                      placeholder="Player name"
                    />
                  </div>

                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={player.role}
                      onChange={(e) => handlePlayerChange(index, 'role', e.target.value)}
                    >
                      {roles.map(role => (
                        <option key={role} value={role}>{role.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Batting Style</label>
                    <select
                      value={player.battingStyle}
                      onChange={(e) => handlePlayerChange(index, 'battingStyle', e.target.value)}
                    >
                      {battingStyles.map(style => (
                        <option key={style} value={style}>{style.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>

                  {(player.role === 'bowler' || player.role === 'all_rounder') && (
                    <div className="form-group">
                      <label>Bowling Style</label>
                      <select
                        value={player.bowlingStyle}
                        onChange={(e) => handlePlayerChange(index, 'bowlingStyle', e.target.value)}
                      >
                        <option value="">Select style</option>
                        {bowlingStyles.map(style => (
                          <option key={style} value={style}>{style.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addPlayer} className="btn btn-outline add-player-btn">
            + Add Another Player
          </button>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => navigate(`/teams/${createdTeam._id}`)} 
              className="btn btn-outline"
            >
              Skip for Now
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? 'Adding...' : 'Save Players'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
