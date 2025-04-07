import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import ReplyIcon from "@mui/icons-material/Reply";
import DeleteIcon from "@mui/icons-material/Delete";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import "../../styles/Dashboard.css";

const API_URL = "http://localhost:3000/api";

const Notifications = () => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
      setError(null);
    } catch (err) {
      setError("Error loading notifications. Please try again.");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(
        `${API_URL}/notifications/${id}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const archiveNotification = async (id) => {
    try {
      await axios.put(
        `${API_URL}/notifications/${id}/archive`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local state by removing the archived notification
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
    } catch (error) {
      console.error("Error archiving notification:", error);
    }
  };

  const handleOpenReplyDialog = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setSelectedNotification(notification);
    setReplyDialogOpen(true);
  };

  const handleCloseReplyDialog = () => {
    setReplyDialogOpen(false);
    setReplyMessage("");
    setSelectedNotification(null);
  };

  const handleReplySubmit = async () => {
    if (!replyMessage.trim() || !selectedNotification) return;

    setSending(true);
    try {
      await axios.post(
        `${API_URL}/notifications/reply/${selectedNotification._id}`,
        { message: replyMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Reply sent successfully!");
      setTimeout(() => {
        setSuccess("");
        handleCloseReplyDialog();
      }, 2000);
    } catch (error) {
      console.error("Error sending reply:", error);
      setError("Failed to send reply. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredNotifications = notifications.filter((notification) => {
    // 0 = All, 1 = Unread
    if (tabValue === 1) {
      return !notification.isRead;
    }
    return true;
  });

  return (
    <div className="dashboard-section">
      <Box className="section-header" sx={{ mb: 2 }}>
        <Typography variant="h4" component="h2">
          Notifications
        </Typography>
      </Box>

      <Paper sx={{ p: 0, mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="All" />
          <Tab label="Unread" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: "center", color: "error.main" }}>
            {error}
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography>No notifications to display</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredNotifications.map((notification) => (
              <Accordion
                key={notification._id}
                disableGutters
                elevation={0}
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  backgroundColor: notification.isRead
                    ? "background.paper"
                    : "action.hover",
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  onClick={() =>
                    !notification.isRead && markAsRead(notification._id)
                  }
                  sx={{ px: 2 }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: notification.isRead
                          ? "transparent"
                          : "primary.main",
                        mr: 2,
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={notification.isRead ? "normal" : "bold"}
                      >
                        {notification.subject}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        From: {notification.senderOrganization} •{" "}
                        {formatDate(notification.createdAt)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", gap: 1 }}>
                      {!notification.isRead && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          title="Mark as read"
                        >
                          <MarkEmailReadIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReplyDialog(notification);
                        }}
                        title="Reply"
                      >
                        <ReplyIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveNotification(notification._id);
                        }}
                        title="Delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails
                  sx={{ px: 3, py: 2, backgroundColor: "background.paper" }}
                >
                  <Typography
                    variant="body1"
                    sx={{ whiteSpace: "pre-line", mb: 2 }}
                  >
                    {notification.message}
                  </Typography>

                  {notification.medicineId && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1,
                        bgcolor: "background.default",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        <strong>Related to medicine:</strong>{" "}
                        {notification.medicineId}
                      </Typography>
                    </Box>
                  )}

                  <Box
                    sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<ReplyIcon />}
                      onClick={() => handleOpenReplyDialog(notification)}
                    >
                      Reply
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </List>
        )}
      </Paper>

      {/* Reply Dialog */}
      <Dialog
        open={replyDialogOpen}
        onClose={handleCloseReplyDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Reply to {selectedNotification?.senderOrganization}
            <IconButton onClick={handleCloseReplyDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Original message:
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {selectedNotification.subject}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    backgroundColor: "background.default",
                    p: 2,
                    borderRadius: 1,
                    whiteSpace: "pre-line",
                  }}
                >
                  {selectedNotification.message}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <TextField
                autoFocus
                label="Your reply"
                fullWidth
                multiline
                rows={4}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                variant="outlined"
                margin="normal"
              />

              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}

              {success && (
                <Typography color="success.main" variant="body2" sx={{ mt: 1 }}>
                  {success}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReplyDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleReplySubmit}
            color="primary"
            variant="contained"
            disabled={!replyMessage.trim() || sending}
            startIcon={sending ? <CircularProgress size={20} /> : <ReplyIcon />}
          >
            {sending ? "Sending..." : "Send Reply"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Notifications;
