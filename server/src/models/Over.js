import mongoose from 'mongoose';

const overSchema = new mongoose.Schema({
  innings: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Innings',
    required: true
  },
  overNumber: {
    type: Number,
    required: true,
    min: 0
  },
  bowler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: true
  },
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  wides: { type: Number, default: 0 },
  noBalls: { type: Number, default: 0 },
  legalBalls: { type: Number, default: 0 },
  isMaiden: { type: Boolean, default: false },
  isComplete: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

overSchema.virtual('balls', {
  ref: 'BallEvent',
  localField: '_id',
  foreignField: 'over'
});

overSchema.methods.checkMaiden = function() {
  if (this.isComplete && this.runs === 0 && this.wickets === 0) {
    this.isMaiden = true;
  }
  return this.isMaiden;
};

const Over = mongoose.model('Over', overSchema);

export default Over;
