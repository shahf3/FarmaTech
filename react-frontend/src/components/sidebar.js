// src/components/Sidebar.js
import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  ListSubheader,
  Divider,
  Box,
  Typography,
  Avatar,
  Tooltip,
  useTheme as useMuiTheme,
} from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import LogoutIcon from "@mui/icons-material/Logout";
import MedicationIcon from "@mui/icons-material/Medication";
import EmailIcon from "@mui/icons-material/Email";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SendIcon from "@mui/icons-material/Send";
import AssignmentIcon from "@mui/icons-material/Assignment";
import HistoryIcon from "@mui/icons-material/History";
import GavelIcon from "@mui/icons-material/Gavel";

function Sidebar() {
  const { user, logout } = useAuth();
  const { themeMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    logout();
    window.location.href = "http://localhost:3001/"; // Changed to redirect to homepage
    setOpen(false);
  };

  const getInitial = () => {
    return user?.username ? user.username.charAt(0).toUpperCase() : "U";
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case "manufacturer":
        return "#4caf50";
      case "distributor":
        return "#2196f3";
      case "regulator":
        return "#169976";
      case "enduser":
        return "#9c27b0";
      default:
        return "#757575";
    }
  };

  const colors = {
    darkGreen: "#169976",
    lightGreen: "#1DCD9F",
    lightBlack: "#222222",
    darkBlack: "#000000",
    white: "#ffffff",
  };

  const RoleListItem = ({ to, icon, primary, onClick }) => {
    const itemColor =
      location.pathname === to
        ? colors.darkGreen
        : themeMode === "light"
        ? colors.lightBlack
        : colors.white;

    return (
      <ListItem
        button
        component={Link}
        to={to}
        onClick={onClick}
        sx={{
          pl: 4,
          borderRadius: "0 20px 20px 0",
          mx: 1,
          my: 0.5,
          backgroundColor:
            location.pathname === to
              ? themeMode === "light"
                ? "rgba(0, 0, 0, 0.08)"
                : "rgba(255, 255, 255, 0.12)"
              : "transparent",
          "&:hover": {
            backgroundColor:
              themeMode === "light"
                ? "rgba(0, 0, 0, 0.04)"
                : "rgba(255, 255, 255, 0.08)",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: "40px",
            color: itemColor + " !important",
          }}
        >
          {icon}
        </ListItemIcon>
        <ListItemText
          primary={primary}
          primaryTypographyProps={{
            fontSize: "0.9rem",
            fontWeight: location.pathname === to ? 600 : 500,
            color: itemColor + " !important",
          }}
        />
      </ListItem>
    );
  };

  return (
    <>
      <Tooltip title="Open Menu">
        <IconButton
          onClick={toggleDrawer}
          color="inherit"
          aria-label="menu"
          sx={{
            position: "fixed",
            top: "16px",
            left: "16px",
            zIndex: 1200,
            backgroundColor:
              themeMode === "light"
                ? "rgba(255, 255, 255, 0.8)"
                : "rgba(18, 18, 18, 0.8)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            "&:hover": {
              backgroundColor:
                themeMode === "light"
                  ? "rgba(255, 255, 255, 0.9)"
                  : "rgba(30, 30, 30, 0.9)",
            },
          }}
        >
          <MenuIcon sx={{ color: colors.darkGreen }} />
        </IconButton>
      </Tooltip>

      <Drawer
        anchor="left"
        open={open}
        variant="persistent"
        sx={{
          "& .MuiDrawer-paper": {
            width: 280,
            borderTopRightRadius: "16px",
            borderBottomRightRadius: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            background:
              themeMode === "light"
                ? "linear-gradient(to bottom, #ffffff, #f8f9fa)"
                : "linear-gradient(to bottom, #121212, #1e1e1e)",
            position: "fixed",
            zIndex: 1100,
            overflowY: "auto",
            overflowX: "hidden", // Prevent horizontal scrollbar
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              background:
                themeMode === "light" ? "#f1f1f1" : "rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: colors.darkGreen,
              borderRadius: "4px",
              "&:hover": {
                background: colors.lightGreen,
              },
            },
            "&::-webkit-scrollbar-button": {
              display: "none", // Hide scrollbar arrows
            },
            scrollbarWidth: "thin",
            scrollbarColor: `${colors.darkGreen} ${
              themeMode === "light" ? "#f1f1f1" : "rgba(255, 255, 255, 0.1)"
            }`,
          },
        }}
      >
        <Box
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderBottom: `1px solid ${
              themeMode === "light" ? "#e0e0e0" : "#333"
            }`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 1,
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ color: colors.darkGreen }}
            >
              FarmaTech
            </Typography>
          </Box>

          {user && (
            <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
              <Avatar
                sx={{
                  bgcolor: getRoleColor(),
                  width: 40,
                  height: 40,
                  mr: 2,
                }}
              >
                {getInitial()}
              </Avatar>
              <Box>
                <Typography
                  variant="body1"
                  fontWeight="medium"
                  sx={{
                    color:
                      themeMode === "light" ? colors.lightBlack : colors.white,
                  }}
                >
                  {user.username}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "0.75rem",
                    color:
                      themeMode === "light" ? colors.lightBlack : colors.white,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: getRoleColor(),
                      mr: 0.5,
                      display: "inline-block",
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
              borderRadius: "0 20px 20px 0",
              mx: 1,
              my: 0.5,
              "&:hover": {
                backgroundColor:
                  themeMode === "light"
                    ? "rgba(0, 0, 0, 0.04)"
                    : "rgba(255, 255, 255, 0.08)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: "40px",
                color: themeMode === "light" ? colors.lightBlack : colors.white,
              }}
            >
              {themeMode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
            </ListItemIcon>
            <ListItemText
              primary={themeMode === "light" ? "Dark Mode" : "Light Mode"}
              primaryTypographyProps={{
                fontWeight: 500,
                color: themeMode === "light" ? colors.lightBlack : colors.white,
              }}
            />
          </ListItem>

          <ListItem
            button
            component={Link}
            to={user?.role === "regulator" ? "/regulator" : "/dashboard"}
            sx={{
              borderRadius: "0 20px 20px 0",
              mx: 1,
              my: 0.5,
              backgroundColor:
                location.pathname ===
                (user?.role === "regulator" ? "/regulator" : "/dashboard")
                  ? themeMode === "light"
                    ? "rgba(0, 0, 0, 0.08)"
                    : "rgba(255, 255, 255, 0.12)"
                  : "transparent",
              "&:hover": {
                backgroundColor:
                  themeMode === "light"
                    ? "rgba(0, 0, 0, 0.08)"
                    : "rgba(255, 255, 255, 0.12)",
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: "40px",
                color:
                  location.pathname ===
                  (user?.role === "regulator" ? "/regulator" : "/dashboard")
                    ? colors.darkGreen
                    : themeMode === "light"
                    ? colors.lightBlack
                    : colors.white,
              }}
            >
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary="Dashboard"
              primaryTypographyProps={{
                fontWeight:
                  location.pathname ===
                  (user?.role === "regulator" ? "/regulator" : "/dashboard")
                    ? 600
                    : 500,
                color:
                  location.pathname ===
                  (user?.role === "regulator" ? "/regulator" : "/dashboard")
                    ? colors.darkGreen
                    : themeMode === "light"
                    ? colors.lightBlack
                    : colors.white,
              }}
            />
          </ListItem>

          <Divider sx={{ my: 1.5 }} />

          {user?.role === "manufacturer" && (
            <>
              <ListSubheader
                sx={{
                  bgcolor: "transparent",
                  color: colors.darkGreen,
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  fontWeight: 700,
                  lineHeight: "1.5rem",
                }}
              >
                MANUFACTURER
              </ListSubheader>
              <RoleListItem
                to="/manufacturer/register"
                icon={<MedicationIcon />}
                primary="Register Medicine"
              />
              <RoleListItem
                to="/manufacturer/view"
                icon={<ListAltIcon />}
                primary="View Medicines"
              />
              <RoleListItem
                to="/scan-medicine"
                icon={<QrCodeScannerIcon />}
                primary="Scan QR Code"
              />
              <RoleListItem
                to="/manufacturer/delivery-history"
                icon={<HistoryIcon />}
                primary="Delivery History"
              />
            </>
          )}

          {user?.role === "manufacturer" && (
            <>
              <ListSubheader
                sx={{
                  bgcolor: "transparent",
                  color: colors.darkGreen,
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  fontWeight: 700,
                  lineHeight: "1.5rem",
                }}
              >
                MANAGE
              </ListSubheader>
              <RoleListItem
                to="/manufacturer/assign-distributors"
                icon={<AssignmentIcon />}
                primary="Assign Distributors"
              />
              <RoleListItem
                to="/manufacturer/register-distributor"
                icon={<PersonAddIcon />}
                primary="Register Distributor"
              />
              <RoleListItem
                to="/manufacturer/manage-distributors"
                icon={<PeopleIcon />}
                primary="Manage Distributors"
              />
              <RoleListItem
                to="/manufacturer/register-regulator"
                icon={<PersonAddIcon />}
                primary="Register Regulator"
              />
              <RoleListItem
                to="/manufacturer/manage-regulators"
                icon={<GavelIcon />}
                primary="Manage Regulators"
              />
            </>
          )}

          {user?.role === "distributor" && (
            <>
              <ListSubheader
                sx={{
                  bgcolor: "transparent",
                  color: colors.darkGreen,
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  fontWeight: 700,
                  lineHeight: "1.5rem",
                }}
              >
                DISTRIBUTOR
              </ListSubheader>
              <RoleListItem
                to="/distributor/scan"
                icon={<QrCodeScannerIcon />}
                primary="Scan Medicines"
              />
              <RoleListItem
                to="/distributor/inventory"
                icon={<MedicationIcon />}
                primary="Delivery Inventory"
              />
            </>
          )}

          {user?.role === "regulator" && (
            <>
              <ListSubheader
                sx={{
                  bgcolor: "transparent",
                  color: colors.darkGreen,
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  fontWeight: 700,
                  lineHeight: "1.5rem",
                }}
              >
                REGULATOR
              </ListSubheader>
              <RoleListItem
                to="/regulator/scan"
                icon={<QrCodeScannerIcon />}
                primary="Scan Medicines"
              />
              <RoleListItem
                to="/regulator/inventory"
                icon={<MedicationIcon />}
                primary="Inventory"
              />
            </>
          )}

          {user?.role === "enduser" && (
            <>
              <ListSubheader
                sx={{
                  bgcolor: "transparent",
                  color: colors.darkGreen,
                  fontSize: "0.75rem",
                  letterSpacing: "0.5px",
                  fontWeight: 700,
                  lineHeight: "1.5rem",
                }}
              >
                END USER
              </ListSubheader>
              <RoleListItem
                to="/enduser"
                icon={<PersonIcon />}
                primary="Dashboard"
              />
            </>
          )}

          <Divider sx={{ my: 1.5 }} />
          <ListSubheader
            sx={{
              bgcolor: "transparent",
              color: colors.darkGreen,
              fontSize: "0.75rem",
              letterSpacing: "0.5px",
              fontWeight: 700,
              lineHeight: "1.5rem",
            }}
          >
            CONTACT
          </ListSubheader>

          {user?.role === "manufacturer" && (
            <>
              <RoleListItem
                to="/manufacturer/notifications"
                icon={<NotificationsIcon />}
                primary="Notifications"
              />
              <RoleListItem
                to="/manufacturer/send-message"
                icon={<SendIcon />}
                primary="Send Message"
              />
            </>
          )}

          {user?.role === "distributor" && (
            <>
              <RoleListItem
                to="/distributor/contact-order"
                icon={<EmailIcon />}
                primary="Contact Manufacturer"
              />
              <RoleListItem
                to="/distributor/notifications"
                icon={<NotificationsIcon />}
                primary="Notifications"
              />
              <RoleListItem
                to="/distributor/send-message"
                icon={<SendIcon />}
                primary="Send Message"
              />
            </>
          )}

          {user?.role === "regulator" && (
            <>
              <RoleListItem
                to="/regulator/notifications"
                icon={<NotificationsIcon />}
                primary="Notifications"
              />
              <RoleListItem
                to="/regulator/send-message"
                icon={<SendIcon />}
                primary="Send Message"
              />
            </>
          )}
        </List>

        {user && (
          <Box
            sx={{
              mt: "auto",
              p: 2,
              borderTop: `1px solid ${
                themeMode === "light" ? "#e0e0e0" : "#333"
              }`,
            }}
          >
            <ListItem
              button
              onClick={handleLogout}
              sx={{
                borderRadius: "8px",
                backgroundColor:
                  themeMode === "light"
                    ? "rgba(211, 47, 47, 0.04)"
                    : "rgba(211, 47, 47, 0.08)",
                "&:hover": {
                  backgroundColor:
                    themeMode === "light"
                      ? "rgba(211, 47, 47, 0.08)"
                      : "rgba(211, 47, 47, 0.12)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: "40px", color: "#d32f2f" }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontWeight: 600,
                  color: "#d32f2f",
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