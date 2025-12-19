import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchService } from '../../services';
import './MatchHistory.css';

export const MatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await matchService.getMatches({ limit: 50 });
      setMatches(response.data);
    } catch (err) {
      console.error('Failed to load matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(match => {
    const matchFilter = filter === 'all' || match.status === filter;
    const searchFilter = !searchQuery || 
      match.teamA?.team?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.teamB?.team?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && searchFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'status-live';
      case 'completed': return 'status-completed';
      case 'scheduled': return 'status-scheduled';
      default: return '';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMatchResult = (match) => {
    if (match.status !== 'completed') return null;
    if (match.result) return match.result;
    return 'Match completed';
  };

  if (loading) {
    return <div className="loading">Loading match history...</div>;
  }

  return (
    <div className="match-history-container animate-fade-in">
      <div className="page-header">
        <div className="header-content">
          <h1 className="section-title">Match History</h1>
          <p className="section-subtitle">View and manage all your cricket matches</p>
        </div>
        <Link to="/matches/create" className="btn btn-primary">
          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Match
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-bar animate-fade-in-up">
        <div className="search-box">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-tabs">
          {['all', 'live', 'completed', 'scheduled'].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${filter === tab ? 'active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab === 'live' && <span className="live-dot"></span>}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="empty-state animate-scale-in">
          <span className="empty-state-icon">🏏</span>
          <h3 className="empty-state-title">No matches found</h3>
          <p className="empty-state-text">
            {filter === 'all' 
              ? 'Start by creating your first match' 
              : `No ${filter} matches to display`
            }
          </p>
          <Link to="/matches/create" className="btn btn-primary">
            Create New Match
          </Link>
        </div>
      ) : (
        <div className="matches-grid">
          {filteredMatches.map((match, index) => (
            <Link
              to={`/matches/${match._id}`}
              key={match._id}
              className="match-card card-hover animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="match-card-header">
                <span className={`match-status ${getStatusColor(match.status)}`}>
                  {match.status === 'live' && <span className="live-dot"></span>}
                  {match.status}
                </span>
                <span className="match-date">{formatDate(match.createdAt)}</span>
              </div>

              <div className="match-teams">
                <div className="team-row">
                  <span className="team-name">{match.teamA?.team?.shortName || 'TBA'}</span>
                  {match.innings?.[0] && (
                    <span className="team-score">
                      {match.innings[0].battingTeam?._id === match.teamA?.team?._id ? (
                        <>
                          {match.innings[0].totalRuns}/{match.innings[0].totalWickets}
                          <small> ({match.innings[0].currentOver}.{match.innings[0].currentOverBalls})</small>
                        </>
                      ) : match.innings[1] ? (
                        <>
                          {match.innings[1].totalRuns}/{match.innings[1].totalWickets}
                          <small> ({match.innings[1].currentOver}.{match.innings[1].currentOverBalls})</small>
                        </>
                      ) : '-'}
                    </span>
                  )}
                </div>

                <div className="team-row">
                  <span className="team-name">{match.teamB?.team?.shortName || 'TBA'}</span>
                  {match.innings?.[0] && (
                    <span className="team-score">
                      {match.innings[0].battingTeam?._id === match.teamB?.team?._id ? (
                        <>
                          {match.innings[0].totalRuns}/{match.innings[0].totalWickets}
                          <small> ({match.innings[0].currentOver}.{match.innings[0].currentOverBalls})</small>
                        </>
                      ) : match.innings[1] ? (
                        <>
                          {match.innings[1].totalRuns}/{match.innings[1].totalWickets}
                          <small> ({match.innings[1].currentOver}.{match.innings[1].currentOverBalls})</small>
                        </>
                      ) : '-'}
                    </span>
                  )}
                </div>
              </div>

              {match.status === 'completed' && (
                <div className="match-result">
                  {getMatchResult(match)}
                </div>
              )}

              <div className="match-card-footer">
                <span className="match-format">{match.format} • {match.totalOvers} overs</span>
                <span className="view-details">View Details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
