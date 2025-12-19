import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchService, teamService } from '../../services';
import './Match.css';

export const MatchSetup = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState(null);
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [step, setStep] = useState(1);
  const [selectedTeamAPlayers, setSelectedTeamAPlayers] = useState([]);
  const [selectedTeamBPlayers, setSelectedTeamBPlayers] = useState([]);
  const [toss, setToss] = useState({ winner: '', decision: '' });
  const [openingBatters, setOpeningBatters] = useState(['', '']);
  const [openingBowler, setOpeningBowler] = useState('');

  useEffect(() => {
    loadMatch();
  }, [id]);

  const loadMatch = async () => {
    try {
      const response = await matchService.getMatch(id);
      setMatch(response.data);
      
      const [teamARes, teamBRes] = await Promise.all([
        teamService.getTeamPlayers(response.data.teamA.team._id),
        teamService.getTeamPlayers(response.data.teamB.team._id)
      ]);
      
      setTeamAPlayers(teamARes.data);
      setTeamBPlayers(teamBRes.data);
      
      if (response.data.teamA.players.length > 0) {
        setSelectedTeamAPlayers(response.data.teamA.players.map(p => p._id));
      }
      if (response.data.teamB.players.length > 0) {
        setSelectedTeamBPlayers(response.data.teamB.players.map(p => p._id));
      }
    } catch (error) {
      setError('Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerToggle = (playerId, team) => {
    if (team === 'A') {
      setSelectedTeamAPlayers(prev => 
        prev.includes(playerId) 
          ? prev.filter(id => id !== playerId)
          : [...prev, playerId]
      );
    } else {
      setSelectedTeamBPlayers(prev => 
        prev.includes(playerId) 
          ? prev.filter(id => id !== playerId)
          : [...prev, playerId]
      );
    }
  };

  const handleSavePlayers = async () => {
    try {
      await matchService.updateMatchPlayers(id, {
        teamAPlayers: selectedTeamAPlayers,
        teamBPlayers: selectedTeamBPlayers
      });
      setStep(2);
    } catch (error) {
      setError('Failed to save players');
    }
  };

  const handleSaveToss = async () => {
    try {
      await matchService.setToss(id, toss);
      setStep(3);
    } catch (error) {
      setError('Failed to save toss');
    }
  };

  const handleStartMatch = async () => {
    try {
      await matchService.startMatch(id, {
        openingBatters,
        openingBowler
      });
      navigate(`/matches/${id}/score`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to start match');
    }
  };

  const getBattingTeamPlayers = () => {
    if (!toss.winner || !toss.decision) return [];
    
    if (toss.decision === 'bat') {
      return toss.winner === match.teamA.team._id 
        ? teamAPlayers.filter(p => selectedTeamAPlayers.includes(p._id))
        : teamBPlayers.filter(p => selectedTeamBPlayers.includes(p._id));
    } else {
      return toss.winner === match.teamA.team._id 
        ? teamBPlayers.filter(p => selectedTeamBPlayers.includes(p._id))
        : teamAPlayers.filter(p => selectedTeamAPlayers.includes(p._id));
    }
  };

  const getBowlingTeamPlayers = () => {
    if (!toss.winner || !toss.decision) return [];
    
    if (toss.decision === 'bat') {
      return toss.winner === match.teamA.team._id 
        ? teamBPlayers.filter(p => selectedTeamBPlayers.includes(p._id))
        : teamAPlayers.filter(p => selectedTeamAPlayers.includes(p._id));
    } else {
      return toss.winner === match.teamA.team._id 
        ? teamAPlayers.filter(p => selectedTeamAPlayers.includes(p._id))
        : teamBPlayers.filter(p => selectedTeamBPlayers.includes(p._id));
    }
  };

  if (loading) {
    return <div className="loading">Loading match...</div>;
  }

  if (!match) {
    return <div className="error">Match not found</div>;
  }

  return (
    <div className="match-setup-container">
      <h1>Match Setup</h1>
      <div className="match-header">
        <span>{match.teamA.team.name}</span>
        <span className="vs">VS</span>
        <span>{match.teamB.team.name}</span>
      </div>

      <div className="setup-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Select Players</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Toss</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Opening Players</div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {step === 1 && (
        <div className="player-selection">
          <div className="team-players">
            <h3>{match.teamA.team.name}</h3>
            <div className="player-list">
              {teamAPlayers.map(player => (
                <label key={player._id} className="player-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTeamAPlayers.includes(player._id)}
                    onChange={() => handlePlayerToggle(player._id, 'A')}
                  />
                  <span>{player.name}</span>
                  <span className="role">{player.role.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="team-players">
            <h3>{match.teamB.team.name}</h3>
            <div className="player-list">
              {teamBPlayers.map(player => (
                <label key={player._id} className="player-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTeamBPlayers.includes(player._id)}
                    onChange={() => handlePlayerToggle(player._id, 'B')}
                  />
                  <span>{player.name}</span>
                  <span className="role">{player.role.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleSavePlayers}
            disabled={selectedTeamAPlayers.length < 2 || selectedTeamBPlayers.length < 2}
          >
            Continue to Toss
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="toss-section">
          <h3>Toss</h3>
          
          <div className="form-group">
            <label>Toss Won By</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="tossWinner"
                  value={match.teamA.team._id}
                  checked={toss.winner === match.teamA.team._id}
                  onChange={(e) => setToss(prev => ({ ...prev, winner: e.target.value }))}
                />
                {match.teamA.team.name}
              </label>
              <label>
                <input
                  type="radio"
                  name="tossWinner"
                  value={match.teamB.team._id}
                  checked={toss.winner === match.teamB.team._id}
                  onChange={(e) => setToss(prev => ({ ...prev, winner: e.target.value }))}
                />
                {match.teamB.team.name}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Decision</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="decision"
                  value="bat"
                  checked={toss.decision === 'bat'}
                  onChange={(e) => setToss(prev => ({ ...prev, decision: e.target.value }))}
                />
                Bat First
              </label>
              <label>
                <input
                  type="radio"
                  name="decision"
                  value="bowl"
                  checked={toss.decision === 'bowl'}
                  onChange={(e) => setToss(prev => ({ ...prev, decision: e.target.value }))}
                />
                Bowl First
              </label>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleSaveToss}
            disabled={!toss.winner || !toss.decision}
          >
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="opening-section">
          <h3>Opening Players</h3>
          
          <div className="form-group">
            <label>Opening Striker</label>
            <select
              value={openingBatters[0]}
              onChange={(e) => setOpeningBatters(prev => [e.target.value, prev[1]])}
            >
              <option value="">Select Striker</option>
              {getBattingTeamPlayers().map(player => (
                <option 
                  key={player._id} 
                  value={player._id}
                  disabled={player._id === openingBatters[1]}
                >
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Opening Non-Striker</label>
            <select
              value={openingBatters[1]}
              onChange={(e) => setOpeningBatters(prev => [prev[0], e.target.value])}
            >
              <option value="">Select Non-Striker</option>
              {getBattingTeamPlayers().map(player => (
                <option 
                  key={player._id} 
                  value={player._id}
                  disabled={player._id === openingBatters[0]}
                >
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Opening Bowler</label>
            <select
              value={openingBowler}
              onChange={(e) => setOpeningBowler(e.target.value)}
            >
              <option value="">Select Bowler</option>
              {getBowlingTeamPlayers().map(player => (
                <option key={player._id} value={player._id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          <button 
            className="btn btn-success" 
            onClick={handleStartMatch}
            disabled={!openingBatters[0] || !openingBatters[1] || !openingBowler}
          >
            Start Match 🏏
          </button>
        </div>
      )}
    </div>
  );
};
