import Player from '../models/Player.js';
import Team from '../models/Team.js';
import { asyncHandler, sendResponse, sendPaginatedResponse, AppError } from '../utils/index.js';

export const createPlayer = asyncHandler(async (req, res) => {
  const { name, team, jerseyNumber, role, battingStyle, bowlingStyle, avatar } = req.body;

  const teamExists = await Team.findById(team);
  if (!teamExists) {
    throw new AppError('Team not found', 404);
  }

  const player = await Player.create({
    name,
    team,
    jerseyNumber,
    role,
    battingStyle,
    bowlingStyle,
    avatar,
    createdBy: req.user._id
  });

  sendResponse(res, 201, player, 'Player created successfully');
});

export const getPlayers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = { isActive: true };
  
  if (req.query.team) {
    query.team = req.query.team;
  }
  
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }

  if (req.query.role) {
    query.role = req.query.role;
  }

  const total = await Player.countDocuments(query);
  const players = await Player.find(query)
    .populate('team', 'name shortName')
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });

  sendPaginatedResponse(res, 200, players, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  });
});

export const getPlayer = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.params.id)
    .populate('team', 'name shortName logo');

  if (!player) {
    throw new AppError('Player not found', 404);
  }

  sendResponse(res, 200, player);
});

export const updatePlayer = asyncHandler(async (req, res) => {
  const { name, jerseyNumber, role, battingStyle, bowlingStyle, avatar } = req.body;

  const player = await Player.findById(req.params.id);
  if (!player) {
    throw new AppError('Player not found', 404);
  }

  const updatedPlayer = await Player.findByIdAndUpdate(
    req.params.id,
    { name, jerseyNumber, role, battingStyle, bowlingStyle, avatar },
    { new: true, runValidators: true }
  ).populate('team', 'name shortName');

  sendResponse(res, 200, updatedPlayer, 'Player updated successfully');
});

export const deletePlayer = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.params.id);
  if (!player) {
    throw new AppError('Player not found', 404);
  }

  await Player.findByIdAndUpdate(req.params.id, { isActive: false });

  sendResponse(res, 200, null, 'Player deleted successfully');
});

export const createMultiplePlayers = asyncHandler(async (req, res) => {
  const { team, players } = req.body;

  const teamExists = await Team.findById(team);
  if (!teamExists) {
    throw new AppError('Team not found', 404);
  }

  const playersToCreate = players.map(p => ({
    ...p,
    team,
    createdBy: req.user._id
  }));

  const createdPlayers = await Player.insertMany(playersToCreate);

  sendResponse(res, 201, createdPlayers, `${createdPlayers.length} players created successfully`);
});
