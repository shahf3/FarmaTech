const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'manufacturer', // Default to manufacturer for new registrations
    enum: ['manufacturer', 'distributor', 'regulator', 'enduser'], 
  },
  organization: {
    type: String,
    required: true,
  },
  organizationCode: {
    type: String,
    required: true,
  },
  isOrgAdmin: {
    type: Boolean,
    default: false,
  },
  firstName: String,
  lastName: String,
  phoneNumber: String,
  address: String,
  city: String,
  country: String,
  notes: String,
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  registeredByOrg: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('user', userSchema);