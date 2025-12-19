import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchService } from '../../services';
import { useSocket, SOCKET_EVENTS } from '../../hooks';
import { useAuth } from '../../context';
import './Match.css';

export const MatchDetails = () => {
  const { id } = useParams();
  const { isScorer } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeInnings, setActiveInnings] = useState(1);
  
  const { subscribe, isConnected } = useSocket(id);

  useEffect(() => {
    loadMatch();
  }, [id]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(SOCKET_EVENTS.SCORE_UPDATE, (data) => {
      loadMatch();
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  const loadMatch = async () => {
    try {
      const response = await matchService.getMatch(id);
      setMatch(response.data);
    } catch (error) {
      console.error('Failed to load match:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading match...</div>;
  }

  if (!match) {
    return <div className="error">Match not found</div>;
  }

  const currentInnings = match.innings?.find(i => i.inningsNumber === activeInnings);

  return (
    <div className="match-details-container">
      <div className="match-header-card">
        <div className="match-status-bar">
          <span className={`status-badge ${match.status}`}>
            {match.status === 'live' && <span className="live-dot"></span>}
            {match.status.toUpperCase()}
          </span>
          <span className="overs-info">{match.totalOvers} Overs</span>
        </div>

        <div className="teams-score">
          <div className="team-score">
            <div className="team-info">
              <span className="team-name">{match.teamA.team.name}</span>
              <span className="team-short">{match.teamA.team.shortName}</span>
            </div>
            {match.innings?.find(i => i.battingTeam._id === match.teamA.team._id) && (
              <div className="score">
                {match.innings.find(i => i.battingTeam._id === match.teamA.team._id).totalRuns}/
                {match.innings.find(i => i.battingTeam._id === match.teamA.team._id).totalWickets}
                <span className="overs">
                  ({match.innings.find(i => i.battingTeam._id === match.teamA.team._id).currentOver}.
                  {match.innings.find(i => i.battingTeam._id === match.teamA.team._id).currentOverBalls})
                </span>
              </div>
            )}
          </div>

          <div className="vs">VS</div>

          <div className="team-score">
            <div className="team-info">
              <span className="team-name">{match.teamB.team.name}</span>
              <span className="team-short">{match.teamB.team.shortName}</span>
            </div>
            {match.innings?.find(i => i.battingTeam._id === match.teamB.team._id) && (
              <div className="score">
                {match.innings.find(i => i.battingTeam._id === match.teamB.team._id).totalRuns}/
                {match.innings.find(i => i.battingTeam._id === match.teamB.team._id).totalWickets}
                <span className="overs">
                  ({match.innings.find(i => i.battingTeam._id === match.teamB.team._id).currentOver}.
                  {match.innings.find(i => i.battingTeam._id === match.teamB.team._id).currentOverBalls})
                </span>
              </div>
            )}
          </div>
        </div>

        {match.result?.summary && (
          <div className="result-summary">{match.result.summary}</div>
        )}

        {match.status === 'live' && isScorer && (
          <Link to={`/matches/${id}/score`} className="btn btn-success">
            Continue Scoring
          </Link>
        )}

        {match.status === 'upcoming' && isScorer && (
          <Link to={`/matches/${id}/setup`} className="btn btn-primary">
            Setup Match
          </Link>
        )}
      </div>

      {match.innings && match.innings.length > 0 && (
        <>
          <div className="innings-tabs">
            {match.innings.map(inn => (
              <button
                key={inn.inningsNumber}
                className={`tab ${activeInnings === inn.inningsNumber ? 'active' : ''}`}
                onClick={() => setActiveInnings(inn.inningsNumber)}
              >
                {inn.battingTeam.shortName} Innings
              </button>
            ))}
          </div>

          {currentInnings && (
            <div className="scorecard">
              <div className="batting-card">
                <h3>Batting</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Batter</th>
                      <th>R</th>
                      <th>B</th>
                      <th>4s</th>
                      <th>6s</th>
                      <th>SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInnings.batters.map(batter => (
                      <tr key={batter.player._id} className={batter.isOut ? 'out' : ''}>
                        <td>
                          <span className="player-name">{batter.player.name}</span>
                          {batter.isOut && (
                            <span className="dismissal">{batter.dismissalType?.replace('_', ' ')}</span>
                          )}
                          {!batter.isOut && batter.player._id === currentInnings.currentStriker?._id && (
                            <span className="batting">*</span>
                          )}
                        </td>
                        <td>{batter.runs}</td>
                        <td>{batter.ballsFaced}</td>
                        <td>{batter.fours}</td>
                        <td>{batter.sixes}</td>
                        <td>
                          {batter.ballsFaced > 0 
                            ? ((batter.runs / batter.ballsFaced) * 100).toFixed(1) 
                            : '0.0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="extras">
                  <span>Extras: {currentInnings.extras.total}</span>
                  <span className="extras-detail">
                    (W: {currentInnings.extras.wides}, 
                    NB: {currentInnings.extras.noBalls}, 
                    B: {currentInnings.extras.byes}, 
                    LB: {currentInnings.extras.legByes})
                  </span>
                </div>

                <div className="total">
                  <strong>Total: {currentInnings.totalRuns}/{currentInnings.totalWickets}</strong>
                  <span>({currentInnings.currentOver}.{currentInnings.currentOverBalls} Overs)</span>
                  <span>RR: {currentInnings.runRate}</span>
                </div>
              </div>

              <div className="bowling-card">
                <h3>Bowling</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Bowler</th>
                      <th>O</th>
                      <th>M</th>
                      <th>R</th>
                      <th>W</th>
                      <th>Econ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInnings.bowlers.map(bowler => (
                      <tr key={bowler.player._id}>
                        <td>
                          <span className="player-name">{bowler.player.name}</span>
                          {bowler.player._id === currentInnings.currentBowler?._id && (
                            <span className="bowling">*</span>
                          )}
                        </td>
                        <td>{bowler.overs}.{bowler.balls % 6}</td>
                        <td>{bowler.maidens}</td>
                        <td>{bowler.runs}</td>
                        <td>{bowler.wickets}</td>
                        <td>
                          {bowler.balls > 0 
                            ? ((bowler.runs / (bowler.balls / 6))).toFixed(2) 
                            : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {currentInnings.fallOfWickets.length > 0 && (
                <div className="fow-card">
                  <h3>Fall of Wickets</h3>
                  <div className="fow-list">
                    {currentInnings.fallOfWickets.map((fow, idx) => (
                      <span key={idx} className="fow-item">
                        {fow.score}/{fow.wicketNumber} ({fow.batter.name}, {fow.overs})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
