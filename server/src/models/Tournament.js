import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true,
    maxlength: [100, 'Tournament name cannot exceed 100 characters']
  },
  shortName: {
    type: String,
    trim: true,
    maxlength: [10, 'Short name cannot exceed 10 characters'],
    uppercase: true
  },
  format: {
    type: String,
    enum: ['league', 'knockout', 'group_knockout', 'round_robin'],
    default: 'league'
  },
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  matches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }],
  oversPerMatch: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null
  },
  venue: {
    type: String,
    default: 'TBD'
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  runnerUp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  pointsTable: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    tied: { type: Number, default: 0 },
    noResult: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    netRunRate: { type: Number, default: 0 }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const Tournament = mongoose.model('Tournament', tournamentSchema);

export default Tournament;
