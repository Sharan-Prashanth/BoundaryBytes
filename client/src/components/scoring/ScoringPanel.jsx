import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchService, scoringService, teamService } from '../../services';
import { useSocket, SOCKET_EVENTS } from '../../hooks';
import './Scoring.css';

// Helper to calculate partnership
const calculatePartnership = (innings) => {
  if (!innings?.currentStriker || !innings?.currentNonStriker) return null;
  
  const striker = innings.batters.find(b => b.player._id === innings.currentStriker._id);
  const nonStriker = innings.batters.find(b => b.player._id === innings.currentNonStriker._id);
  
  if (!striker || !nonStriker) return null;
  
  // Simple partnership calculation from current batters
  const partnershipRuns = (striker.runs || 0) + (nonStriker.runs || 0);
  const partnershipBalls = (striker.ballsFaced || 0) + (nonStriker.ballsFaced || 0);
  
  return { runs: partnershipRuns, balls: partnershipBalls };
};

// Generate ball-by-ball commentary
const generateCommentary = (ball, striker, bowler) => {
  const strikerName = striker?.name || 'Batter';
  const bowlerName = bowler?.name || 'Bowler';
  
  if (ball.isWicket) {
    return `OUT! ${strikerName} is dismissed! ${bowlerName} strikes!`;
  }
  
  if (ball.extras?.type === 'wide') {
    return `Wide ball from ${bowlerName}${ball.extras.runs > 0 ? `, ${ball.extras.runs} extra runs` : ''}`;
  }
  
  if (ball.extras?.type === 'no_ball') {
    return `No ball! ${bowlerName} oversteps. ${ball.runs?.batter || 0} runs scored`;
  }
  
  if (ball.isSix) {
    return `SIX! ${strikerName} launches it into the crowd!`;
  }
  
  if (ball.isFour) {
    return `FOUR! ${strikerName} finds the boundary!`;
  }
  
  if (ball.runs?.batter === 0) {
    return `Dot ball. Good delivery from ${bowlerName}`;
  }
  
  return `${ball.runs?.batter || 0} run${(ball.runs?.batter || 0) !== 1 ? 's' : ''} taken by ${strikerName}`;
};

