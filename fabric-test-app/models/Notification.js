const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderOrganization: { type: String, required: true },
  recipientOrganization: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  relatedTo: { type: String, default: 'General' },
  medicineId: { type: String, default: null },
  isRead: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);