import { useState, useEffect } from 'react';
import { playerService } from '../../services';
import './PlayerStats.css';

export const PlayerStats = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('runs');
  const [viewType, setViewType] = useState('batting');

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const response = await playerService.getPlayers({ limit: 100 });
      setPlayers(response.data);
    } catch (err) {
      console.error('Failed to load players:', err);
      // Use sample data if API fails
      setPlayers(getSamplePlayers());
    } finally {
      setLoading(false);
    }
  };

  const getSamplePlayers = () => [
    {
      _id: '1',
      name: 'Virat Sharma',
      team: { name: 'Royal Challengers' },
      battingStats: { matches: 15, innings: 14, runs: 486, highScore: 89, average: 40.5, strikeRate: 142.5, fours: 48, sixes: 18, notOuts: 2 },
      bowlingStats: { matches: 15, innings: 3, overs: 6, wickets: 2, runsConceded: 45, economy: 7.5, average: 22.5, bestFigures: '1/12' },
    },
    {
      _id: '2',
      name: 'Rohit Kumar',
      team: { name: 'Mumbai Indians' },
      battingStats: { matches: 12, innings: 12, runs: 398, highScore: 102, average: 36.2, strikeRate: 156.3, fours: 42, sixes: 22, notOuts: 1 },
      bowlingStats: { matches: 12, innings: 0, overs: 0, wickets: 0, runsConceded: 0, economy: 0, average: 0, bestFigures: '-' },
    },
    {
      _id: '3',
      name: 'Jasprit Patel',
      team: { name: 'Mumbai Indians' },
      battingStats: { matches: 15, innings: 8, runs: 56, highScore: 18, average: 8.0, strikeRate: 98.2, fours: 4, sixes: 2, notOuts: 1 },
      bowlingStats: { matches: 15, innings: 15, overs: 58, wickets: 24, runsConceded: 412, economy: 7.1, average: 17.2, bestFigures: '4/22' },
    },
    {
      _id: '4',
      name: 'Ravindra Singh',
      team: { name: 'Chennai Kings' },
      battingStats: { matches: 14, innings: 10, runs: 189, highScore: 45, average: 21.0, strikeRate: 118.9, fours: 16, sixes: 6, notOuts: 1 },
      bowlingStats: { matches: 14, innings: 14, overs: 52, wickets: 18, runsConceded: 398, economy: 7.65, average: 22.1, bestFigures: '3/28' },
    },
    {
      _id: '5',
      name: 'Shubman Gill',
      team: { name: 'Gujarat Titans' },
      battingStats: { matches: 16, innings: 16, runs: 567, highScore: 128, average: 47.25, strikeRate: 135.7, fours: 58, sixes: 15, notOuts: 4 },
      bowlingStats: { matches: 16, innings: 0, overs: 0, wickets: 0, runsConceded: 0, economy: 0, average: 0, bestFigures: '-' },
    },
  ];

  const filteredPlayers = players
    .filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'runs') return (b.battingStats?.runs || 0) - (a.battingStats?.runs || 0);
      if (sortBy === 'wickets') return (b.bowlingStats?.wickets || 0) - (a.bowlingStats?.wickets || 0);
      if (sortBy === 'average') return (b.battingStats?.average || 0) - (a.battingStats?.average || 0);
      return (b.battingStats?.matches || 0) - (a.battingStats?.matches || 0);
    });

  const topRunScorer = [...players].sort((a, b) => (b.battingStats?.runs || 0) - (a.battingStats?.runs || 0))[0];
  const topWicketTaker = [...players].sort((a, b) => (b.bowlingStats?.wickets || 0) - (a.bowlingStats?.wickets || 0))[0];

  if (loading) {
    return <div className="loading">Loading player statistics...</div>;
  }

  return (
    <div className="player-stats-container animate-fade-in">
      <div className="page-header">
        <div className="header-content">
          <h1 className="section-title">Player Statistics</h1>
          <p className="section-subtitle">Track batting and bowling performance across matches</p>
        </div>
      </div>

      {/* Top Performers */}
      <div className="top-performers animate-fade-in-up">
        {topRunScorer && (
          <div className="performer-card runs-leader">
            <div className="performer-icon">🏆</div>
            <div className="performer-info">
              <span className="performer-label">Top Run Scorer</span>
              <span className="performer-name">{topRunScorer.name}</span>
              <span className="performer-stat">{topRunScorer.battingStats?.runs || 0} runs</span>
            </div>
          </div>
        )}

        {topWicketTaker && topWicketTaker.bowlingStats?.wickets > 0 && (
          <div className="performer-card wickets-leader">
            <div className="performer-icon">⚡</div>
            <div className="performer-info">
              <span className="performer-label">Top Wicket Taker</span>
              <span className="performer-name">{topWicketTaker.name}</span>
              <span className="performer-stat">{topWicketTaker.bowlingStats?.wickets || 0} wickets</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="filters-section animate-fade-in-up delay-100">
        <div className="search-box">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewType === 'batting' ? 'active' : ''}`}
              onClick={() => setViewType('batting')}
            >
              Batting
            </button>
            <button
              className={`toggle-btn ${viewType === 'bowling' ? 'active' : ''}`}
              onClick={() => setViewType('bowling')}
            >
              Bowling
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="runs">Sort by Runs</option>
            <option value="wickets">Sort by Wickets</option>
            <option value="average">Sort by Average</option>
            <option value="matches">Sort by Matches</option>
          </select>
        </div>
      </div>

      {/* Stats Table */}
      <div className="stats-table-container animate-scale-in delay-150">
        {viewType === 'batting' ? (
          <table className="stats-table">
            <thead>
              <tr>
                <th className="player-col">Player</th>
                <th>M</th>
                <th>Inn</th>
                <th className="highlight-col">Runs</th>
                <th className="hide-mobile">HS</th>
                <th className="hide-tablet">Avg</th>
                <th className="hide-tablet">SR</th>
                <th className="hide-desktop">4s</th>
                <th className="hide-desktop">6s</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, index) => (
                <tr 
                  key={player._id} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="player-col">
                    <div className="player-cell">
                      <div className="player-avatar batting">
                        {player.name?.charAt(0) || '?'}
                      </div>
                      <div className="player-details">
                        <span className="player-name">{player.name}</span>
                        <span className="player-team">{player.team?.name || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{player.battingStats?.matches || 0}</td>
                  <td>{player.battingStats?.innings || 0}</td>
                  <td className="highlight-col">{player.battingStats?.runs || 0}</td>
                  <td className="hide-mobile">{player.battingStats?.highScore || 0}</td>
                  <td className="hide-tablet">{(player.battingStats?.average || 0).toFixed(1)}</td>
                  <td className="hide-tablet">{(player.battingStats?.strikeRate || 0).toFixed(1)}</td>
                  <td className="hide-desktop">{player.battingStats?.fours || 0}</td>
                  <td className="hide-desktop">{player.battingStats?.sixes || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="stats-table">
            <thead>
              <tr>
                <th className="player-col">Player</th>
                <th>M</th>
                <th>Inn</th>
                <th>Overs</th>
                <th className="highlight-col">Wkts</th>
                <th className="hide-mobile">Runs</th>
                <th className="hide-tablet">Econ</th>
                <th className="hide-tablet">Avg</th>
                <th className="hide-desktop">Best</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, index) => (
                <tr 
                  key={player._id} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="player-col">
                    <div className="player-cell">
                      <div className="player-avatar bowling">
                        {player.name?.charAt(0) || '?'}
                      </div>
                      <div className="player-details">
                        <span className="player-name">{player.name}</span>
                        <span className="player-team">{player.team?.name || '-'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{player.bowlingStats?.matches || 0}</td>
                  <td>{player.bowlingStats?.innings || 0}</td>
                  <td>{player.bowlingStats?.overs || 0}</td>
                  <td className="highlight-col bowling">{player.bowlingStats?.wickets || 0}</td>
                  <td className="hide-mobile">{player.bowlingStats?.runsConceded || 0}</td>
                  <td className="hide-tablet">{(player.bowlingStats?.economy || 0).toFixed(2)}</td>
                  <td className="hide-tablet">{(player.bowlingStats?.average || 0).toFixed(1)}</td>
                  <td className="hide-desktop">{player.bowlingStats?.bestFigures || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {filteredPlayers.length === 0 && (
          <div className="empty-state">
            <p>No players found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};
