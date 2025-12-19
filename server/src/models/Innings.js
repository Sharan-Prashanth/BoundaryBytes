import mongoose from 'mongoose';
import { INNINGS_STATUS } from '../config/constants.js';

const batterStatsSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  runs: { type: Number, default: 0 },
  ballsFaced: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  isOut: { type: Boolean, default: false },
  dismissalType: { type: String, default: null },
  dismissedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  fielder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  battingOrder: { type: Number, required: true }
}, { _id: false });

const bowlerStatsSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  overs: { type: Number, default: 0 },
  balls: { type: Number, default: 0 },
  maidens: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  wides: { type: Number, default: 0 },
  noBalls: { type: Number, default: 0 },
  economyRate: { type: Number, default: 0 }
}, { _id: false });

const fallOfWicketSchema = new mongoose.Schema({
  wicketNumber: { type: Number, required: true },
  score: { type: Number, required: true },
  overs: { type: String, required: true },
  batter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  }
}, { _id: false });

const inningsSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  inningsNumber: {
    type: Number,
    enum: [1, 2],
    required: true
  },
  battingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  bowlingTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  totalRuns: { type: Number, default: 0 },
  totalWickets: { type: Number, default: 0 },
  totalOvers: { type: Number, default: 0 },
  totalBalls: { type: Number, default: 0 },
  extras: {
    wides: { type: Number, default: 0 },
    noBalls: { type: Number, default: 0 },
    byes: { type: Number, default: 0 },
    legByes: { type: Number, default: 0 },
    penalties: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  target: { type: Number, default: null },
  runRate: { type: Number, default: 0 },
  requiredRunRate: { type: Number, default: null },
  status: {
    type: String,
    enum: Object.values(INNINGS_STATUS),
    default: INNINGS_STATUS.NOT_STARTED
  },
  currentStriker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  currentNonStriker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  currentBowler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
  },
  currentOver: { type: Number, default: 0 },
  currentOverBalls: { type: Number, default: 0 },
  batters: [batterStatsSchema],
  bowlers: [bowlerStatsSchema],
  fallOfWickets: [fallOfWicketSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

inningsSchema.virtual('overs', {
  ref: 'Over',
  localField: '_id',
  foreignField: 'innings'
});

inningsSchema.methods.calculateRunRate = function() {
  const overs = this.currentOver + (this.currentOverBalls / 6);
  this.runRate = overs > 0 ? (this.totalRuns / overs).toFixed(2) : 0;
  return this.runRate;
};

inningsSchema.methods.calculateRequiredRunRate = function() {
  if (!this.target) return null;
  const runsNeeded = this.target - this.totalRuns;
  const totalBallsInMatch = this.match.totalOvers * 6;
  const ballsRemaining = totalBallsInMatch - this.totalBalls;
  const oversRemaining = ballsRemaining / 6;
  this.requiredRunRate = oversRemaining > 0 ? (runsNeeded / oversRemaining).toFixed(2) : null;
  return this.requiredRunRate;
};

const Innings = mongoose.model('Innings', inningsSchema);

export default Innings;
