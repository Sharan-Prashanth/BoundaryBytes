import { createContext, useContext, useState, useCallback } from 'react';
import { matchService, scoringService } from '../services';

const MatchContext = createContext(null);

export const useMatch = () => {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return context;
};

export const MatchProvider = ({ children }) => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [currentInnings, setCurrentInnings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMatch = useCallback(async (matchId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await matchService.getMatch(matchId);
      setCurrentMatch(response.data);
      
      if (response.data.innings && response.data.innings.length > 0) {
        const activeInnings = response.data.innings.find(
          i => i.status === 'in_progress'
        ) || response.data.innings[response.data.innings.length - 1];
        setCurrentInnings(activeInnings);
      }
      
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load match';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateInnings = useCallback((inningsData) => {
    setCurrentInnings(inningsData);
    
    if (currentMatch && currentMatch.innings) {
      const updatedInnings = currentMatch.innings.map(i => 
        i.inningsNumber === inningsData.inningsNumber ? inningsData : i
      );
      setCurrentMatch({ ...currentMatch, innings: updatedInnings });
    }
  }, [currentMatch]);

  const recordBall = useCallback(async (matchId, ballData) => {
    try {
      setError(null);
      const response = await scoringService.recordBall(matchId, ballData);
      updateInnings(response.data.innings);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to record ball';
      setError(message);
      throw err;
    }
  }, [updateInnings]);

  const undoBall = useCallback(async (matchId) => {
    try {
      setError(null);
      const response = await scoringService.undoLastBall(matchId);
      updateInnings(response.data.innings);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to undo ball';
      setError(message);
      throw err;
    }
  }, [updateInnings]);

  const setNewBatter = useCallback(async (matchId, batterId, isStriker = true) => {
    try {
      setError(null);
      const response = await scoringService.setNewBatter(matchId, { batterId, isStriker });
      updateInnings(response.data.innings);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to set batter';
      setError(message);
      throw err;
    }
  }, [updateInnings]);

  const setNewBowler = useCallback(async (matchId, bowlerId) => {
    try {
      setError(null);
      const response = await scoringService.setNewBowler(matchId, { bowlerId });
      updateInnings(response.data.innings);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to set bowler';
      setError(message);
      throw err;
    }
  }, [updateInnings]);

  const swapBatters = useCallback(async (matchId) => {
    try {
      setError(null);
      const response = await scoringService.swapBatters(matchId);
      updateInnings(response.data.innings);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to swap batters';
      setError(message);
      throw err;
    }
  }, [updateInnings]);

  const clearMatch = useCallback(() => {
    setCurrentMatch(null);
    setCurrentInnings(null);
    setError(null);
  }, []);

  const value = {
    currentMatch,
    currentInnings,
    loading,
    error,
    loadMatch,
    updateInnings,
    recordBall,
    undoBall,
    setNewBatter,
    setNewBowler,
    swapBatters,
    clearMatch
  };

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
};
