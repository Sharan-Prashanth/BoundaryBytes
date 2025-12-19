import Match from '../models/Match.js';
import Innings from '../models/Innings.js';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import { MATCH_STATUS, INNINGS_STATUS } from '../config/constants.js';
import { asyncHandler, sendResponse, sendPaginatedResponse, AppError } from '../utils/index.js';

export const createMatch = asyncHandler(async (req, res) => {
  const { 
    teamA, 
    teamB, 
    totalOvers, 
    venue, 
    matchDate, 
    toss,
    teamAPlayers,
    teamBPlayers
  } = req.body;

  if (teamA === teamB) {
    throw new AppError('Team A and Team B cannot be the same', 400);
  }

  const [teamAExists, teamBExists] = await Promise.all([
    Team.findById(teamA),
    Team.findById(teamB)
  ]);

  if (!teamAExists || !teamBExists) {
    throw new AppError('One or both teams not found', 404);
  }

  const match = await Match.create({
    teamA: {
      team: teamA,
      players: teamAPlayers || []
    },
    teamB: {
      team: teamB,
      players: teamBPlayers || []
    },
    totalOvers,
    venue,
    matchDate,
    toss: toss || {},
    scorer: req.user._id,
    createdBy: req.user._id
  });

  const populatedMatch = await Match.findById(match._id)
    .populate('teamA.team', 'name shortName logo')
    .populate('teamB.team', 'name shortName logo')
    .populate('teamA.players', 'name jerseyNumber role')
    .populate('teamB.players', 'name jerseyNumber role');

  sendResponse(res, 201, populatedMatch, 'Match created successfully');
});

export const getMatches = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};
  
  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.team) {
    query.$or = [
      { 'teamA.team': req.query.team },
      { 'teamB.team': req.query.team }
    ];
  }

  const total = await Match.countDocuments(query);
  const matches = await Match.find(query)
    .populate('teamA.team', 'name shortName logo')
    .populate('teamB.team', 'name shortName logo')
    .populate('result.winner', 'name shortName')
    .skip(skip)
    .limit(limit)
    .sort({ matchDate: -1 });

  sendPaginatedResponse(res, 200, matches, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  });
});

export const getMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('teamA.team', 'name shortName logo')
    .populate('teamB.team', 'name shortName logo')
    .populate('teamA.players', 'name jerseyNumber role battingStyle bowlingStyle')
    .populate('teamB.players', 'name jerseyNumber role battingStyle bowlingStyle')
    .populate('toss.winner', 'name shortName')
    .populate('result.winner', 'name shortName')
    .populate('scorer', 'name')
    .populate({
      path: 'innings',
      populate: [
        { path: 'battingTeam', select: 'name shortName' },
        { path: 'bowlingTeam', select: 'name shortName' },
        { path: 'batters.player', select: 'name' },
        { path: 'bowlers.player', select: 'name' },
        { path: 'currentStriker', select: 'name' },
        { path: 'currentNonStriker', select: 'name' },
        { path: 'currentBowler', select: 'name' }
      ]
    });

  if (!match) {
    throw new AppError('Match not found', 404);
  }

  sendResponse(res, 200, match);
});

export const getMatchByPublicLink = asyncHandler(async (req, res) => {
  const match = await Match.findOne({ publicLink: req.params.publicLink })
    .populate('teamA.team', 'name shortName logo')
    .populate('teamB.team', 'name shortName logo')
    .populate('teamA.players', 'name jerseyNumber role')
    .populate('teamB.players', 'name jerseyNumber role')
    .populate('toss.winner', 'name shortName')
    .populate('result.winner', 'name shortName')
    .populate({
      path: 'innings',
      populate: [
        { path: 'battingTeam', select: 'name shortName' },
        { path: 'bowlingTeam', select: 'name shortName' },
        { path: 'batters.player', select: 'name' },
        { path: 'bowlers.player', select: 'name' },
        { path: 'fallOfWickets.batter', select: 'name' }
      ]
    });

  if (!match) {
    throw new AppError('Match not found', 404);
  }

  sendResponse(res, 200, match);
});

export const updateMatch = asyncHandler(async (req, res) => {
  const { venue, matchDate, toss } = req.body;

  const match = await Match.findById(req.params.id);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.status !== MATCH_STATUS.UPCOMING) {
    throw new AppError('Cannot update match that has already started', 400);
  }

  const updatedMatch = await Match.findByIdAndUpdate(
    req.params.id,
    { venue, matchDate, toss },
    { new: true, runValidators: true }
  )
    .populate('teamA.team', 'name shortName logo')
    .populate('teamB.team', 'name shortName logo')
    .populate('toss.winner', 'name shortName');

  sendResponse(res, 200, updatedMatch, 'Match updated successfully');
});

