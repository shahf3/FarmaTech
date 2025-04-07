const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "a52a5afbcd94b6",
    pass: "7b6fdf8fa03cd1"
  }
});

// @route   POST api/notifications
// @desc    Create a new notification
// @access  Private
router.post(
  '/',
  [
    verifyToken,
    body('recipientId', 'Recipient ID is required').not().isEmpty(),
    body('subject', 'Subject is required').not().isEmpty(),
    body('message', 'Message is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { recipientId, subject, message, relatedTo, medicineId } = req.body;
      
      const sender = await User.findById(req.user.id);
      const recipient = await User.findById(recipientId);
      
      if (!sender || !recipient) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check permissions: Manufacturers can contact distributors they've registered, 
      // Distributors can contact manufacturers who registered them
      let authorized = false;
      
      if (sender.role === 'manufacturer' && recipient.role === 'distributor') {
        if (String(recipient.registeredBy) === String(sender._id)) {
          authorized = true;
        }
      } else if (sender.role === 'distributor' && recipient.role === 'manufacturer') {
        if (String(sender.registeredBy) === String(recipient._id)) {
          authorized = true;
        }
      }
      
      if (!authorized) {
        return res.status(403).json({ error: 'You are not authorized to message this user' });
      }
      
      const notification = new Notification({
        sender: sender._id,
        recipient: recipient._id,
        senderOrganization: sender.organization,
        recipientOrganization: recipient.organization,
        subject,
        message,
        relatedTo: relatedTo || 'General',
        medicineId: medicineId || null
      });
      
      await notification.save();
      
      // Send email notification
      try {
        const mailOptions = {
          from: 'notifications@farmatech.com',
          to: recipient.email,
          subject: `[FarmaTech] ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #2196f3;">New Message from ${sender.organization}</h2>
              
              <p>Dear ${recipient.firstName || recipient.username},</p>
              
              <p>You've received a new message from ${sender.organization}:</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Subject:</strong> ${subject}</p>
                <div style="white-space: pre-line;">${message}</div>
              </div>
              
              <p>Log in to your FarmaTech account to view and respond to this message.</p>
              
              <p><a href="http://localhost:3000/login" style="color: #2196f3;">Login to FarmaTech</a></p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="color: #757575; font-size: 12px;">
                  This message was sent from the FarmaTech platform by ${sender.organization}.
                </p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
      } catch (emailErr) {
        console.error('Error sending notification email:', emailErr);
      }
      
      res.json({
        success: true,
        notification
      });
      
    } catch (err) {
      console.error('Error creating notification:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// @route   GET api/notifications
// @desc    Get all notifications for the current user
// @access  Private
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      recipient: req.user.id,
      isArchived: false 
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'username organization');
    
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET api/notifications/unread
// @desc    Get count of unread notifications
// @access  Private
router.get('/unread', verifyToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user.id,
      isRead: false,
      isArchived: false
    });
    
    res.json({ unreadCount: count });
  } catch (err) {
    console.error('Error counting unread notifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    if (String(notification.recipient) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to update this notification' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT api/notifications/:id/archive
// @desc    Archive a notification
// @access  Private
router.put('/:id/archive', verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    if (String(notification.recipient) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to update this notification' });
    }
    
    notification.isArchived = true;
    await notification.save();
    
    res.json(notification);
  } catch (err) {
    console.error('Error archiving notification:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST api/notifications/reply/:id
// @desc    Reply to a notification
// @access  Private
router.post(
  '/reply/:id',
  [
    verifyToken,
    body('message', 'Message is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const originalNotification = await Notification.findById(req.params.id);
      
      if (!originalNotification) {
        return res.status(404).json({ error: 'Original notification not found' });
      }
      
      if (String(originalNotification.recipient) !== String(req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to reply to this notification' });
      }
      
      const sender = await User.findById(req.user.id);
      const recipient = await User.findById(originalNotification.sender);
      
      if (!sender || !recipient) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Create reply notification
      const replyNotification = new Notification({
        sender: sender._id,
        recipient: recipient._id,
        senderOrganization: sender.organization,
        recipientOrganization: recipient.organization,
        subject: `Re: ${originalNotification.subject}`,
        message: req.body.message,
        relatedTo: originalNotification.relatedTo,
        medicineId: originalNotification.medicineId
      });
      
      await replyNotification.save();
      
      // Mark original notification as read
      originalNotification.isRead = true;
      await originalNotification.save();
      
      // Send email
      try {
        const mailOptions = {
          from: 'notifications@farmatech.com',
          to: recipient.email,
          subject: `[FarmaTech] Re: ${originalNotification.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <h2 style="color: #2196f3;">New Reply from ${sender.organization}</h2>
              
              <p>Dear ${recipient.firstName || recipient.username},</p>
              
              <p>${sender.organization} has replied to your message:</p>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Subject:</strong> Re: ${originalNotification.subject}</p>
                <div style="white-space: pre-line;">${req.body.message}</div>
              </div>
              
              <p>Log in to your FarmaTech account to view the full conversation.</p>
              
              <p><a href="http://localhost:3000/login" style="color: #2196f3;">Login to FarmaTech</a></p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="color: #757575; font-size: 12px;">
                  This message was sent from the FarmaTech platform by ${sender.organization}.
                </p>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
      } catch (emailErr) {
        console.error('Error sending reply email:', emailErr);
      }
      
      res.json({
        success: true,
        notification: replyNotification
      });
      
    } catch (err) {
      console.error('Error creating reply notification:', err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;