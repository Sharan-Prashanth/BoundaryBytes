import Team from '../models/Team.js';
import Player from '../models/Player.js';
import { asyncHandler, sendResponse, sendPaginatedResponse, AppError } from '../utils/index.js';

export const createTeam = asyncHandler(async (req, res) => {
  const { name, shortName, logo } = req.body;

  const team = await Team.create({
    name,
    shortName,
    logo,
    createdBy: req.user._id
  });

  sendResponse(res, 201, team, 'Team created successfully');
});

export const getTeams = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { isActive: true };
  
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }

  const total = await Team.countDocuments(query);
  const teams = await Team.find(query)
    .populate('captain', 'name')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  sendPaginatedResponse(res, 200, teams, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  });
});

export const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('captain', 'name jerseyNumber role')
    .populate({
      path: 'players',
      select: 'name jerseyNumber role battingStyle bowlingStyle stats'
    });

  if (!team) {
    throw new AppError('Team not found', 404);
  }

  sendResponse(res, 200, team);
});

export const updateTeam = asyncHandler(async (req, res) => {
  const { name, shortName, logo, captain } = req.body;

  const team = await Team.findById(req.params.id);
  if (!team) {
    throw new AppError('Team not found', 404);
  }

  if (captain) {
    const player = await Player.findOne({ _id: captain, team: team._id });
    if (!player) {
      throw new AppError('Captain must be a player in this team', 400);
    }
  }

  const updatedTeam = await Team.findByIdAndUpdate(
    req.params.id,
    { name, shortName, logo, captain },
    { new: true, runValidators: true }
  ).populate('captain', 'name');

  sendResponse(res, 200, updatedTeam, 'Team updated successfully');
});

export const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    throw new AppError('Team not found', 404);
  }

  await Team.findByIdAndUpdate(req.params.id, { isActive: false });
  await Player.updateMany({ team: req.params.id }, { isActive: false });

  sendResponse(res, 200, null, 'Team deleted successfully');
});

export const getTeamPlayers = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    throw new AppError('Team not found', 404);
  }

  const players = await Player.find({ team: req.params.id, isActive: true })
    .select('name jerseyNumber role battingStyle bowlingStyle stats avatar')
    .sort({ name: 1 });

  sendResponse(res, 200, players);
});
