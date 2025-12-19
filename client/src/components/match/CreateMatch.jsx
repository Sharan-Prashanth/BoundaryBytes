import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchService, teamService } from '../../services';
import './Match.css';

export const CreateMatch = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    teamA: '',
    teamB: '',
    totalOvers: 20,
    venue: '',
    matchDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await teamService.getTeams({ limit: 100 });
      setTeams(response.data);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.teamA === formData.teamB) {
      setError('Please select different teams');
      return;
    }

    setLoading(true);

    try {
      const response = await matchService.createMatch(formData);
      navigate(`/matches/${response.data._id}/setup`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-match-container">
      <h1>Create New Match</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="create-match-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="teamA">Team A</label>
            <select
              id="teamA"
              name="teamA"
              value={formData.teamA}
              onChange={handleChange}
              required
            >
              <option value="">Select Team A</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name} ({team.shortName})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="teamB">Team B</label>
            <select
              id="teamB"
              name="teamB"
              value={formData.teamB}
              onChange={handleChange}
              required
            >
              <option value="">Select Team B</option>
              {teams.map(team => (
                <option key={team._id} value={team._id}>
                  {team.name} ({team.shortName})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="totalOvers">Total Overs</label>
            <input
              type="number"
              id="totalOvers"
              name="totalOvers"
              value={formData.totalOvers}
              onChange={handleChange}
              min="1"
              max="50"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="matchDate">Match Date</label>
            <input
              type="date"
              id="matchDate"
              name="matchDate"
              value={formData.matchDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="venue">Venue</label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            placeholder="Enter venue"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Match'}
        </button>
      </form>
    </div>
  );
};
