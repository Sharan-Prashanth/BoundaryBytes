import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Tournament.css';

export const Tournament = () => {
  const [tournaments, setTournaments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    format: 'knockout',
    overs: '20',
    teams: ['', ''],
  });

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = () => {
    const saved = localStorage.getItem('tournaments');
    if (saved) {
      setTournaments(JSON.parse(saved));
    }
    setLoading(false);
  };

  const saveTournaments = (newTournaments) => {
    localStorage.setItem('tournaments', JSON.stringify(newTournaments));
    setTournaments(newTournaments);
  };

  const handleCreateTournament = (e) => {
    e.preventDefault();
    const filteredTeams = formData.teams.filter(t => t.trim() !== '');
    if (filteredTeams.length < 2) {
      alert('Please add at least 2 teams');
      return;
    }

    const newTournament = {
      id: Date.now().toString(),
      name: formData.name,
      teams: filteredTeams,
      format: formData.format,
      overs: parseInt(formData.overs),
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      matches: [],
    };

    saveTournaments([...tournaments, newTournament]);
    setShowCreateModal(false);
    setFormData({ name: '', format: 'knockout', overs: '20', teams: ['', ''] });
  };

  const addTeamField = () => {
    setFormData({ ...formData, teams: [...formData.teams, ''] });
  };

  const updateTeam = (index, value) => {
    const newTeams = [...formData.teams];
    newTeams[index] = value;
    setFormData({ ...formData, teams: newTeams });
  };

  const removeTeam = (index) => {
    if (formData.teams.length > 2) {
      setFormData({ ...formData, teams: formData.teams.filter((_, i) => i !== index) });
    }
  };

  const deleteTournament = (id) => {
    if (window.confirm('Are you sure you want to delete this tournament?')) {
      saveTournaments(tournaments.filter(t => t.id !== id));
    }
  };

  const updateTournamentStatus = (id, status) => {
    const updated = tournaments.map(t => 
      t.id === id ? { ...t, status } : t
    );
    saveTournaments(updated);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'status-upcoming';
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };

  const getFormatLabel = (format) => {
    switch (format) {
      case 'knockout': return 'Knockout';
      case 'league': return 'Round Robin';
      case 'group': return 'Group Stage';
      default: return format;
    }
  };

  if (loading) {
    return <div className="loading">Loading tournaments...</div>;
  }

  return (
    <div className="tournament-container animate-fade-in">
      <div className="page-header">
        <div className="header-content">
          <h1 className="section-title">Tournaments</h1>
          <p className="section-subtitle">Organize and manage cricket tournaments</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Tournament
        </button>
      </div>

      {tournaments.length === 0 ? (
        <div className="empty-state animate-scale-in">
          <span className="empty-state-icon">🏆</span>
          <h3 className="empty-state-title">No tournaments yet</h3>
          <p className="empty-state-text">Create your first tournament to get started</p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            Create Tournament
          </button>
        </div>
      ) : (
        <div className="tournaments-grid">
          {tournaments.map((tournament, index) => (
            <div 
              key={tournament.id} 
              className="tournament-card card-hover animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="tournament-header">
                <div className="tournament-title">
                  <span className="trophy-icon">🏆</span>
                  <h3>{tournament.name}</h3>
                </div>
                <span className={`tournament-status ${getStatusColor(tournament.status)}`}>
                  {tournament.status}
                </span>
              </div>

              <div className="tournament-info">
                <div className="info-item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{tournament.teams.length} Teams</span>
                </div>
                <div className="info-item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{tournament.overs} Overs</span>
                </div>
                <div className="info-item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>{getFormatLabel(tournament.format)}</span>
                </div>
              </div>

              <div className="tournament-teams">
                {tournament.teams.slice(0, 4).map((team, i) => (
                  <span key={i} className="team-badge">{team}</span>
                ))}
                {tournament.teams.length > 4 && (
                  <span className="team-badge more">+{tournament.teams.length - 4}</span>
                )}
              </div>

              <div className="tournament-actions">
                <select
                  value={tournament.status}
                  onChange={(e) => updateTournamentStatus(tournament.id, e.target.value)}
                  className="status-select"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
                <button 
                  onClick={() => deleteTournament(tournament.id)}
                  className="btn btn-danger btn-sm"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create Tournament</h2>
              <button onClick={() => setShowCreateModal(false)} className="modal-close">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTournament} className="modal-form">
              <div className="form-group">
                <label>Tournament Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Summer Cup 2025"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Format</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  >
                    <option value="knockout">Knockout</option>
                    <option value="league">Round Robin</option>
                    <option value="group">Group Stage</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Overs per Match</label>
                  <input
                    type="number"
                    value={formData.overs}
                    onChange={(e) => setFormData({ ...formData, overs: e.target.value })}
                    min="1"
                    max="50"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="teams-header">
                  <label>Teams</label>
                  <button type="button" onClick={addTeamField} className="add-team-btn">
                    + Add Team
                  </button>
                </div>
                <div className="teams-list">
                  {formData.teams.map((team, index) => (
                    <div key={index} className="team-input-row">
                      <input
                        type="text"
                        value={team}
                        onChange={(e) => updateTeam(index, e.target.value)}
                        placeholder={`Team ${index + 1}`}
                      />
                      {formData.teams.length > 2 && (
                        <button type="button" onClick={() => removeTeam(index)} className="remove-team-btn">
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">
                  Create Tournament
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
