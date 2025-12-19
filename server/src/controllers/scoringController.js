import Match from '../models/Match.js';
import Innings from '../models/Innings.js';
import Over from '../models/Over.js';
import BallEvent from '../models/BallEvent.js';
import { MATCH_STATUS, INNINGS_STATUS, SOCKET_EVENTS } from '../config/constants.js';
import { 
  asyncHandler, 
  sendResponse, 
  AppError,
  shouldRotateStrike,
  isLegalBall,
  calculateTotalRuns,
  getBatterRuns,
  formatOvers,
  isBowlerCreditedWicket
} from '../utils/index.js';

export const recordBall = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { 
    runs = 0, 
    extras = null, 
    isWicket = false, 
    wicket = null 
  } = req.body;

  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.status !== MATCH_STATUS.LIVE) {
    throw new AppError('Match is not live', 400);
  }

  const innings = await Innings.findOne({ 
    match: matchId, 
    inningsNumber: match.currentInnings,
    status: INNINGS_STATUS.IN_PROGRESS
  });

  if (!innings) {
    throw new AppError('No active innings found', 400);
  }

  if (!innings.currentStriker || !innings.currentNonStriker || !innings.currentBowler) {
    throw new AppError('Striker, non-striker, and bowler must be set', 400);
  }

  let currentOver = await Over.findOne({ 
    innings: innings._id, 
    overNumber: innings.currentOver,
    isComplete: false
  });

  if (!currentOver) {
    currentOver = await Over.create({
      innings: innings._id,
      overNumber: innings.currentOver,
      bowler: innings.currentBowler
    });
  }

  const lastBall = await BallEvent.findOne({ innings: innings._id })
    .sort({ sequence: -1 });
  const sequence = lastBall ? lastBall.sequence + 1 : 1;

  const legalBall = isLegalBall(extras);
  const totalRuns = calculateTotalRuns(runs, extras);
  const batterRuns = getBatterRuns(runs, extras);

  const ballEvent = await BallEvent.create({
    innings: innings._id,
    over: currentOver._id,
    ballNumber: legalBall ? currentOver.legalBalls + 1 : currentOver.legalBalls,
    overNumber: innings.currentOver,
    striker: innings.currentStriker,
    nonStriker: innings.currentNonStriker,
    bowler: innings.currentBowler,
    runs: {
      batter: batterRuns,
      extras: extras ? extras.runs || (extras.type === 'wide' || extras.type === 'no_ball' ? 1 : 0) : 0,
      total: totalRuns
    },
    isLegalBall: legalBall,
    isWicket,
    wicket: isWicket ? wicket : null,
    extras: extras || { type: null, runs: 0 },
    sequence
  });

  innings.totalRuns += totalRuns;

  if (extras) {
    if (extras.type === 'wide') {
      innings.extras.wides += 1 + (extras.runs || 0);
      currentOver.wides += 1;
    } else if (extras.type === 'no_ball') {
      innings.extras.noBalls += 1;
      currentOver.noBalls += 1;
    } else if (extras.type === 'bye') {
      innings.extras.byes += extras.runs || 0;
    } else if (extras.type === 'leg_bye') {
      innings.extras.legByes += extras.runs || 0;
    } else if (extras.type === 'penalty') {
      innings.extras.penalties += extras.runs || 0;
    }
    innings.extras.total = innings.extras.wides + innings.extras.noBalls + 
                           innings.extras.byes + innings.extras.legByes + 
                           innings.extras.penalties;
  }

  const batterIndex = innings.batters.findIndex(
    b => b.player.toString() === innings.currentStriker.toString()
  );
  if (batterIndex !== -1) {
    innings.batters[batterIndex].runs += batterRuns;
    if (legalBall) {
      innings.batters[batterIndex].ballsFaced += 1;
    }
    if (batterRuns === 4) innings.batters[batterIndex].fours += 1;
    if (batterRuns === 6) innings.batters[batterIndex].sixes += 1;
  }

  const bowlerIndex = innings.bowlers.findIndex(
    b => b.player.toString() === innings.currentBowler.toString()
  );
  if (bowlerIndex !== -1) {
    innings.bowlers[bowlerIndex].runs += totalRuns;
    if (legalBall) {
      innings.bowlers[bowlerIndex].balls += 1;
    }
    if (extras?.type === 'wide') innings.bowlers[bowlerIndex].wides += 1;
    if (extras?.type === 'no_ball') innings.bowlers[bowlerIndex].noBalls += 1;
  }

  currentOver.runs += totalRuns;
  if (legalBall) {
    currentOver.legalBalls += 1;
    innings.totalBalls += 1;
  }

  if (isWicket) {
    await handleWicket(innings, wicket, currentOver, match);
  }

  let rotateStrike = shouldRotateStrike(batterRuns, extras);

  if (legalBall && currentOver.legalBalls >= 6) {
    currentOver.isComplete = true;
    currentOver.checkMaiden();
    
    if (bowlerIndex !== -1) {
      innings.bowlers[bowlerIndex].overs = Math.floor(innings.bowlers[bowlerIndex].balls / 6);
      if (currentOver.isMaiden) {
        innings.bowlers[bowlerIndex].maidens += 1;
      }
    }

    innings.currentOver += 1;
    innings.currentOverBalls = 0;
    
    rotateStrike = !rotateStrike;

    const totalOversReached = innings.currentOver >= match.totalOvers;
    
    if (totalOversReached || innings.totalWickets >= 10) {
      await completeInnings(match, innings);
    }
  } else if (legalBall) {
    innings.currentOverBalls = currentOver.legalBalls;
  }

  if (rotateStrike && !isWicket) {
    const temp = innings.currentStriker;
    innings.currentStriker = innings.currentNonStriker;
    innings.currentNonStriker = temp;
  }

  innings.calculateRunRate();
  if (innings.target) {
    innings.calculateRequiredRunRate();
    
    if (innings.totalRuns >= innings.target) {
      await completeInnings(match, innings);
    }
  }

  await currentOver.save();
  await innings.save();

  const populatedInnings = await Innings.findById(innings._id)
    .populate('battingTeam', 'name shortName')
    .populate('bowlingTeam', 'name shortName')
    .populate('currentStriker', 'name')
    .populate('currentNonStriker', 'name')
    .populate('currentBowler', 'name')
    .populate('batters.player', 'name')
    .populate('bowlers.player', 'name');

  const io = req.app.get('io');
  if (io) {
    io.to(`match_${matchId}`).emit(SOCKET_EVENTS.BALL_UPDATE, {
      ball: ballEvent,
      innings: populatedInnings,
      currentOver
    });

    if (currentOver.isComplete) {
      io.to(`match_${matchId}`).emit(SOCKET_EVENTS.OVER_COMPLETE, {
        over: currentOver,
        innings: populatedInnings
      });
    }

    if (isWicket) {
      io.to(`match_${matchId}`).emit(SOCKET_EVENTS.WICKET, {
        wicket,
        innings: populatedInnings
      });
    }
  }

  sendResponse(res, 200, {
    ball: ballEvent,
    innings: populatedInnings,
    currentOver
  }, 'Ball recorded successfully');
});

