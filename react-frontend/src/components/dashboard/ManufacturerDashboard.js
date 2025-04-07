// src/components/dashboard/ManufacturerDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import RegisterNewMedicine from "./RegisterNewMedicine";
import ViewRegisteredMedicines from "./ViewRegisteredMedicines";
import RegisterDistributor from "./RegisterDistributor";
import ManageDistributors from "./ManageDistributors";
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
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import MedicationIcon from "@mui/icons-material/Medication";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PeopleIcon from "@mui/icons-material/People";
import WarningIcon from "@mui/icons-material/Warning";
import UpdateIcon from "@mui/icons-material/Update";
import NotificationBell from "../common/NotificationBell";
import EmailIcon from "@mui/icons-material/Email";
import Notifications from "./Notifications";
import NotificationForm from "./NotificationForm";

const ManufacturerDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "manufacturer") {
      navigate("/unauthorized");
    }
  }, [user, navigate]);

  const cardStyle = {
    height: "100%",
    borderRadius: 2,
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
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
  };

  const sectionHeaderStyle = {
    mb: 2,
    display: "flex",
    alignItems: "center",
    fontSize: "1.25rem",
    fontWeight: 600,
  };

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <Box className="dashboard-header" sx={{ mb: 4, textAlign: "center" }}>
          <Typography variant="h4" component="h1">
            Manufacturer Dashboard
          </Typography>
          <NotificationBell />
        </Box>
        <Routes>
          <Route
            path="/"
            element={
              <Box
                className="dashboard-section"
                sx={{ maxWidth: 1200, mx: "auto", px: 2 }}
              >
                <Typography
                  variant="h5"
                  component="h2"
                  sx={{ mb: 2, textAlign: "center" }}
                >
                  Welcome to the Manufacturer Dashboard
                </Typography>
                <Typography sx={{ mb: 4, textAlign: "center" }}>
                  Navigate to different sections of your dashboard using the
                  cards below:
                </Typography>

                <Grid container spacing={4}>
                  {/* Medicine Management Section */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                      <Typography variant="h6" sx={sectionHeaderStyle}>
                        <MedicationIcon sx={{ mr: 1, color: "primary.main" }} />
                        Medicine Management
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Card sx={cardStyle}>
                            <CardContent sx={cardContentStyle}>
                              <Typography
                                variant="h6"
                                color="primary"
                                gutterBottom
                                align="center"
                              >
                                Medicine Registration
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                                align="center"
                              >
                                Register new medicines in the blockchain and
                                generate secure QR codes for tracking.
                              </Typography>
                              <Button
                                variant="contained"
                                fullWidth
                                sx={buttonStyle}
                                onClick={() =>
                                  navigate("/manufacturer/register")
                                }
                              >
                                Register Medicine
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Card sx={cardStyle}>
                            <CardContent sx={cardContentStyle}>
                              <Typography
                                variant="h6"
                                color="primary"
                                gutterBottom
                                align="center"
                              >
                                View Medicines
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                                align="center"
                              >
                                View and manage your registered medicines,
                                generate QR codes for tracking.
                              </Typography>
                              <Button
                                variant="contained"
                                fullWidth
                                sx={buttonStyle}
                                onClick={() => navigate("/manufacturer/view")}
                              >
                                View Medicines
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Supply Chain Management Section */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
                      <Typography variant="h6" sx={sectionHeaderStyle}>
                        <LocalShippingIcon
                          sx={{ mr: 1, color: "primary.main" }}
                        />
                        Supply Chain Management
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                          <Card sx={cardStyle}>
                            <CardContent sx={cardContentStyle}>
                              <Typography
                                variant="h6"
                                color="primary"
                                gutterBottom
                                align="center"
                              >
                                Scan QR Code
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                                align="center"
                              >
                                Scan medicine QR codes to verify authenticity
                                and update supply chain status.
                              </Typography>
                              <Button
                                variant="contained"
                                fullWidth
                                sx={buttonStyle}
                                startIcon={<QrCodeScannerIcon />}
                                onClick={() => navigate("/scan-medicine")}
                              >
                                Scan Medicine
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Card sx={cardStyle}>
                            <CardContent sx={cardContentStyle}>
                              <Typography
                                variant="h6"
                                color="primary"
                                gutterBottom
                                align="center"
                              >
                                Update Status
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                                align="center"
                              >
                                Update the supply chain status of medicines in
                                your inventory.
                              </Typography>
                              <Button
                                variant="contained"
                                fullWidth
                                sx={buttonStyle}
                                startIcon={<UpdateIcon />}
                                onClick={() => navigate("/manufacturer/view")}
                              >
                                View & Update
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Card sx={cardStyle}>
                            <CardContent sx={cardContentStyle}>
                              <Typography
                                variant="h6"
                                color="error"
                                gutterBottom
                                align="center"
                              >
                                Flag Issues
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                                align="center"
                              >
                                Flag medicines with quality or authenticity
                                issues in the blockchain.
                              </Typography>
                              <Button
                                variant="contained"
                                color="error"
                                fullWidth
                                sx={buttonStyle}
                                startIcon={<WarningIcon />}
                                onClick={() => navigate("/manufacturer/view")}
                              >
                                View & Flag
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Distributor Management Section */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="h6" sx={sectionHeaderStyle}>
                        <PeopleIcon sx={{ mr: 1, color: "primary.main" }} />
                        Distributor Management
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Card sx={cardStyle}>
                            <CardContent sx={cardContentStyle}>
                              <Typography
                                variant="h6"
                                color="primary"
                                gutterBottom
                                align="center"
                              >
                                Register Distributor
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                                align="center"
                              >
                                Register new distributors to your network of
                                authorized partners.
                              </Typography>
                              <Button
                                variant="contained"
                                fullWidth
                                sx={buttonStyle}
                                startIcon={<PersonAddIcon />}
                                onClick={() =>
                                  navigate("/manufacturer/register-distributor")
                                }
                              >
                                Register Distributor
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Card sx={cardStyle}>
                            <CardContent sx={cardContentStyle}>
                              <Typography
                                variant="h6"
                                color="primary"
                                gutterBottom
                                align="center"
                              >
                                Manage Distributors
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                                align="center"
                              >
                                View and manage your network of authorized
                                distributors.
                              </Typography>
                              <Button
                                variant="contained"
                                fullWidth
                                sx={buttonStyle}
                                startIcon={<PeopleIcon />}
                                onClick={() =>
                                  navigate("/manufacturer/manage-distributors")
                                }
                              >
                                Manage Distributors
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Communications Section */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="h6" sx={sectionHeaderStyle}>
                        <EmailIcon sx={{ mr: 1, color: "primary.main" }} />
                        Communications
                      </Typography>
                      <Divider sx={{ mb: 3 }} />
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <Card sx={cardStyle}>
                            <CardContent sx={cardContentStyle}>
                              <Typography
                                variant="h6"
                                color="primary"
                                gutterBottom
                                align="center"
                              >
                                Notifications
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                                align="center"
                              >
                                View and manage communication with your
                                distributors.
                              </Typography>
                              <Button
                                variant="contained"
                                fullWidth
                                sx={buttonStyle}
                                onClick={() =>
                                  navigate("/manufacturer/notifications")
                                }
                              >
                                View Notifications
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Card sx={cardStyle}>
                            <CardContent sx={cardContentStyle}>
                              <Typography
                                variant="h6"
                                color="primary"
                                gutterBottom
                                align="center"
                              >
                                Send Message
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                                align="center"
                              >
                                Send messages and updates to your distributors.
                              </Typography>
                              <Button
                                variant="contained"
                                fullWidth
                                sx={buttonStyle}
                                onClick={() =>
                                  navigate("/manufacturer/send-message")
                                }
                              >
                                Send Message
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            }
          />
          <Route path="register" element={<RegisterNewMedicine />} />
          <Route path="view" element={<ViewRegisteredMedicines />} />
          <Route
            path="register-distributor"
            element={<RegisterDistributor />}
          />
          <Route path="manage-distributors" element={<ManageDistributors />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="send-message" element={<NotificationForm />} />
        </Routes>
      </main>
    </div>
  );
};

export default ManufacturerDashboard;
