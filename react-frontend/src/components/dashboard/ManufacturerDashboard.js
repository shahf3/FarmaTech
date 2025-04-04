// src/components/dashboard/ManufacturerDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RegisterNewMedicine from './RegisterNewMedicine';
import ViewRegisteredMedicines from './ViewRegisteredMedicines';
import RegisterDistributor from './RegisterDistributor';
import ManageDistributors from './ManageDistributors';
import '../../styles/Dashboard.css';
import { Box, Button, Card, CardContent, Typography, Grid, Paper, Divider } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import MedicationIcon from '@mui/icons-material/Medication';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import UpdateIcon from '@mui/icons-material/Update';

const ManufacturerDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user || user.role !== 'manufacturer') {
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  return (
    <div className="dashboard-container">
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Manufacturer Dashboard</h1>
        </div>
        <Routes>
          <Route
            path="/"
            element={
              <div className="dashboard-section">
                <h2>Welcome to the Manufacturer Dashboard</h2>
                <p>Navigate to different sections of your dashboard using the sidebar:</p>
                
                <Grid container spacing={3} sx={{ mt: 2 }}>
                  {/* Medicine Management Section */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <MedicationIcon sx={{ mr: 1, color: 'primary.main' }} />
                        Medicine Management
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" color="primary" gutterBottom>
                                Medicine Registration
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Register new medicines in the blockchain and generate secure QR codes for tracking.
                              </Typography>
                              <Button 
                                variant="contained" 
                                fullWidth
                                onClick={() => navigate('/manufacturer/register')}
                              >
                                Register Medicine
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" color="primary" gutterBottom>
                                View Medicines
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                View and manage your registered medicines, generate QR codes for tracking.
                              </Typography>
                              <Button 
                                variant="contained" 
                                fullWidth
                                onClick={() => navigate('/manufacturer/view')}
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
                    <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <LocalShippingIcon sx={{ mr: 1, color: 'primary.main' }} />
                        Supply Chain Management
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" color="primary" gutterBottom>
                                Scan QR Code
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Scan medicine QR codes to verify authenticity and update supply chain status.
                              </Typography>
                              <Button 
                                variant="contained" 
                                fullWidth
                                startIcon={<QrCodeScannerIcon />}
                                onClick={() => navigate('/scan-medicine')}
                              >
                                Scan Medicine
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" color="primary" gutterBottom>
                                Update Status
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Update the supply chain status of medicines in your inventory.
                              </Typography>
                              <Button 
                                variant="contained" 
                                fullWidth
                                startIcon={<UpdateIcon />}
                                onClick={() => navigate('/manufacturer/view')}
                              >
                                View & Update
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" color="error" gutterBottom>
                                Flag Issues
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Flag medicines with quality or authenticity issues in the blockchain.
                              </Typography>
                              <Button 
                                variant="contained" 
                                color="error"
                                fullWidth
                                startIcon={<WarningIcon />}
                                onClick={() => navigate('/manufacturer/view')}
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
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon sx={{ mr: 1, color: 'primary.main' }} />
                        Distributor Management
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" color="primary" gutterBottom>
                                Register Distributor
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Register new distributors to your network of authorized partners.
                              </Typography>
                              <Button 
                                variant="contained" 
                                fullWidth
                                startIcon={<PersonAddIcon />}
                                onClick={() => navigate('/manufacturer/register-distributor')}
                              >
                                Register Distributor
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                            <CardContent>
                              <Typography variant="h6" color="primary" gutterBottom>
                                Manage Distributors
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                View and manage your network of authorized distributors.
                              </Typography>
                              <Button 
                                variant="contained" 
                                fullWidth
                                startIcon={<PeopleIcon />}
                                onClick={() => navigate('/manufacturer/manage-distributors')}
                              >
                                Manage Distributors
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </div>
            }
          />
          <Route path="register" element={<RegisterNewMedicine />} />
          <Route path="view" element={<ViewRegisteredMedicines />} />
          <Route path="register-distributor" element={<RegisterDistributor />} />
          <Route path="manage-distributors" element={<ManageDistributors />} />
        </Routes>
      </main>
    </div>
  );
};

export default ManufacturerDashboard;