async function handleWicket(innings, wicket, currentOver, match) {
  innings.totalWickets += 1;
  currentOver.wickets += 1;

  const batterIndex = innings.batters.findIndex(
    b => b.player.toString() === wicket.batter.toString()
  );
  
  if (batterIndex !== -1) {
    innings.batters[batterIndex].isOut = true;
    innings.batters[batterIndex].dismissalType = wicket.dismissalType;
    if (wicket.bowler) {
      innings.batters[batterIndex].dismissedBy = wicket.bowler;
    }
    if (wicket.fielder) {
      innings.batters[batterIndex].fielder = wicket.fielder;
    }
  }

  if (isBowlerCreditedWicket(wicket.dismissalType)) {
    const bowlerIndex = innings.bowlers.findIndex(
      b => b.player.toString() === innings.currentBowler.toString()
    );
    if (bowlerIndex !== -1) {
      innings.bowlers[bowlerIndex].wickets += 1;
    }
  }

  innings.fallOfWickets.push({
    wicketNumber: innings.totalWickets,
    score: innings.totalRuns,
    overs: formatOvers(innings.totalBalls),
    batter: wicket.batter
  });

  if (wicket.batter.toString() === innings.currentStriker.toString()) {
    innings.currentStriker = null;
  } else if (wicket.batter.toString() === innings.currentNonStriker.toString()) {
    innings.currentNonStriker = null;
  }

  if (innings.totalWickets >= 10) {
    innings.status = INNINGS_STATUS.COMPLETED;
  }
}

