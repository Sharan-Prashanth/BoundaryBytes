import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Player name is required'],
    trim: true,
    maxlength: [50, 'Player name cannot exceed 50 characters']
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team is required']
  },
  jerseyNumber: {
    type: Number,
    default: null
  },
  role: {
    type: String,
    enum: ['batsman', 'bowler', 'all_rounder', 'wicket_keeper'],
    default: 'batsman'
  },
  battingStyle: {
    type: String,
    enum: ['right_hand', 'left_hand'],
    default: 'right_hand'
  },
  bowlingStyle: {
    type: String,
    enum: ['right_arm_fast', 'right_arm_medium', 'right_arm_off_spin', 'right_arm_leg_spin', 
           'left_arm_fast', 'left_arm_medium', 'left_arm_orthodox', 'left_arm_chinaman', 'none'],
    default: 'none'
  },
  avatar: {
    type: String,
    default: null
  },
  stats: {
    matches: { type: Number, default: 0 },
    innings: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    ballsFaced: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 },
    notOuts: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    ballsBowled: { type: Number, default: 0 },
    runsConceded: { type: Number, default: 0 },
    catches: { type: Number, default: 0 },
    stumpings: { type: Number, default: 0 },
    runOuts: { type: Number, default: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

playerSchema.virtual('battingAverage').get(function() {
  const dismissals = this.stats.innings - this.stats.notOuts;
  return dismissals > 0 ? (this.stats.runs / dismissals).toFixed(2) : this.stats.runs;
});

playerSchema.virtual('strikeRate').get(function() {
  return this.stats.ballsFaced > 0 ? ((this.stats.runs / this.stats.ballsFaced) * 100).toFixed(2) : 0;
});

playerSchema.virtual('bowlingAverage').get(function() {
  return this.stats.wickets > 0 ? (this.stats.runsConceded / this.stats.wickets).toFixed(2) : 0;
});

playerSchema.virtual('economyRate').get(function() {
  const overs = this.stats.ballsBowled / 6;
  return overs > 0 ? (this.stats.runsConceded / overs).toFixed(2) : 0;
});

const Player = mongoose.model('Player', playerSchema);

export default Player;
