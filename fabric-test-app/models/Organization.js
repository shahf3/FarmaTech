const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['manufacturer', 'distributor', 'hospital', 'pharmacy', 'regulator'],
    required: true
  },
  description: {
    type: String
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  }],
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('organization', OrganizationSchema);