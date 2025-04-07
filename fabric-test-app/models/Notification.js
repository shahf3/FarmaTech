const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  senderOrganization: {
    type: String,
    required: true
  },
  recipientOrganization: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedTo: {
    type: String,
    enum: ['Medicine', 'SupplyChain', 'General', 'Account'],
    default: 'General'
  },
  medicineId: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = Notification = mongoose.model('notification', NotificationSchema);