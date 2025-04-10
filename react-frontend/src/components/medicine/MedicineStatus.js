import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent, 
  Divider, 
  Chip, 
  Grid, 
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FactoryIcon from '@mui/icons-material/Factory';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VerifiedIcon from '@mui/icons-material/Verified';
import MedicationIcon from '@mui/icons-material/Medication';
import WarningIcon from '@mui/icons-material/Warning';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const StyledStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 40,
  height: 40,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundColor: theme.palette.primary.main,
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundColor: theme.palette.success.main,
  }),
  ...(ownerState.flagged && {
    backgroundColor: theme.palette.error.main,
  }),
}));

const StepperContainer = styled(Box)(({ theme }) => ({
  overflowX: 'auto',
  padding: theme.spacing(2),
  '&::-webkit-scrollbar': {
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#c1c1c1',
    borderRadius: '10px',
  }
}));

const getStatusColor = (status) => {
  const statusColors = {
    'Manufactured': '#4caf50',
    'Quality Check': '#fb8c00',
    'Dispatched': '#3f51b5',
    'In Transit': '#9c27b0',
    'Distributor': '#00acc1',
    'In Distribution': '#5c6bc0',
    'Regulator': '#7cb342',
    'Approved': '#43a047',
    'Pharmacy': '#26a69a',
    'Dispensed': '#8bc34a',
    'Flagged': '#f44336'
  };
  
  return statusColors[status] || '#757575';
};

const getStatusIcon = (status) => {
  switch(status) {
    case 'Manufactured':
      return <FactoryIcon />;
    case 'Quality Check':
      return <AssignmentTurnedInIcon />;
    case 'Dispatched':
    case 'In Transit':
      return <LocalShippingIcon />;
    case 'Distributor':
    case 'In Distribution':
      return <InventoryIcon />;
    case 'Regulator':
      return <AdminPanelSettingsIcon />;
    case 'Approved':
      return <VerifiedIcon />;
    case 'Pharmacy':
    case 'Dispensed':
      return <MedicationIcon />;
    case 'Flagged':
      return <WarningIcon />;
    default:
      return <FactoryIcon />;
  }
};

// Custom Step Icon Component
function CustomStepIcon(props) {
  const { active, completed, icon, status, flagged } = props;
  
  return (
    <StyledStepIconRoot ownerState={{ active, completed, flagged }}>
      {getStatusIcon(status)}
    </StyledStepIconRoot>
  );
}

