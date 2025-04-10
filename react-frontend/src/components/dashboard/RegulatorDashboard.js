
import React, { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationForm from "./NotificationForm";
import Notifications from "./Notifications";
import "../../styles/Dashboard.css";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Divider,
  Container,
  useTheme,
  alpha,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import GavelIcon from "@mui/icons-material/Gavel";
import AssessmentIcon from "@mui/icons-material/Assessment";
import NotificationBell from "../common/NotificationBell";

const RegulatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    if (!user || user.role !== "regulator") {
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  const cardStyle = {
    height: "100%",
    borderRadius: 2,
    boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
    transition: "transform 0.2s, box-shadow 0.2s",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
    },
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const cardContentStyle = {
    padding: 3,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
  };

  const buttonStyle = {
    mt: "auto",
    py: 1.5,
    borderRadius: "8px",
    fontWeight: 600,
  };

  const sectionHeaderStyle = {
    mb: 2,
    display: "flex",
    alignItems: "center",
    fontSize: "1.25rem",
    fontWeight: 600,
    color: theme.palette.primary.main,
  };

  const paperStyle = {
    p: 4,
    borderRadius: 3,
    mb: 4,
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  };

  const DashboardCard = ({ title, description, icon, buttonText, onClick, color = "primary" }) => (
    <Card sx={cardStyle}>
      <Box 
        sx={{ 
          height: "8px", 
          backgroundColor: theme.palette[color].main 
        }} 
      />
      <CardContent sx={cardContentStyle}>
        <Box 
          sx={{ 
            display: "flex", 
            justifyContent: "center", 
            mb: 2 
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="h6"
          color={color}
          gutterBottom
          align="center"
          sx={{ fontWeight: 600 }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, lineHeight: 1.6 }}
          align="center"
        >
          {description}
        </Typography>
        <Button
          variant="contained"
          color={color}
          fullWidth
          sx={buttonStyle}
          onClick={onClick}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <Container maxWidth="lg">
          <Box 
            className="dashboard-header" 
            sx={{ 
              mb: 5, 
              mt: 3, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between" 
            }}
          >
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Regulator Dashboard
            </Typography>
            <NotificationBell />
          </Box>

          <Routes>
            <Route
              path="/"
              element={
                <Box sx={{ maxWidth: 1200, mx: "auto" }}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 4, 
                      mb: 5, 
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.primary.light, 0.1),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{ mb: 2, fontWeight: 600 }}
                    >
                      Welcome to the Regulator Dashboard
                    </Typography>
                    <Typography sx={{ color: "text.secondary" }}>
                      Oversee compliance, communicate with manufacturers, and generate regulatory reports.
                    </Typography>
                  </Paper>

                  {/* Compliance Management Section */}
                  <Paper sx={paperStyle}>
                    <Typography variant="h6" sx={sectionHeaderStyle}>
                      <GavelIcon sx={{ mr: 1.5 }} />
                      Compliance Management
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Monitor Compliance"
                          description="Review supply chain activities and ensure regulatory compliance."
                          icon={<GavelIcon fontSize="large" color="primary" />}
                          buttonText="Monitor Compliance"
                          onClick={() => navigate("/regulator/compliance")} 
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Generate Reports"
                          description="Generate detailed reports for regulatory oversight and audits."
                          icon={<AssessmentIcon fontSize="large" color="primary" />}
                          buttonText="Generate Reports"
                          onClick={() => navigate("/regulator/reports")} 
                        />
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Communications Section */}
                  <Paper sx={{ ...paperStyle, mb: 5 }}>
                    <Typography variant="h6" sx={sectionHeaderStyle}>
                      <EmailIcon sx={{ mr: 1.5 }} />
                      Communications
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Notifications"
                          description="View and manage communication with manufacturers."
                          icon={<EmailIcon fontSize="large" color="primary" />}
                          buttonText="View Notifications"
                          onClick={() => navigate("/regulator/notifications")}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <DashboardCard
                          title="Send Message"
                          description="Send messages and updates to manufacturers."
                          icon={<EmailIcon fontSize="large" color="primary" />}
                          buttonText="Send Message"
                          onClick={() => navigate("/regulator/send-message")}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>
              }
            />
            <Route path="notifications" element={<Notifications />} />
            <Route path="send-message" element={<NotificationForm />} />
            {/* Placeholder routes for future functionality */}
            <Route path="compliance" element={<div>Compliance Monitoring (TBD)</div>} />
            <Route path="reports" element={<div>Report Generation (TBD)</div>} />
          </Routes>
        </Container>
      </main>
    </div>
  );
};

export default RegulatorDashboard;