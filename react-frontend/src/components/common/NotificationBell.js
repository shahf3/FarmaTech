import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, IconButton, Menu, MenuItem, Divider, Typography, Button, CircularProgress } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const API_URL = 'http://localhost:3000/api';

const NotificationBell = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const notificationsTimer = useRef(null);

  const fetchUnreadCount = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_URL}/notifications/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUnreadCount();
      
      // Set up polling for unread count
      notificationsTimer.current = setInterval(() => {
        fetchUnreadCount();
      }, 30000); // Check every 30 seconds
    }
    
    return () => {
      if (notificationsTimer.current) {
        clearInterval(notificationsTimer.current);
      }
    };
  }, [token]);

  const handleOpenMenu = (event) => {
    setMenuAnchor(event.currentTarget);
    fetchNotifications();
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const archiveNotification = async (id, event) => {
    event.stopPropagation();
    try {
      await axios.put(`${API_URL}/notifications/${id}/archive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif._id !== id));
      
      // If it was unread, update the count
      const wasUnread = notifications.find(n => n._id === id && !n.isRead);
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error archiving notification:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    handleCloseMenu();
    // Navigate to notifications page
    navigate(`/${user.role}/notifications`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const truncateMessage = (message, length = 80) => {
    if (!message) return '';
    if (message.length <= length) return message;
    return message.substring(0, length) + '...';
  };

  // Don't render if no user or token
  if (!user || !token) return null;

  return (
    <div>
      <IconButton
        color="inherit"
        onClick={handleOpenMenu}
        aria-label="notifications"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 360
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem sx={{ justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
          <Button
            size="small"
            color="primary"
            onClick={() => {
              handleCloseMenu();
              navigate(`/${user.role}/notifications`);
            }}
          >
            View All
          </Button>
        </MenuItem>
        
        <Divider />
        
        {loading ? (
          <MenuItem sx={{ justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 1.5,
                px: 2,
                bgcolor: notification.isRead ? 'transparent' : 'action.hover'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="subtitle2" fontWeight={notification.isRead ? 'normal' : 'bold'}>
                  {notification.subject}
                </Typography>
                <Button
                  size="small"
                  color="error"
                  onClick={(e) => archiveNotification(notification._id, e)}
                  sx={{ minWidth: 'unset', p: 0 }}
                >
                  ×
                </Button>
              </div>
              <Typography variant="body2" color="text.secondary">
                From: {notification.senderOrganization}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, width: '100%' }}>
                {truncateMessage(notification.message)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {formatDate(notification.createdAt)}
              </Typography>
            </MenuItem>
          ))
        )}
        
        {notifications.length > 5 && (
          <MenuItem 
            onClick={() => {
              handleCloseMenu();
              navigate(`/${user.role}/notifications`);
            }}
          >
            <Typography variant="body2" color="primary" sx={{ width: '100%', textAlign: 'center' }}>
              View all {notifications.length} notifications
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </div>
  );
};

export default NotificationBell;