const mongoose = require('mongoose');

const SecurityIncidentSchema = new mongoose.Schema({
  medicineId: {
    type: String,
    required: true,
    index: true
  },
  medicineName: {
    type: String,
    required: true
  },
  batchNumber: {
    type: String,
    required: true
  },
  incidentType: {
    type: String,
    enum: ['unauthorized_scan', 'counterfeit_detected', 'expired_medicine', 'other'],
    default: 'unauthorized_scan'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  scanner: {
    userId: String,
    username: String,
    role: String,
    organization: String
  },
  details: {
    location: String,
    ipAddress: String,
    userAgent: String,
    notes: String
  },
  medicineStatus: {
    beforeIncident: String,
    afterIncident: String
  },
  flaggedInBlockchain: {
    type: Boolean,
    default: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('SecurityIncident', SecurityIncidentSchema);