export const ScoringPanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState(null);
  const [innings, setInnings] = useState(null);
  const [currentOver, setCurrentOver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBatterModal, setShowBatterModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showSecondInningsModal, setShowSecondInningsModal] = useState(false);
  
  const [pendingBallData, setPendingBallData] = useState(null);
  const [availableBatters, setAvailableBatters] = useState([]);
  const [availableBowlers, setAvailableBowlers] = useState([]);

  const { isConnected } = useSocket(id);

  useEffect(() => {
    loadMatchData();
  }, [id]);

  const loadMatchData = async () => {
    try {
      setLoading(true);
      const matchResponse = await matchService.getMatch(id);
      setMatch(matchResponse.data);
      
      if (matchResponse.data.innings && matchResponse.data.innings.length > 0) {
        const activeInnings = matchResponse.data.innings.find(
          i => i.status === 'in_progress'
        );
        
        if (activeInnings) {
          setInnings(activeInnings);
          
          const overResponse = await scoringService.getCurrentOver(id);
          setCurrentOver(overResponse.data);
          
          await loadAvailablePlayers(matchResponse.data, activeInnings);
        } else if (matchResponse.data.currentInnings === 2) {
          setShowSecondInningsModal(true);
          await loadAvailablePlayers(matchResponse.data, null);
        }
      }
    } catch (err) {
      setError('Failed to load match data');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePlayers = async (matchData, currentInnings) => {
    try {
      const [teamAPlayers, teamBPlayers] = await Promise.all([
        teamService.getTeamPlayers(matchData.teamA.team._id),
        teamService.getTeamPlayers(matchData.teamB.team._id)
      ]);

      if (currentInnings) {
        const battingTeamId = currentInnings.battingTeam._id;
        const bowlingTeamId = currentInnings.bowlingTeam._id;

        const battingPlayers = battingTeamId === matchData.teamA.team._id 
          ? teamAPlayers.data.filter(p => matchData.teamA.players.some(mp => mp._id === p._id))
          : teamBPlayers.data.filter(p => matchData.teamB.players.some(mp => mp._id === p._id));

        const bowlingPlayers = bowlingTeamId === matchData.teamA.team._id 
          ? teamAPlayers.data.filter(p => matchData.teamA.players.some(mp => mp._id === p._id))
          : teamBPlayers.data.filter(p => matchData.teamB.players.some(mp => mp._id === p._id));

        const usedBatters = currentInnings.batters.map(b => b.player._id);
        setAvailableBatters(battingPlayers.filter(p => !usedBatters.includes(p._id)));
        setAvailableBowlers(bowlingPlayers);
      }
    } catch (err) {
      console.error('Failed to load players:', err);
    }
  };

  const handleRecordBall = async (ballData) => {
    try {
      setError('');
      const response = await scoringService.recordBall(id, ballData);
      setInnings(response.data.innings);
      setCurrentOver(response.data.currentOver);
      
      await loadAvailablePlayers(match, response.data.innings);

      if (response.data.innings.status === 'completed') {
        if (match.currentInnings === 1) {
          setShowSecondInningsModal(true);
        } else {
          await loadMatchData();
          navigate(`/matches/${id}`);
        }
      }

      if (!response.data.innings.currentStriker || !response.data.innings.currentNonStriker) {
        if (response.data.innings.totalWickets < 10) {
          setShowBatterModal(true);
        }
      }

      if (response.data.currentOver?.isComplete && response.data.innings.status === 'in_progress') {
        setShowBowlerModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record ball');
    }
  };

  const handleRun = (runs) => {
    handleRecordBall({ runs });
  };

  const handleExtra = (type, runs = 0) => {
    if (type === 'wide') {
      handleRecordBall({ extras: { type: 'wide', runs } });
    } else if (type === 'no_ball') {
      handleRecordBall({ runs: 0, extras: { type: 'no_ball', runs } });
    } else if (type === 'bye') {
      handleRecordBall({ runs: 0, extras: { type: 'bye', runs } });
    } else if (type === 'leg_bye') {
      handleRecordBall({ runs: 0, extras: { type: 'leg_bye', runs } });
    }
  };

  const handleWicket = (wicketData) => {
    const ballData = {
      ...pendingBallData,
      isWicket: true,
      wicket: {
        dismissalType: wicketData.dismissalType,
        batter: wicketData.batter || innings.currentStriker._id,
        bowler: innings.currentBowler._id,
        fielder: wicketData.fielder || null
      }
    };
    
    handleRecordBall(ballData);
    setShowWicketModal(false);
    setPendingBallData(null);
  };

  const handleUndo = async () => {
    try {
      setError('');
      const response = await scoringService.undoLastBall(id);
      setInnings(response.data.innings);
      await loadMatchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to undo');
    }
  };

  const handleSwapBatters = async () => {
    try {
      const response = await scoringService.swapBatters(id);
      setInnings(response.data.innings);
    } catch (err) {
      setError('Failed to swap batters');
    }
  };

  const handleSetBatter = async (batterId) => {
    try {
      const isStriker = !innings.currentStriker;
      const response = await scoringService.setNewBatter(id, { batterId, isStriker });
      setInnings(response.data.innings);
      setShowBatterModal(false);
      await loadAvailablePlayers(match, response.data.innings);
    } catch (err) {
      setError('Failed to set batter');
    }
  };

  const handleSetBowler = async (bowlerId) => {
    try {
      const response = await scoringService.setNewBowler(id, { bowlerId });
      setInnings(response.data.innings);
      setShowBowlerModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set bowler');
    }
  };

  const handleStartSecondInnings = async (data) => {
    try {
      const response = await scoringService.startSecondInnings(id, data);
      setInnings(response.data.innings);
      setShowSecondInningsModal(false);
      await loadMatchData();
    } catch (err) {
      setError('Failed to start second innings');
    }
  };

  if (loading) {
    return <div className="loading">Loading scoring panel...</div>;
  }

  if (!match || !innings) {
    return (
      <div className="error-container">
        <p>Match or innings not found</p>
        <button onClick={() => navigate(`/matches/${id}`)} className="btn btn-primary">
          Back to Match
        </button>
      </div>
    );
  }

  const partnership = calculatePartnership(innings);
  const totalOvers = innings.currentOver + (innings.currentOverBalls / 6);
  const runRate = totalOvers > 0 ? (innings.totalRuns / totalOvers).toFixed(2) : '0.00';

  return (
    <div className="scoring-container">
      <div className="scoring-header">
        <div className="match-info-bar">
          <span className="batting-team">{innings.battingTeam.shortName}</span>
          <span className="score-display animate-score">
            {innings.totalRuns}/{innings.totalWickets}
          </span>
          <span className="overs-display">
            ({innings.currentOver}.{innings.currentOverBalls})
          </span>
          {innings.target && (
            <span className="target-info">
              Target: {innings.target} | Need: {innings.target - innings.totalRuns} runs
            </span>
          )}
        </div>
        <div className="run-rate-bar">
          <span className="rr-item">
            <span className="rr-label">CRR</span>
            <span className="rr-value">{runRate}</span>
          </span>
          {innings.requiredRunRate && (
            <span className="rr-item required">
              <span className="rr-label">RRR</span>
              <span className="rr-value">{innings.requiredRunRate}</span>
            </span>
          )}
          {partnership && (
            <span className="rr-item partnership">
              <span className="rr-label">Partnership</span>
              <span className="rr-value">{partnership.runs}({partnership.balls})</span>
            </span>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}


      <div className="current-players">
        <div className="batters-info">
          <div className="player-card striker">
            <span className="label">Striker</span>
            <span className="name">{innings.currentStriker?.name || 'Select batter'}</span>
            {innings.currentStriker && (
              <span className="stats">
                {innings.batters.find(b => b.player._id === innings.currentStriker._id)?.runs || 0}
                ({innings.batters.find(b => b.player._id === innings.currentStriker._id)?.ballsFaced || 0})
              </span>
            )}
          </div>
          <button onClick={handleSwapBatters} className="swap-btn">⇄</button>
          <div className="player-card non-striker">
            <span className="label">Non-Striker</span>
            <span className="name">{innings.currentNonStriker?.name || 'Select batter'}</span>
            {innings.currentNonStriker && (
              <span className="stats">
                {innings.batters.find(b => b.player._id === innings.currentNonStriker._id)?.runs || 0}
                ({innings.batters.find(b => b.player._id === innings.currentNonStriker._id)?.ballsFaced || 0})
              </span>
            )}
          </div>
        </div>

        <div className="bowler-info">
          <div className="player-card bowler">
            <span className="label">Bowler</span>
            <span className="name">{innings.currentBowler?.name || 'Select bowler'}</span>
            {innings.currentBowler && (
              <span className="stats">
                {innings.bowlers.find(b => b.player._id === innings.currentBowler._id)?.overs || 0}.
                {(innings.bowlers.find(b => b.player._id === innings.currentBowler._id)?.balls || 0) % 6}-
                {innings.bowlers.find(b => b.player._id === innings.currentBowler._id)?.runs || 0}-
                {innings.bowlers.find(b => b.player._id === innings.currentBowler._id)?.wickets || 0}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="current-over-display">
        <div className="over-header">
          <span className="over-label">This Over:</span>
          <span className="over-runs">
            {currentOver?.balls?.reduce((sum, b) => sum + (b.runs?.total || 0), 0) || 0} runs
          </span>
        </div>
        <div className="ball-events">
          {currentOver?.balls?.map((ball, idx) => (
            <span 
              key={idx} 
              className={`ball-event ${ball.isWicket ? 'wicket' : ''} ${ball.isSix ? 'six' : ''} ${ball.isFour ? 'four' : ''}`}
              title={generateCommentary(ball, innings.currentStriker, innings.currentBowler)}
            >
              {ball.isWicket ? 'W' : 
               ball.extras?.type === 'wide' ? `Wd${ball.extras.runs > 0 ? '+' + ball.extras.runs : ''}` :
               ball.extras?.type === 'no_ball' ? `NB${ball.runs.batter}` :
               ball.extras?.type === 'bye' ? `B${ball.extras.runs}` :
               ball.extras?.type === 'leg_bye' ? `LB${ball.extras.runs}` :
               ball.runs.batter}
            </span>
          ))}
        </div>
        {currentOver?.balls?.length > 0 && (
          <div className="ball-commentary">
            <span className="commentary-icon">💬</span>
            <span className="commentary-text">
              {generateCommentary(
                currentOver.balls[currentOver.balls.length - 1],
                innings.currentStriker,
                innings.currentBowler
              )}
            </span>
          </div>
        )}
      </div>

      <div className="scoring-panel">
        <div className="run-buttons">
          {[0, 1, 2, 3, 4, 5, 6].map(run => (
            <button 
              key={run} 
              onClick={() => handleRun(run)} 
              className={`run-btn ${run === 4 ? 'four' : ''} ${run === 6 ? 'six' : ''}`}
            >
              {run}
            </button>
          ))}
        </div>

        <div className="extra-buttons">
          <button onClick={() => handleExtra('wide')} className="extra-btn wide">Wide</button>
          <button onClick={() => handleExtra('no_ball')} className="extra-btn no-ball">No Ball</button>
          <button onClick={() => handleExtra('bye', 1)} className="extra-btn bye">1 Bye</button>
          <button onClick={() => handleExtra('leg_bye', 1)} className="extra-btn leg-bye">1 LB</button>
        </div>

        <div className="wicket-button-container">
          <button 
            onClick={() => {
              setPendingBallData({ runs: 0 });
              setShowWicketModal(true);
            }} 
            className="wicket-btn"
          >
            🏏 Wicket
          </button>
        </div>

        <div className="action-buttons">
          <button onClick={handleUndo} className="action-btn undo">
            ↩ Undo
          </button>
          <button 
            onClick={() => setShowBatterModal(true)} 
            className="action-btn"
            disabled={innings.totalWickets >= 10}
          >
            + Batter
          </button>
          <button 
            onClick={() => setShowBowlerModal(true)} 
            className="action-btn"
          >
            🎳 Bowler
          </button>
        </div>
      </div>

      {showWicketModal && (
        <WicketModal
          innings={innings}
          availableBowlers={availableBowlers}
          onClose={() => setShowWicketModal(false)}
          onConfirm={handleWicket}
        />
      )}

      {showBatterModal && (
        <BatterModal
          availableBatters={availableBatters}
          onClose={() => setShowBatterModal(false)}
          onSelect={handleSetBatter}
        />
      )}

      {showBowlerModal && (
        <BowlerModal
          availableBowlers={availableBowlers}
          currentBowler={innings.currentBowler}
          onClose={() => setShowBowlerModal(false)}
          onSelect={handleSetBowler}
        />
      )}

      {showSecondInningsModal && match && (
        <SecondInningsModal
          match={match}
          firstInnings={match.innings.find(i => i.inningsNumber === 1)}
          onClose={() => navigate(`/matches/${id}`)}
          onStart={handleStartSecondInnings}
        />
      )}
    </div>
  );
};

const WicketModal = ({ innings, availableBowlers, onClose, onConfirm }) => {
  const [dismissalType, setDismissalType] = useState('');
  const [batter, setBatter] = useState(innings.currentStriker._id);
  const [fielder, setFielder] = useState('');

  const dismissalTypes = [
    'bowled', 'caught', 'lbw', 'run_out', 'stumped', 
    'hit_wicket', 'caught_behind', 'caught_and_bowled'
  ];

  const needsFielder = ['caught', 'run_out', 'stumped', 'caught_behind'];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Record Wicket</h3>
        
        <div className="form-group">
          <label>Dismissal Type</label>
          <select value={dismissalType} onChange={(e) => setDismissalType(e.target.value)}>
            <option value="">Select type</option>
            {dismissalTypes.map(type => (
              <option key={type} value={type}>{type.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Batter Out</label>
          <select value={batter} onChange={(e) => setBatter(e.target.value)}>
            <option value={innings.currentStriker._id}>{innings.currentStriker.name} (Striker)</option>
            <option value={innings.currentNonStriker._id}>{innings.currentNonStriker.name} (Non-Striker)</option>
          </select>
        </div>

        {needsFielder.includes(dismissalType) && (
          <div className="form-group">
            <label>Fielder</label>
            <select value={fielder} onChange={(e) => setFielder(e.target.value)}>
              <option value="">Select fielder</option>
              {availableBowlers.map(player => (
                <option key={player._id} value={player._id}>{player.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-outline">Cancel</button>
          <button 
            onClick={() => onConfirm({ dismissalType, batter, fielder })}
            className="btn btn-danger"
            disabled={!dismissalType}
          >
            Confirm Wicket
          </button>
        </div>
      </div>
    </div>
  );
};

const BatterModal = ({ availableBatters, onClose, onSelect }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Select New Batter</h3>
        <div className="player-select-list">
          {availableBatters.map(player => (
            <button 
              key={player._id} 
              onClick={() => onSelect(player._id)}
              className="player-select-btn"
            >
              {player.name}
              <span className="role">{player.role.replace('_', ' ')}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="btn btn-outline">Cancel</button>
      </div>
    </div>
  );
};

const BowlerModal = ({ availableBowlers, currentBowler, onClose, onSelect }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Select Bowler</h3>
        <div className="player-select-list">
          {availableBowlers.map(player => (
            <button 
              key={player._id} 
              onClick={() => onSelect(player._id)}
              className="player-select-btn"
              disabled={player._id === currentBowler?._id}
            >
              {player.name}
              <span className="role">{player.bowlingStyle?.replace(/_/g, ' ') || 'N/A'}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="btn btn-outline">Cancel</button>
      </div>
    </div>
  );
};

const SecondInningsModal = ({ match, firstInnings, onClose, onStart }) => {
  const [openingBatters, setOpeningBatters] = useState(['', '']);
  const [openingBowler, setOpeningBowler] = useState('');
  const [battingPlayers, setBattingPlayers] = useState([]);
  const [bowlingPlayers, setBowlingPlayers] = useState([]);

  useEffect(() => {
    const loadPlayers = async () => {
      const battingTeamId = firstInnings.bowlingTeam._id;
      const bowlingTeamId = firstInnings.battingTeam._id;

      const [teamAPlayers, teamBPlayers] = await Promise.all([
        teamService.getTeamPlayers(match.teamA.team._id),
        teamService.getTeamPlayers(match.teamB.team._id)
      ]);

      const batting = battingTeamId === match.teamA.team._id
        ? teamAPlayers.data.filter(p => match.teamA.players.some(mp => mp._id === p._id))
        : teamBPlayers.data.filter(p => match.teamB.players.some(mp => mp._id === p._id));

      const bowling = bowlingTeamId === match.teamA.team._id
        ? teamAPlayers.data.filter(p => match.teamA.players.some(mp => mp._id === p._id))
        : teamBPlayers.data.filter(p => match.teamB.players.some(mp => mp._id === p._id));

      setBattingPlayers(batting);
      setBowlingPlayers(bowling);
    };

    loadPlayers();
  }, [match, firstInnings]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Start Second Innings</h3>
        <p className="target-display">
          Target: {firstInnings.totalRuns + 1} runs
        </p>

        <div className="form-group">
          <label>Opening Striker</label>
          <select
            value={openingBatters[0]}
            onChange={(e) => setOpeningBatters([e.target.value, openingBatters[1]])}
          >
            <option value="">Select Striker</option>
            {battingPlayers.map(p => (
              <option key={p._id} value={p._id} disabled={p._id === openingBatters[1]}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Opening Non-Striker</label>
          <select
            value={openingBatters[1]}
            onChange={(e) => setOpeningBatters([openingBatters[0], e.target.value])}
          >
            <option value="">Select Non-Striker</option>
            {battingPlayers.map(p => (
              <option key={p._id} value={p._id} disabled={p._id === openingBatters[0]}>
                {p.name}
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
            {bowlingPlayers.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-outline">Cancel</button>
          <button 
            onClick={() => onStart({ openingBatters, openingBowler })}
            className="btn btn-success"
            disabled={!openingBatters[0] || !openingBatters[1] || !openingBowler}
          >
            Start Innings
          </button>
        </div>
      </div>
    </div>
  );
};