const MedicineStatus = ({ medicine }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [statusStages, setStatusStages] = useState([]);
  
  useEffect(() => {
    if (medicine) {
      // Generate status stages based on assigned distributors
      generateStatusStages();
    }
  }, [medicine]);
  
  const generateStatusStages = () => {
    // Base status flow
    let stages = [
      'Manufactured',
      'Quality Check',
      'Dispatched'
    ];
    
    const numDistributors = medicine.assignedDistributors ? medicine.assignedDistributors.length : 0;
    
    if (numDistributors > 0) {
      // Add transit and distributor stages for each assigned distributor
      for (let i = 0; i < numDistributors; i++) {
        stages.push('In Transit');
        stages.push('Distributor');
        
        // Only add distribution for non-final distributors
        if (i < numDistributors - 1) {
          stages.push('In Distribution');
        }
      }
      
      // Add final stages
      stages = stages.concat([
        'In Distribution',
        'Regulator',
        'Approved',
        'Pharmacy',
        'Dispensed'
      ]);
    } else {
      // Default stages if no distributors assigned
      stages = stages.concat([
        'In Transit',
        'Distributor',
        'In Distribution',
        'Regulator',
        'Approved',
        'Pharmacy',
        'Dispensed'
      ]);
    }
    
    // If medicine is flagged, handle special case
    if (medicine.status === 'Flagged') {
      const currentIndex = stages.indexOf(medicine.status);
      if (currentIndex === -1) {
        // If current status not in flow, add flagged to the end
        stages.push('Flagged');
      }
    }
    
    setStatusStages(stages);
  };
  
  const getActiveStep = () => {
    if (!medicine) return 0;
    const currentStatusIndex = statusStages.indexOf(medicine.status);
    return currentStatusIndex === -1 ? 0 : currentStatusIndex;
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Find relevant event for a status
  const findRelevantEvent = (status, distributorIndex = 0) => {
    if (!medicine || !medicine.supplyChain) return null;
    
    const relevantEvents = medicine.supplyChain.filter(event => event.status === status);
    
    if (status === 'In Transit' || status === 'Distributor') {
      // For stages that repeat per distributor, return event based on distributor index
      return relevantEvents.length > distributorIndex ? relevantEvents[distributorIndex] : null;
    }
    
    // For non-repeating stages, return the latest event with that status
    return relevantEvents.length > 0 ? relevantEvents[relevantEvents.length - 1] : null;
  };
  
  const getCurrentDistributorName = (index) => {
    if (!medicine || !medicine.assignedDistributors || medicine.assignedDistributors.length === 0) {
      return "Unknown Distributor";
    }
    
    if (index >= medicine.assignedDistributors.length) {
      index = medicine.assignedDistributors.length - 1;
    }
    
    return medicine.assignedDistributors[index];
  };
  
  if (!medicine) {
    return <Typography>No medicine data available</Typography>;
  }
  
  return (
    <Paper sx={{ p: 3, borderRadius: '12px', mb: 3 }}>
      <Typography variant="h6" gutterBottom fontWeight="600">
        Medicine Supply Chain Status
      </Typography>
      
      {medicine.assignedDistributors && medicine.assignedDistributors.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Route with {medicine.assignedDistributors.length} Distributor{medicine.assignedDistributors.length > 1 ? 's' : ''}
          </Typography>
          <Typography variant="body2">
            {medicine.assignedDistributors.join(' → ')}
          </Typography>
        </Box>
      )}
      
      <StepperContainer>
        <Stepper 
          activeStep={getActiveStep()} 
          alternativeLabel
          sx={{ minWidth: medicine.assignedDistributors && medicine.assignedDistributors.length > 2 ? '1000px' : 'auto' }}
        >
          {statusStages.map((label, index) => {
            // Determine if this is a distributor-related step and which distributor it belongs to
            const isDistributorStep = label === 'Distributor' || label === 'In Transit';
            let distributorIndex = 0;
            
            if (isDistributorStep) {
              // Count how many times this stage has appeared before
              distributorIndex = statusStages.slice(0, index).filter(stage => stage === label).length;
            }
            
            // Find corresponding event
            const event = findRelevantEvent(label, distributorIndex);
            
            // Determine if step is active, completed, or flagged
            const stepActive = index === getActiveStep();
            const stepCompleted = index < getActiveStep();
            const stepFlagged = label === 'Flagged';
            
            return (
              <Step key={`${label}-${index}`}>
                <StepLabel 
                  StepIconComponent={(props) => 
                    <CustomStepIcon 
                      {...props} 
                      status={label} 
                      flagged={stepFlagged}
                    />
                  }
                >
                  <Typography variant="body2" fontWeight={stepActive ? 600 : 400}>
                    {label}
                    {isDistributorStep && label === 'Distributor' && medicine.assignedDistributors && medicine.assignedDistributors.length > 0 && (
                      <Tooltip title={`Handled by: ${getCurrentDistributorName(distributorIndex)}`}>
                        <Typography component="span" variant="caption" sx={{ ml: 0.5, color: 'text.secondary' }}>
                          {` (${distributorIndex + 1})`}
                        </Typography>
                      </Tooltip>
                    )}
                  </Typography>
                  {event && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {formatDate(event.timestamp)}
                    </Typography>
                  )}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </StepperContainer>
      
      <Divider sx={{ my: 3 }} />
      
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="600">
            Supply Chain History
          </Typography>
          <IconButton onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={showHistory}>
          {medicine.supplyChain && medicine.supplyChain.length > 0 ? (
            <Box>
              {medicine.supplyChain.map((event, index) => (
                <Paper 
                  key={index} 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    borderLeft: `4px solid ${getStatusColor(event.status)}`,
                    bgcolor: event.status === 'Flagged' ? 'rgba(244, 67, 54, 0.05)' : 'background.paper'
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          bgcolor: getStatusColor(event.status), 
                          color: 'white', 
                          width: 32, 
                          height: 32, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          borderRadius: '50%',
                          mr: 1
                        }}
                      >
                        {getStatusIcon(event.status)}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {event.status}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(event.timestamp)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Handler:</strong> {event.handler || 'Unknown'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>Location:</strong> {event.location || 'Unknown location'}
                        </Typography>
                      </Grid>
                      {event.notes && (
                        <Grid item xs={12}>
                          <Typography variant="body2">
                            <strong>Notes:</strong> {event.notes}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
              No supply chain history available yet.
            </Typography>
          )}
        </Collapse>
      </Box>
    </Paper>
  );
};

export default MedicineStatus;