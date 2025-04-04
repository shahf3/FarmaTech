const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['manufacturer', 'distributor', 'regulator', 'enduser'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  organization: {
    type: String,
    required: true
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  address: {
    type: String
  },
  city: {
    type: String
  },
  country: {
    type: String
  },
  notes: {
    type: String
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  registeredByOrg: {
    type: String
  },
  isOrgAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profileImage: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);