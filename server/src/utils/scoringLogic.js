export const shouldRotateStrike = (runs, extras) => {
  const batterRuns = runs || 0;
  
  if (extras && (extras.type === 'bye' || extras.type === 'leg_bye')) {
    return (batterRuns + extras.runs) % 2 === 1;
  }
  
  return batterRuns % 2 === 1;
};

export const isLegalBall = (extras) => {
  if (!extras || !extras.type) return true;
  return extras.type !== 'wide' && extras.type !== 'no_ball';
};

export const calculateTotalRuns = (batterRuns, extras) => {
  let total = batterRuns || 0;
  
  if (extras && extras.type) {
    if (extras.type === 'wide') {
      total = 1 + (extras.runs || 0);
    } else if (extras.type === 'no_ball') {
      total = 1 + (batterRuns || 0) + (extras.runs || 0);
    } else if (extras.type === 'bye' || extras.type === 'leg_bye') {
      total = extras.runs || 0;
    } else if (extras.type === 'penalty') {
      total = extras.runs || 0;
    }
  }
  
  return total;
};

export const getBatterRuns = (runs, extras) => {
  if (extras && (extras.type === 'wide' || extras.type === 'bye' || extras.type === 'leg_bye')) {
    return 0;
  }
  return runs || 0;
};

export const formatOvers = (totalBalls) => {
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls}`;
};

export const parseovers = (oversString) => {
  const [overs, balls] = oversString.split('.').map(Number);
  return overs * 6 + (balls || 0);
};

export const calculateRunRate = (runs, balls) => {
  if (balls === 0) return 0;
  const overs = balls / 6;
  return (runs / overs).toFixed(2);
};

export const calculateRequiredRunRate = (target, currentRuns, ballsRemaining) => {
  if (ballsRemaining === 0) return null;
  const runsNeeded = target - currentRuns;
  const oversRemaining = ballsRemaining / 6;
  return runsNeeded > 0 ? (runsNeeded / oversRemaining).toFixed(2) : 0;
};

export const isBowlerCreditedWicket = (dismissalType) => {
  const nonBowlerWickets = ['run_out', 'retired_hurt', 'retired_out', 'obstructing_field', 'timed_out'];
  return !nonBowlerWickets.includes(dismissalType);
};

export const generateMatchResult = (match, innings1, innings2) => {
  const team1Runs = innings1.totalRuns;
  const team1Wickets = innings1.totalWickets;
  const team2Runs = innings2.totalRuns;
  const team2Wickets = innings2.totalWickets;

  if (team1Runs > team2Runs) {
    const margin = team1Runs - team2Runs;
    return {
      winner: innings1.battingTeam,
      winMargin: margin,
      winType: 'runs',
      summary: `${innings1.battingTeam.name} won by ${margin} runs`
    };
  } else if (team2Runs > team1Runs) {
    const margin = 10 - team2Wickets;
    return {
      winner: innings2.battingTeam,
      winMargin: margin,
      winType: 'wickets',
      summary: `${innings2.battingTeam.name} won by ${margin} wickets`
    };
  } else {
    return {
      winner: null,
      winMargin: null,
      winType: 'tie',
      summary: 'Match Tied'
    };
  }
};
