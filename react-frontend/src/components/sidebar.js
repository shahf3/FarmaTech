// src/components/Sidebar.js
import React, { useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  ListSubheader, 
  Collapse,
  Divider,
  Box,
  Typography,
  Avatar,
  Tooltip,
  useTheme as useMuiTheme
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MenuIcon from '@mui/icons-material/Menu';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonIcon from '@mui/icons-material/Person';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import StorageIcon from '@mui/icons-material/Storage';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import MedicationIcon from '@mui/icons-material/Medication';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import AssignmentIcon from '@mui/icons-material/Assignment';

function Sidebar() {
  const { user, logout } = useAuth();
  const { themeMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  
  const [sections, setSections] = useState({
    manufacturer: false,
    distributor: false,
    regulator: false,
    endUser: false
  });

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const toggleSection = (section) => {
    setSections({
      ...sections,
      [section]: !sections[section]
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toggleDrawer();
  };

  const getInitial = () => {
    return user?.username ? user.username.charAt(0).toUpperCase() : 'U';
  };

  const getRoleColor = () => {
    switch(user?.role) {
      case 'manufacturer': return '#4caf50';
      case 'distributor': return '#2196f3';
      case 'regulator': return '#ff9800';
      case 'enduser': return '#9c27b0';
      default: return '#757575';
    }
  };

  const NestedListItem = ({ to, icon, primary, onClick }) => (
    <ListItem
      button
      component={Link}
      to={to}
      onClick={onClick || toggleDrawer}
      sx={{ 
        pl: 4, 
        borderRadius: '0 20px 20px 0',
        mx: 1,
        my: 0.5,
        '&:hover': {
          backgroundColor: themeMode === 'light' 
            ? 'rgba(0, 0, 0, 0.04)' 
            : 'rgba(255, 255, 255, 0.08)'
        }
      }}
    >
      <ListItemIcon sx={{ minWidth: '40px' }}>
        {icon}
      </ListItemIcon>
      <ListItemText 
        primary={primary} 
        primaryTypographyProps={{ 
          fontSize: '0.9rem',
          fontWeight: 500
        }} 
      />
    </ListItem>
  );

  return (
    <>
      <Tooltip title="Open Menu">
        <IconButton 
          onClick={toggleDrawer} 
          color="inherit" 
          aria-label="menu"
          sx={{ 
            position: 'fixed', 
            top: '16px', 
            left: '16px', 
            zIndex: 1200,
            backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(18, 18, 18, 0.8)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            '&:hover': {
              backgroundColor: themeMode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 30, 30, 0.9)',
            }
          }}
        >
          <MenuIcon />
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            borderTopRightRadius: '16px',
            borderBottomRightRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            background: themeMode === 'light' 
              ? 'linear-gradient(to bottom, #ffffff, #f8f9fa)' 
              : 'linear-gradient(to bottom, #121212, #1e1e1e)'
          },
        }}
      >
        <Box 
          sx={{ 
            p: 3, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            borderBottom: `1px solid ${themeMode === 'light' ? '#e0e0e0' : '#333'}`
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <MedicationIcon sx={{ fontSize: 28, mr: 1, color: getRoleColor() }} />
            <Typography variant="h5" fontWeight="bold">
              FarmaTech
            </Typography>
          </Box>
          
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Avatar 
                sx={{ 
                  bgcolor: getRoleColor(),
                  width: 40,
                  height: 40,
                  mr: 2
                }}
              >
                {getInitial()}
              </Avatar>
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {user.username}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.75rem'
                  }}
                >
                  <Box 
                    component="span" 
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      bgcolor: getRoleColor(),
                      mr: 0.5,
                      display: 'inline-block'
                    }} 
                  />
                  {user.role} | {user.organization}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        <List sx={{ pt: 1, pb: 1 }}>
          <ListItem 
            button 
            onClick={toggleTheme}
            sx={{ 
              borderRadius: '0 20px 20px 0',
              mx: 1,
              my: 0.5,
              '&:hover': {
                backgroundColor: themeMode === 'light' 
                  ? 'rgba(0, 0, 0, 0.04)' 
                  : 'rgba(255, 255, 255, 0.08)'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: '40px' }}>
              {themeMode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
            </ListItemIcon>
            <ListItemText 
              primary={themeMode === 'light' ? 'Dark Mode' : 'Light Mode'} 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItem>

          <ListItem 
            button 
            component={Link} 
            to="/dashboard" 
            onClick={toggleDrawer}
            sx={{ 
              borderRadius: '0 20px 20px 0',
              mx: 1,
              my: 0.5,
              backgroundColor: window.location.pathname === '/dashboard' 
                ? (themeMode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)')
                : 'transparent',
              '&:hover': {
                backgroundColor: themeMode === 'light' 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.12)'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: '40px' }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Dashboard" 
              primaryTypographyProps={{ fontWeight: 600 }}
            />
          </ListItem>

          <Divider sx={{ my: 1.5 }} />

          {user?.role === 'manufacturer' && (
            <>
              <ListSubheader 
                sx={{ 
                  bgcolor: 'transparent', 
                  color: themeMode === 'light' ? 'text.secondary' : 'text.primary',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  fontWeight: 700,
                  lineHeight: '1.5rem'
                }}
              >
                MANUFACTURER
              </ListSubheader>
              <ListItem 
                button 
                onClick={() => toggleSection('manufacturer')}
                sx={{ 
                  borderRadius: '0 20px 20px 0',
                  mx: 1,
                  my: 0.5,
                  '&:hover': {
                    backgroundColor: themeMode === 'light' 
                      ? 'rgba(0, 0, 0, 0.04)' 
                      : 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <BusinessIcon sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Manufacturer" 
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                {sections.manufacturer ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={sections.manufacturer} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <NestedListItem
                    to="/manufacturer/register"
                    icon={<AddCircleIcon color="success" />}
                    primary="Register New Medicine"
                  />
                  <NestedListItem
                    to="/manufacturer/view"
                    icon={<ListAltIcon />}
                    primary="View Registered Medicines"
                  />
                </List>
              </Collapse>
            </>
          )}

          {user?.role === 'distributor' && (
            <>
              <ListSubheader 
                sx={{ 
                  bgcolor: 'transparent', 
                  color: themeMode === 'light' ? 'text.secondary' : 'text.primary',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  fontWeight: 700,
                  lineHeight: '1.5rem'
                }}
              >
                DISTRIBUTOR
              </ListSubheader>
              <ListItem 
                button 
                onClick={() => toggleSection('distributor')}
                sx={{ 
                  borderRadius: '0 20px 20px 0',
                  mx: 1,
                  my: 0.5,
                  '&:hover': {
                    backgroundColor: themeMode === 'light' 
                      ? 'rgba(0, 0, 0, 0.04)' 
                      : 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <LocalShippingIcon sx={{ color: '#2196f3' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Distributor" 
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                {sections.distributor ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={sections.distributor} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <NestedListItem
                    to="/distributor/scan"
                    icon={<QrCodeScannerIcon color="info" />}
                    primary="Scan QR Code"
                  />
                  <NestedListItem
                    to="/distributor/inventory"
                    icon={<ListAltIcon />}
                    primary="Medicines in Inventory"
                  />
                  <NestedListItem
                    to="/distributor/contact-order"
                    icon={<ContactMailIcon />}
                    primary="Contact & Order"
                  />
                </List>
              </Collapse>
            </>
          )}



{user?.role === 'regulator' && (
  <>
    <ListSubheader 
      sx={{ 
        bgcolor: 'transparent', 
        color: themeMode === 'light' ? 'text.secondary' : 'text.primary',
        fontSize: '0.75rem',
        letterSpacing: '0.5px',
        fontWeight: 700,
        lineHeight: '1.5rem'
      }}
    >
      REGULATOR
    </ListSubheader>
    <ListItem 
      button 
      onClick={() => toggleSection('regulator')}
      sx={{ 
        borderRadius: '0 20px 20px 0',
        mx: 1,
        my: 0.5,
        '&:hover': {
          backgroundColor: themeMode === 'light' 
            ? 'rgba(0, 0, 0, 0.04)' 
            : 'rgba(255, 255, 255, 0.08)'
        }
      }}
    >
      <ListItemIcon sx={{ minWidth: '40px' }}>
        <GavelIcon sx={{ color: '#ff9800' }} />
      </ListItemIcon>
      <ListItemText 
        primary="Regulator" 
        primaryTypographyProps={{ fontWeight: 600 }}
      />
      {sections.regulator ? <ExpandLess /> : <ExpandMore />}
    </ListItem>
    <Collapse in={sections.regulator} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        <NestedListItem
          to="/regulator/scan"
          icon={<QrCodeScannerIcon color="warning" />}
          primary="Scan QR Code"
        />
        <NestedListItem
          to="/regulator/inventory"
          icon={<ListAltIcon />}
          primary="Medicines in Inventory"
        />
        <NestedListItem
          to="/regulator/contact-order"
          icon={<AddCircleIcon />}
          primary="Contact & Order"
        />
        <NestedListItem
          to="/regulator/register-order"
          icon={<AddCircleIcon />}
          primary="Register Order"
        />
      </List>
    </Collapse>
  </>
)}



          {user?.role === 'enduser' && (
            <>
              <ListSubheader 
                sx={{ 
                  bgcolor: 'transparent', 
                  color: themeMode === 'light' ? 'text.secondary' : 'text.primary',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  fontWeight: 700,
                  lineHeight: '1.5rem'
                }}
              >
                END USER
              </ListSubheader>
              <ListItem 
                button 
                onClick={() => toggleSection('endUser')}
                sx={{ 
                  borderRadius: '0 20px 20px 0',
                  mx: 1,
                  my: 0.5,
                  '&:hover': {
                    backgroundColor: themeMode === 'light' 
                      ? 'rgba(0, 0, 0, 0.04)' 
                      : 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <PersonIcon sx={{ color: '#9c27b0' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="End User" 
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
                {sections.endUser ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={sections.endUser} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <NestedListItem
                    to="/enduser"
                    icon={<PersonIcon color="secondary" />}
                    primary="Dashboard"
                  />
                </List>
              </Collapse>
            </>
          )}

          <Divider sx={{ my: 1.5 }} />
          <ListSubheader 
            sx={{ 
              bgcolor: 'transparent', 
              color: themeMode === 'light' ? 'text.secondary' : 'text.primary',
              fontSize: '0.75rem',
              letterSpacing: '0.5px',
              fontWeight: 700,
              lineHeight: '1.5rem'
            }}
          >
            ASSETS & SYSTEM
          </ListSubheader>
          
          <ListItem 
            button 
            component={Link} 
            to="/assets" 
            onClick={toggleDrawer}
            sx={{ 
              borderRadius: '0 20px 20px 0',
              mx: 1,
              my: 0.5,
              '&:hover': {
                backgroundColor: themeMode === 'light' 
                  ? 'rgba(0, 0, 0, 0.04)' 
                  : 'rgba(255, 255, 255, 0.08)'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: '40px' }}>
              <ListAltIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Assets" 
              primaryTypographyProps={{ fontWeight: 500 }}
            />
          </ListItem>
          
          {user?.role === 'manufacturer' && (
            <ListItem 
              button 
              component={Link} 
              to="/create-asset" 
              onClick={toggleDrawer}
              sx={{ 
                borderRadius: '0 20px 20px 0',
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: themeMode === 'light' 
                    ? 'rgba(0, 0, 0, 0.04)' 
                    : 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>
                <AddCircleIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Create Asset" 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          )}
          
          {(user?.role === 'manufacturer' || user?.role === 'regulator') && (
            <ListItem 
              button 
              component={Link} 
              to="/init-ledger" 
              onClick={toggleDrawer}
              sx={{ 
                borderRadius: '0 20px 20px 0',
                mx: 1,
                my: 0.5,
                '&:hover': {
                  backgroundColor: themeMode === 'light' 
                    ? 'rgba(0, 0, 0, 0.04)' 
                    : 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>
                <StorageIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Init Ledger" 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItem>
          )}
        </List>

        {user && (
          <Box 
            sx={{ 
              mt: 'auto', 
              p: 2, 
              borderTop: `1px solid ${themeMode === 'light' ? '#e0e0e0' : '#333'}`
            }}
          >
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{ 
                borderRadius: '8px',
                backgroundColor: themeMode === 'light' ? 'rgba(211, 47, 47, 0.04)' : 'rgba(211, 47, 47, 0.08)',
                '&:hover': {
                  backgroundColor: themeMode === 'light' ? 'rgba(211, 47, 47, 0.08)' : 'rgba(211, 47, 47, 0.12)',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: '40px', color: '#d32f2f' }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Logout" 
                primaryTypographyProps={{ 
                  fontWeight: 600,
                  color: '#d32f2f'
                }}
              />
            </ListItem>
          </Box>
        )}
      </Drawer>
    </>
  );
}

export default Sidebar;