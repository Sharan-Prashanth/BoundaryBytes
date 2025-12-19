import mongoose from 'mongoose';
import { EXTRA_TYPES, DISMISSAL_TYPES } from '../config/constants.js';

const ballEventSchema = new mongoose.Schema({
  innings: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Innings',
    required: true
  },
  over: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Over',
    required: true
  },
  ballNumber: {
    type: Number,
    required: true
  },
  overNumber: {
    type: Number,
    required: true
  },
  striker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  nonStriker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  bowler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  runs: {
    batter: { type: Number, default: 0 },
    extras: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  isLegalBall: { type: Boolean, default: true },
  isBoundary: { type: Boolean, default: false },
  isSix: { type: Boolean, default: false },
  isFour: { type: Boolean, default: false },
  isWicket: { type: Boolean, default: false },
  wicket: {
    dismissalType: {
      type: String,
      enum: [...Object.values(DISMISSAL_TYPES), null],
      default: null
    },
    batter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      default: null
    },
    bowler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      default: null
    },
    fielder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      default: null
    }
  },
  extras: {
    type: {
      type: String,
      enum: [...Object.values(EXTRA_TYPES), null],
      default: null
    },
    runs: { type: Number, default: 0 }
  },
  isUndone: { type: Boolean, default: false },
  sequence: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

ballEventSchema.index({ innings: 1, sequence: 1 });
ballEventSchema.index({ over: 1, ballNumber: 1 });

ballEventSchema.pre('save', function(next) {
  this.runs.total = this.runs.batter + this.runs.extras;
  this.isBoundary = this.runs.batter === 4 || this.runs.batter === 6;
  this.isFour = this.runs.batter === 4;
  this.isSix = this.runs.batter === 6;
  next();
});

const BallEvent = mongoose.model('BallEvent', ballEventSchema);

export default BallEvent;
