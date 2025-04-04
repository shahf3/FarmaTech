import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Paper,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import FactoryIcon from '@mui/icons-material/Factory';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import VerifiedIcon from '@mui/icons-material/Verified';
import StoreIcon from '@mui/icons-material/Store';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import HelpIcon from '@mui/icons-material/Help';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';

const StatusContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const statusColors = {
    'Manufactured': { bg: '#e3f2fd', color: '#1976d2', icon: <FactoryIcon fontSize="small" /> },
    'Quality Check': { bg: '#fff8e1', color: '#ff9800', icon: <VerifiedIcon fontSize="small" /> },
    'Dispatched': { bg: '#e8f5e9', color: '#388e3c', icon: <LocalShippingIcon fontSize="small" /> },
    'In Transit': { bg: '#e0f7fa', color: '#0097a7', icon: <LocalShippingIcon fontSize="small" /> },
    'Distributor': { bg: '#f3e5f5', color: '#7b1fa2', icon: <InventoryIcon fontSize="small" /> },
    'In Distribution': { bg: '#f3e5f5', color: '#7b1fa2', icon: <InventoryIcon fontSize="small" /> },
    'Regulator': { bg: '#fbe9e7', color: '#d84315', icon: <AccountBalanceIcon fontSize="small" /> },
    'Approved': { bg: '#e8f5e9', color: '#4caf50', icon: <CheckCircleIcon fontSize="small" /> },
    'Pharmacy': { bg: '#e1f5fe', color: '#03a9f4', icon: <StoreIcon fontSize="small" /> },
    'Dispensed': { bg: '#f5f5f5', color: '#607d8b', icon: <PersonIcon fontSize="small" /> },
    'Flagged': { bg: '#ffebee', color: '#f44336', icon: <WarningIcon fontSize="small" /> }
  };
  
  const defaultStatus = { bg: '#f5f5f5', color: '#9e9e9e', icon: <HelpIcon fontSize="small" /> };
  const statusStyle = statusColors[status] || defaultStatus;
  
  return {
    backgroundColor: statusStyle.bg,
    color: statusStyle.color,
    fontWeight: 500,
    borderRadius: '16px',
    padding: '4px 12px',
    '& .MuiChip-icon': {
      color: statusStyle.color
    }
  };
});

const MedicineStatus = ({ medicine }) => {
  if (!medicine) return null;
  
  const supplyChainSteps = [
    { label: 'Manufactured', description: 'Created by manufacturer' },
    { label: 'Quality Check', description: 'Inspection completed' },
    { label: 'Dispatched', description: 'Shipped from manufacturer' },
    { label: 'In Transit', description: 'On the way to distributor' },
    { label: 'In Distribution', description: 'Received by distributor' },
    { label: 'Regulator Check', description: 'Verified by regulator' },
    { label: 'Pharmacy', description: 'Received by pharmacy' },
    { label: 'Dispensed', description: 'Dispensed to patient' }
  ];

  // Find current step based on medicine status
  const getCurrentStepIndex = () => {
    const statusMap = {
      'Manufactured': 0,
      'Quality Check': 1,
      'Dispatched': 2,
      'In Transit': 3,
      'Distributor': 4,
      'In Distribution': 4,
      'Regulator': 5,
      'Approved': 5,
      'Pharmacy': 6,
      'Dispensed': 7,
      'Flagged': -1 // Special case
    };
    
    return statusMap[medicine.status] !== undefined ? statusMap[medicine.status] : 0;
  };
  
  const currentStep = getCurrentStepIndex();
  
  return (
    <StatusContainer elevation={0}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          Supply Chain Status
        </Typography>
        <StatusChip 
          label={medicine.status} 
          status={medicine.status}
          icon={
            (medicine.status === 'Manufactured') ? <FactoryIcon /> :
            (medicine.status === 'Dispatched' || medicine.status === 'In Transit') ? <LocalShippingIcon /> :
            (medicine.status === 'Distributor' || medicine.status === 'In Distribution') ? <InventoryIcon /> :
            (medicine.status === 'Regulator' || medicine.status === 'Approved') ? <AccountBalanceIcon /> :
            (medicine.status === 'Pharmacy') ? <StoreIcon /> :
            (medicine.status === 'Dispensed') ? <PersonIcon /> :
            (medicine.status === 'Flagged') ? <WarningIcon /> :
            <HelpIcon />
          }
        />
      </Box>
      
      {medicine.flagged ? (
        <Box sx={{ p: 2, bgcolor: '#ffebee', borderRadius: 2, mb: 3 }}>
          <Typography color="error" variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1 }} fontSize="small" />
            This medicine has been flagged: {medicine.flagNotes}
          </Typography>
        </Box>
      ) : null}
      
      <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 4 }}>
        {supplyChainSteps.map((step, index) => (
          <Step key={step.label} completed={currentStep >= index && currentStep !== -1}>
            <StepLabel>
              <Typography variant="caption">{step.label}</Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
        Supply Chain Timeline
      </Typography>
      
      <Timeline position="alternate" sx={{ p: 0, m: 0 }}>
        {medicine.supplyChain && medicine.supplyChain.map((event, index) => (
          <TimelineItem key={index}>
            <TimelineOppositeContent color="text.secondary" sx={{ maxWidth: '150px' }}>
              {new Date(event.timestamp).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color={event.status === 'Flagged' ? 'error' : 
                          event.status === 'Manufactured' ? 'primary' :
                          event.status === 'Quality Check' ? 'warning' :
                          event.status === 'Dispensed' ? 'success' : 'grey'}>
                {event.status === 'Manufactured' && <FactoryIcon fontSize="small" />}
                {event.status === 'Quality Check' && <VerifiedIcon fontSize="small" />}
                {(event.status === 'Dispatched' || event.status === 'In Transit') && <LocalShippingIcon fontSize="small" />}
                {(event.status === 'Distributor' || event.status === 'In Distribution') && <InventoryIcon fontSize="small" />}
                {(event.status === 'Regulator' || event.status === 'Approved') && <AccountBalanceIcon fontSize="small" />}
                {event.status === 'Pharmacy' && <StoreIcon fontSize="small" />}
                {event.status === 'Dispensed' && <PersonIcon fontSize="small" />}
                {event.status === 'Flagged' && <WarningIcon fontSize="small" />}
                {event.status === 'Scanned' && <VerifiedIcon fontSize="small" />}
              </TimelineDot>
              {index < medicine.supplyChain.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography variant="subtitle2" component="span">
                  {event.status}
                </Typography>
                <Typography variant="body2">
                  By: {event.handler}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Location: {event.location}
                </Typography>
                {event.notes && (
                  <Typography variant="caption" display="block" color="text.secondary">
                    {event.notes}
                  </Typography>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </StatusContainer>
  );
};

export default MedicineStatus;