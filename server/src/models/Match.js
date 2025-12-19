import mongoose from 'mongoose';
import { MATCH_STATUS, TOSS_DECISIONS } from '../config/constants.js';

const matchSchema = new mongoose.Schema({
  teamA: {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    players: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }]
  },
  teamB: {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    players: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player'
    }]
  },
  totalOvers: {
    type: Number,
    required: [true, 'Total overs is required'],
    min: [1, 'Minimum 1 over required'],
    max: [50, 'Maximum 50 overs allowed']
  },
  venue: {
    type: String,
    trim: true,
    default: 'TBD'
  },
  matchDate: {
    type: Date,
    default: Date.now
  },
  toss: {
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    },
    decision: {
      type: String,
      enum: Object.values(TOSS_DECISIONS),
      default: null
    }
  },
  status: {
    type: String,
    enum: Object.values(MATCH_STATUS),
    default: MATCH_STATUS.UPCOMING
  },
  currentInnings: {
    type: Number,
    enum: [1, 2],
    default: 1
  },
  result: {
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    },
    winMargin: {
      type: Number,
      default: null
    },
    winType: {
      type: String,
      enum: ['runs', 'wickets', 'tie', 'no_result', null],
      default: null
    },
    summary: {
      type: String,
      default: null
    }
  },
  publicLink: {
    type: String,
    unique: true,
    sparse: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    default: null
  },
  scorer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

matchSchema.virtual('innings', {
  ref: 'Innings',
  localField: '_id',
  foreignField: 'match'
});

matchSchema.pre('save', function(next) {
  if (!this.publicLink) {
    this.publicLink = `${this._id}-${Date.now().toString(36)}`;
  }
  next();
});

const Match = mongoose.model('Match', matchSchema);

export default Match;