async function completeInnings(match, innings) {
  innings.status = INNINGS_STATUS.COMPLETED;

  if (match.currentInnings === 1) {
    match.currentInnings = 2;
  } else {
    match.status = MATCH_STATUS.COMPLETED;
    await calculateMatchResult(match);
  }

  await match.save();
}

async function calculateMatchResult(match) {
  const innings = await Innings.find({ match: match._id })
    .populate('battingTeam', 'name shortName')
    .sort({ inningsNumber: 1 });

  if (innings.length < 2) return;

  const [innings1, innings2] = innings;

  if (innings1.totalRuns > innings2.totalRuns) {
    const margin = innings1.totalRuns - innings2.totalRuns;
    match.result = {
      winner: innings1.battingTeam._id,
      winMargin: margin,
      winType: 'runs',
      summary: `${innings1.battingTeam.name} won by ${margin} runs`
    };
  } else if (innings2.totalRuns > innings1.totalRuns) {
    const margin = 10 - innings2.totalWickets;
    match.result = {
      winner: innings2.battingTeam._id,
      winMargin: margin,
      winType: 'wickets',
      summary: `${innings2.battingTeam.name} won by ${margin} wickets`
    };
  } else {
    match.result = {
      winner: null,
      winMargin: null,
      winType: 'tie',
      summary: 'Match Tied'
    };
  }
}

export const undoLastBall = asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.status !== MATCH_STATUS.LIVE) {
    throw new AppError('Match is not live', 400);
  }

  const innings = await Innings.findOne({ 
    match: matchId, 
    inningsNumber: match.currentInnings,
    status: INNINGS_STATUS.IN_PROGRESS
  });

  if (!innings) {
    throw new AppError('No active innings found', 400);
  }

  const lastBall = await BallEvent.findOne({ 
    innings: innings._id,
    isUndone: false
  }).sort({ sequence: -1 });

  if (!lastBall) {
    throw new AppError('No ball to undo', 400);
  }

  lastBall.isUndone = true;
  await lastBall.save();

  innings.totalRuns -= lastBall.runs.total;

  if (lastBall.extras.type) {
    if (lastBall.extras.type === 'wide') {
      innings.extras.wides -= 1 + (lastBall.extras.runs || 0);
    } else if (lastBall.extras.type === 'no_ball') {
      innings.extras.noBalls -= 1;
    } else if (lastBall.extras.type === 'bye') {
      innings.extras.byes -= lastBall.extras.runs || 0;
    } else if (lastBall.extras.type === 'leg_bye') {
      innings.extras.legByes -= lastBall.extras.runs || 0;
    }
    innings.extras.total = innings.extras.wides + innings.extras.noBalls + 
                           innings.extras.byes + innings.extras.legByes + 
                           innings.extras.penalties;
  }

  const batterIndex = innings.batters.findIndex(
    b => b.player.toString() === lastBall.striker.toString()
  );
  if (batterIndex !== -1) {
    innings.batters[batterIndex].runs -= lastBall.runs.batter;
    if (lastBall.isLegalBall) {
      innings.batters[batterIndex].ballsFaced -= 1;
    }
    if (lastBall.isFour) innings.batters[batterIndex].fours -= 1;
    if (lastBall.isSix) innings.batters[batterIndex].sixes -= 1;
  }

  const bowlerIndex = innings.bowlers.findIndex(
    b => b.player.toString() === lastBall.bowler.toString()
  );
  if (bowlerIndex !== -1) {
    innings.bowlers[bowlerIndex].runs -= lastBall.runs.total;
    if (lastBall.isLegalBall) {
      innings.bowlers[bowlerIndex].balls -= 1;
    }
    if (lastBall.extras?.type === 'wide') innings.bowlers[bowlerIndex].wides -= 1;
    if (lastBall.extras?.type === 'no_ball') innings.bowlers[bowlerIndex].noBalls -= 1;
  }

  if (lastBall.isLegalBall) {
    innings.totalBalls -= 1;
  }

  if (lastBall.isWicket) {
    innings.totalWickets -= 1;
    
    if (batterIndex !== -1) {
      innings.batters[batterIndex].isOut = false;
      innings.batters[batterIndex].dismissalType = null;
      innings.batters[batterIndex].dismissedBy = null;
      innings.batters[batterIndex].fielder = null;
    }

    if (isBowlerCreditedWicket(lastBall.wicket.dismissalType) && bowlerIndex !== -1) {
      innings.bowlers[bowlerIndex].wickets -= 1;
    }

    innings.fallOfWickets.pop();
  }

  innings.currentStriker = lastBall.striker;
  innings.currentNonStriker = lastBall.nonStriker;
  innings.currentBowler = lastBall.bowler;

  const currentOver = await Over.findById(lastBall.over);
  if (currentOver) {
    currentOver.runs -= lastBall.runs.total;
    if (lastBall.isLegalBall) {
      currentOver.legalBalls -= 1;
    }
    if (lastBall.isWicket) {
      currentOver.wickets -= 1;
    }
    currentOver.isComplete = false;
    await currentOver.save();

    innings.currentOver = currentOver.overNumber;
    innings.currentOverBalls = currentOver.legalBalls;
  }

  innings.calculateRunRate();
  await innings.save();

  const populatedInnings = await Innings.findById(innings._id)
    .populate('battingTeam', 'name shortName')
    .populate('bowlingTeam', 'name shortName')
    .populate('currentStriker', 'name')
    .populate('currentNonStriker', 'name')
    .populate('currentBowler', 'name')
    .populate('batters.player', 'name')
    .populate('bowlers.player', 'name');

  const io = req.app.get('io');
  if (io) {
    io.to(`match_${matchId}`).emit(SOCKET_EVENTS.UNDO_BALL, {
      innings: populatedInnings
    });
  }

  sendResponse(res, 200, { innings: populatedInnings }, 'Last ball undone');
});