export const updateMatchPlayers = asyncHandler(async (req, res) => {
  const { teamAPlayers, teamBPlayers } = req.body;

  const match = await Match.findById(req.params.id);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.status === MATCH_STATUS.COMPLETED) {
    throw new AppError('Cannot update players for completed match', 400);
  }

  const updateData = {};
  if (teamAPlayers) updateData['teamA.players'] = teamAPlayers;
  if (teamBPlayers) updateData['teamB.players'] = teamBPlayers;

  const updatedMatch = await Match.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  )
    .populate('teamA.team', 'name shortName')
    .populate('teamB.team', 'name shortName')
    .populate('teamA.players', 'name jerseyNumber role')
    .populate('teamB.players', 'name jerseyNumber role');

  sendResponse(res, 200, updatedMatch, 'Match players updated successfully');
});

export const setToss = asyncHandler(async (req, res) => {
  const { winner, decision } = req.body;

  const match = await Match.findById(req.params.id);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.status !== MATCH_STATUS.UPCOMING) {
    throw new AppError('Toss can only be set for upcoming matches', 400);
  }

  const isValidWinner = 
    match.teamA.team.toString() === winner || 
    match.teamB.team.toString() === winner;

  if (!isValidWinner) {
    throw new AppError('Toss winner must be one of the playing teams', 400);
  }

  match.toss = { winner, decision };
  await match.save();

  const updatedMatch = await Match.findById(match._id)
    .populate('teamA.team', 'name shortName')
    .populate('teamB.team', 'name shortName')
    .populate('toss.winner', 'name shortName');

  sendResponse(res, 200, updatedMatch, 'Toss updated successfully');
});

export const startMatch = asyncHandler(async (req, res) => {
  const { openingBatters, openingBowler } = req.body;

  const match = await Match.findById(req.params.id)
    .populate('teamA.team')
    .populate('teamB.team');

  if (!match) {
    throw new AppError('Match not found', 404);
  }

  if (match.status !== MATCH_STATUS.UPCOMING) {
    throw new AppError('Match has already started or completed', 400);
  }

  if (!match.toss.winner || !match.toss.decision) {
    throw new AppError('Toss must be completed before starting match', 400);
  }

  if (!openingBatters || openingBatters.length !== 2) {
    throw new AppError('Two opening batters are required', 400);
  }

  if (!openingBowler) {
    throw new AppError('Opening bowler is required', 400);
  }

  let battingTeam, bowlingTeam;
  if (match.toss.decision === 'bat') {
    battingTeam = match.toss.winner;
    bowlingTeam = match.teamA.team._id.toString() === match.toss.winner.toString() 
      ? match.teamB.team._id 
      : match.teamA.team._id;
  } else {
    bowlingTeam = match.toss.winner;
    battingTeam = match.teamA.team._id.toString() === match.toss.winner.toString() 
      ? match.teamB.team._id 
      : match.teamA.team._id;
  }

  const innings = await Innings.create({
    match: match._id,
    inningsNumber: 1,
    battingTeam,
    bowlingTeam,
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

  match.status = MATCH_STATUS.LIVE;
  match.currentInnings = 1;
  await match.save();

  const populatedInnings = await Innings.findById(innings._id)
    .populate('battingTeam', 'name shortName')
    .populate('bowlingTeam', 'name shortName')
    .populate('currentStriker', 'name')
    .populate('currentNonStriker', 'name')
    .populate('currentBowler', 'name')
    .populate('batters.player', 'name')
    .populate('bowlers.player', 'name');

  sendResponse(res, 200, { match, innings: populatedInnings }, 'Match started successfully');
});

export const deleteMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id);
  if (!match) {
    throw new AppError('Match not found', 404);
  }

  await Innings.deleteMany({ match: match._id });
  await Match.findByIdAndDelete(req.params.id);

  sendResponse(res, 200, null, 'Match deleted successfully');
});

export const getLiveMatches = asyncHandler(async (req, res) => {
  const matches = await Match.find({ status: MATCH_STATUS.LIVE })
    .populate('teamA.team', 'name shortName logo')
    .populate('teamB.team', 'name shortName logo')
    .populate({
      path: 'innings',
      populate: [
        { path: 'battingTeam', select: 'name shortName' },
        { path: 'currentStriker', select: 'name' },
        { path: 'currentNonStriker', select: 'name' },
        { path: 'currentBowler', select: 'name' }
      ]
    })
    .sort({ updatedAt: -1 });

  sendResponse(res, 200, matches);
});
