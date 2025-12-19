import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [50, 'Team name cannot exceed 50 characters']
  },
  shortName: {
    type: String,
    required: [true, 'Short name is required'],
    trim: true,
    maxlength: [5, 'Short name cannot exceed 5 characters'],
    uppercase: true
  },
  logo: {
    type: String,
    default: null
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    default: null
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

teamSchema.virtual('players', {
  ref: 'Player',
  localField: '_id',
  foreignField: 'team'
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