export const setNewBatter = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { batterId, isStriker = true } = req.body;

  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  const innings = await Innings.findOne({ 
    match: matchId, 
    inningsNumber: match.currentInnings,
    status: INNINGS_STATUS.IN_PROGRESS
  });

  if (!innings) {
    throw new AppError('No active innings found', 400);
  }

  const existingBatter = innings.batters.find(
    b => b.player.toString() === batterId
  );

  if (!existingBatter) {
    innings.batters.push({
      player: batterId,
      battingOrder: innings.batters.length + 1
    });
  }

  if (isStriker) {
    innings.currentStriker = batterId;
  } else {
    innings.currentNonStriker = batterId;
  }

  await innings.save();

  const populatedInnings = await Innings.findById(innings._id)
    .populate('currentStriker', 'name')
    .populate('currentNonStriker', 'name')
    .populate('batters.player', 'name');

  sendResponse(res, 200, { innings: populatedInnings }, 'New batter set');
});

export const setNewBowler = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { bowlerId } = req.body;

  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  const innings = await Innings.findOne({ 
    match: matchId, 
    inningsNumber: match.currentInnings,
    status: INNINGS_STATUS.IN_PROGRESS
  });

  if (!innings) {
    throw new AppError('No active innings found', 400);
  }

  const lastOver = await Over.findOne({
    innings: innings._id,
    isComplete: true
  }).sort({ overNumber: -1 });

  if (lastOver && lastOver.bowler.toString() === bowlerId) {
    throw new AppError('Same bowler cannot bowl consecutive overs', 400);
  }

  const existingBowler = innings.bowlers.find(
    b => b.player.toString() === bowlerId
  );

  if (!existingBowler) {
    innings.bowlers.push({ player: bowlerId });
  }

  innings.currentBowler = bowlerId;
  await innings.save();

  const populatedInnings = await Innings.findById(innings._id)
    .populate('currentBowler', 'name')
    .populate('bowlers.player', 'name');

  sendResponse(res, 200, { innings: populatedInnings }, 'New bowler set');
});

export const swapBatters = asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  const innings = await Innings.findOne({ 
    match: matchId, 
    inningsNumber: match.currentInnings,
    status: INNINGS_STATUS.IN_PROGRESS
  });

  if (!innings) {
    throw new AppError('No active innings found', 400);
  }

  const temp = innings.currentStriker;
  innings.currentStriker = innings.currentNonStriker;
  innings.currentNonStriker = temp;

  await innings.save();

  const populatedInnings = await Innings.findById(innings._id)
    .populate('currentStriker', 'name')
    .populate('currentNonStriker', 'name');

  sendResponse(res, 200, { innings: populatedInnings }, 'Batters swapped');
});

export const startSecondInnings = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { openingBatters, openingBowler } = req.body;

  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.currentInnings !== 2) {
    throw new AppError('First innings is not completed', 400);
  }

  const firstInnings = await Innings.findOne({ 
    match: matchId, 
    inningsNumber: 1 
  });

  if (!firstInnings || firstInnings.status !== INNINGS_STATUS.COMPLETED) {
    throw new AppError('First innings must be completed', 400);
  }

  const existingSecondInnings = await Innings.findOne({
    match: matchId,
    inningsNumber: 2
  });

  if (existingSecondInnings) {
    throw new AppError('Second innings already exists', 400);
  }

  const secondInnings = await Innings.create({
    match: matchId,
    inningsNumber: 2,
    battingTeam: firstInnings.bowlingTeam,
    bowlingTeam: firstInnings.battingTeam,
    target: firstInnings.totalRuns + 1,
    status: INNINGS_STATUS.IN_PROGRESS,
    currentStriker: openingBatters[0],
    currentNonStriker: openingBatters[1],
    currentBowler: openingBowler,
    batters: [
      { player: openingBatters[0], battingOrder: 1 },
      { player: openingBatters[1], battingOrder: 2 }
    ],
    bowlers: [
      { player: openingBowler }
    ]
  });

  const populatedInnings = await Innings.findById(secondInnings._id)
    .populate('battingTeam', 'name shortName')
    .populate('bowlingTeam', 'name shortName')
    .populate('currentStriker', 'name')
    .populate('currentNonStriker', 'name')
    .populate('currentBowler', 'name')
    .populate('batters.player', 'name')
    .populate('bowlers.player', 'name');

  const io = req.app.get('io');
  if (io) {
    io.to(`match_${matchId}`).emit(SOCKET_EVENTS.INNINGS_COMPLETE, {
      innings: populatedInnings,
      target: firstInnings.totalRuns + 1
    });
  }

  sendResponse(res, 200, { innings: populatedInnings }, 'Second innings started');
});

export const getInnings = asyncHandler(async (req, res) => {
  const { matchId, inningsNumber } = req.params;

  const innings = await Innings.findOne({ 
    match: matchId, 
    inningsNumber: parseInt(inningsNumber)
  })
    .populate('battingTeam', 'name shortName')
    .populate('bowlingTeam', 'name shortName')
    .populate('currentStriker', 'name')
    .populate('currentNonStriker', 'name')
    .populate('currentBowler', 'name')
    .populate('batters.player', 'name jerseyNumber')
    .populate('batters.dismissedBy', 'name')
    .populate('batters.fielder', 'name')
    .populate('bowlers.player', 'name')
    .populate('fallOfWickets.batter', 'name');

  if (!innings) {
    throw new AppError('Innings not found', 404);
  }

  sendResponse(res, 200, innings);
});

export const getCurrentOver = asyncHandler(async (req, res) => {
  const { matchId } = req.params;

  const match = await Match.findById(matchId);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  const innings = await Innings.findOne({ 
    match: matchId, 
    inningsNumber: match.currentInnings
  });

  if (!innings) {
    throw new AppError('No innings found', 404);
  }

  const currentOver = await Over.findOne({
    innings: innings._id,
    overNumber: innings.currentOver
  }).populate('bowler', 'name');

  const balls = await BallEvent.find({
    over: currentOver?._id,
    isUndone: false
  })
    .populate('striker', 'name')
    .populate('nonStriker', 'name')
    .populate('bowler', 'name')
    .sort({ ballNumber: 1 });

  sendResponse(res, 200, { over: currentOver, balls });
});

export const getBallEvents = asyncHandler(async (req, res) => {
  const { matchId, inningsNumber } = req.params;

  const innings = await Innings.findOne({ 
    match: matchId, 
    inningsNumber: parseInt(inningsNumber)
  });

  if (!innings) {
    throw new AppError('Innings not found', 404);
  }

  const balls = await BallEvent.find({ 
    innings: innings._id,
    isUndone: false
  })
    .populate('striker', 'name')
    .populate('nonStriker', 'name')
    .populate('bowler', 'name')
    .sort({ sequence: 1 });

  sendResponse(res, 200, balls);
});
