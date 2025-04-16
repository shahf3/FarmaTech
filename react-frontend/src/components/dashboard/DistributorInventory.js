import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Menu,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import QrCodeIcon from "@mui/icons-material/QrCode";
import UpdateIcon from "@mui/icons-material/Update";
import WarningIcon from "@mui/icons-material/Warning";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { AlertTitle } from "@mui/material";

const API_URL = "http://localhost:3000/api";

const InventoryContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  marginBottom: theme.spacing(3),
}));

const MedicineCard = styled(Card)(({ theme }) => ({
  height: "100%",
  transition: "transform 0.2s",
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[4],
  },
}));

const StatusChip = styled(Chip)(({ theme, statuscolor }) => ({
  fontWeight: 600,
  backgroundColor: statuscolor,
  color: "#fff",
}));

const getStatusColor = (status) => {
  const statusColors = {
    Manufactured: "#4caf50",
    "Quality Check": "#fb8c00",
    Dispatched: "#3f51b5",
    "In Transit": "#9c27b0",
    Distributor: "#00acc1",
    "In Distribution": "#5c6bc0",
    Regulator: "#7cb342",
    Approved: "#43a047",
    Pharmacy: "#26a69a",
    "Delivered to Pharmacy": "#26a69a",
    Dispensed: "#8bc34a",
    Flagged: "#f44336",
  };

  return statusColors[status] || "#757575";
};

const DistributorInventory = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: "",
    location: "",
    notes: "",
  });
  const [flagForm, setFlagForm] = useState({
    reason: "",
    location: "",
  });
  const [notifyForm, setNotifyForm] = useState({
    subject: "",
    message: "",
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchInventory();
    detectLocation();
  }, [token]);

  useEffect(() => {
    applyFilters();
  }, [medicines, searchTerm, statusFilter, sortBy]);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching inventory for distributor: ${user.organization}`);
      const response = await axios.get(
        `${API_URL}/medicines/`,

        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(`Received ${response.data.length} medicines from API`);

      if (response.data.length > 0) {
        response.data.forEach((med) => {
          console.log(
            `Medicine ${med.id}: assignedDistributors=${JSON.stringify(
              med.assignedDistributors || []
            )}, includes ${user.organization}=${(
              med.assignedDistributors || []
            ).includes(user.organization)}`
          );
        });
      }

      setMedicines(response.data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError("Failed to fetch inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = async () => {
    setIsDetectingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            if (!response.ok) {
              throw new Error("Failed to get location");
            }
            const data = await response.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              "";
            const state = data.address?.state || "";
            const country = data.address?.country || "";
            const locationString = [city, state, country]
              .filter(Boolean)
              .join(", ");
            setCurrentLocation(locationString);
            setUpdateForm((prev) => ({ ...prev, location: locationString }));
            setFlagForm((prev) => ({ ...prev, location: locationString }));
          } catch (error) {
            const locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(
              6
            )}`;
            setCurrentLocation(locationString);
            setUpdateForm((prev) => ({ ...prev, location: locationString }));
            setFlagForm((prev) => ({ ...prev, location: locationString }));
          } finally {
            setIsDetectingLocation(false);
          }
        },
        (error) => {
          setIsDetectingLocation(false);
          setError(
            "Failed to detect location. Please try again or enter manually."
          );
        }
      );
    } else {
      setIsDetectingLocation(false);
      setError("Geolocation is not supported by this browser.");
    }
  };

  const applyFilters = () => {
    let filtered = [...medicines];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (med) =>
          med.id.toLowerCase().includes(term) ||
          med.name.toLowerCase().includes(term) ||
          med.batchNumber.toLowerCase().includes(term) ||
          med.manufacturer.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((med) => med.status === statusFilter);
    }

    if (sortBy === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "date-asc") {
      filtered.sort(
        (a, b) => new Date(a.manufacturingDate) - new Date(b.manufacturingDate)
      );
    } else if (sortBy === "date-desc") {
      filtered.sort(
        (a, b) => new Date(b.manufacturingDate) - new Date(a.manufacturingDate)
      );
    } else if (sortBy === "expiry-asc") {
      filtered.sort(
        (a, b) => new Date(a.expirationDate) - new Date(b.expirationDate)
      );
    } else if (sortBy === "expiry-desc") {
      filtered.sort(
        (a, b) => new Date(b.expirationDate) - new Date(a.expirationDate)
      );
    }

    setFilteredMedicines(filtered);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleMenuOpen = (event, medicine) => {
    setAnchorEl(event.currentTarget);
    setSelectedMedicine(medicine);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenUpdateDialog = () => {
    handleMenuClose();
    setUpdateForm({
      status: "",
      location: currentLocation,
      notes: "",
    });
    setUpdateDialogOpen(true);
  };

  const handleOpenFlagDialog = () => {
    handleMenuClose();
    setFlagForm({
      reason: "",
      location: currentLocation,
    });
    setFlagDialogOpen(true);
  };

  const handleOpenNotifyDialog = () => {
    handleMenuClose();
    setNotifyForm({
      subject: `Update on Medicine: ${selectedMedicine.name} (${selectedMedicine.id})`,
      message: "",
    });
    setNotifyDialogOpen(true);
  };

  const handleFormChange = (e, formSetter) => {
    const { name, value } = e.target;
    formSetter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateSubmit = async () => {
    if (!updateForm.status || !updateForm.location) {
      setError("Status and location are required");
      return;
    }

    setUpdatingStatus(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/medicines/${selectedMedicine.id}/update`,
        {
          status: updateForm.status,
          location: updateForm.location,
          notes: updateForm.notes || `Updated by ${user.organization}`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update medicine in local state
      const updatedMedicines = medicines.map((med) =>
        med.id === selectedMedicine.id ? response.data.medicine : med
      );

      setMedicines(updatedMedicines);
      applyFilters();

      setSuccess(
        `Medicine status updated to ${updateForm.status} successfully`
      );
      setUpdateDialogOpen(false);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Error updating medicine status:", err);
      setError(
        err.response?.data?.error ||
          "Failed to update status. Please try again."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFlagSubmit = async () => {
    if (!flagForm.reason || !flagForm.location) {
      setError("Reason and location are required to flag a medicine");
      return;
    }

    setUpdatingStatus(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/medicines/${selectedMedicine.id}/flag`,
        {
          reason: flagForm.reason,
          location: flagForm.location,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update medicine in local state
      const updatedMedicines = medicines.map((med) =>
        med.id === selectedMedicine.id ? response.data.medicine : med
      );

      setMedicines(updatedMedicines);
      applyFilters();

      setSuccess(
        "Medicine has been flagged. Manufacturer and regulatory authorities have been notified."
      );
      setFlagDialogOpen(false);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Error flagging medicine:", err);
      setError(
        err.response?.data?.error ||
          "Failed to flag medicine. Please try again."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleNotifySubmit = async () => {
    if (!notifyForm.subject || !notifyForm.message) {
      setError("Subject and message are required");
      return;
    }

    setUpdatingStatus(true);
    setError(null);

    try {
      const manufacturerOrg = selectedMedicine.manufacturer;

      const manufacturerResponse = await axios.get(
        `${API_URL}/auth/distributor-manufacturers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const manufacturer = manufacturerResponse.data.find(
        (m) => m.organization === manufacturerOrg
      );

      if (!manufacturer) {
        throw new Error("Manufacturer not found");
      }

      // Send notification
      await axios.post(
        `${API_URL}/notifications`,
        {
          recipientId: manufacturer._id,
          subject: notifyForm.subject,
          message: notifyForm.message,
          relatedTo: "Medicine",
          medicineId: selectedMedicine.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(`Notification sent to ${manufacturerOrg} successfully`);
      setNotifyDialogOpen(false);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Error sending notification:", err);
      setError(
        err.response?.data?.error ||
          "Failed to send notification. Please try again."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCardClick = (medicineId) => {
    navigate(`/medicine/${medicineId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Available status options for distributors
  const getAvailableStatusOptions = (currentStatus) => {
    switch (currentStatus) {
      case "Dispatched":
        return ["In Transit", "Distributor"];
      case "In Transit":
        return ["Distributor", "In Distribution"];
      case "Distributor":
        return ["In Distribution", "In Transit"];
      case "In Distribution":
        return ["In Transit", "Delivered to Pharmacy"];
      default:
        return [
          "In Transit",
          "Distributor",
          "In Distribution",
          "Delivered to Pharmacy",
        ];
    }
  };

  console.log("Raw medicines from API:", medicines);
  console.log("Filtered medicines after search/status:", filteredMedicines);
  console.log("Current user/org:", user);
  console.log(
    "Sample medicine distributor IDs:",
    medicines && medicines.length > 0 && medicines[0]?.assignedDistributors
      ? medicines[0].assignedDistributors
      : "No medicines available"
  );

  return (
    <div className="distributor-inventory">
      <InventoryContainer>
        <Typography variant="h5" component="h1" gutterBottom>
          Medicine Delivery Inventory
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          Manage medicines assigned to you for delivery. Update delivery status
          and location as you transport medicines.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3, display: "flex", flexWrap: "wrap", gap: 2 }}>
          <TextField
            placeholder="Search medicines..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="status-filter-label">Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
              startAdornment={<FilterListIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="In Transit">In Transit</MenuItem>
              <MenuItem value="Distributor">Distributor</MenuItem>
              <MenuItem value="In Distribution">In Distribution</MenuItem>
              <MenuItem value="Delivered to Pharmacy">
                Delivered to Pharmacy
              </MenuItem>
              <MenuItem value="Flagged">Flagged</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            color="primary"
            startIcon={<QrCodeIcon />}
            onClick={() => navigate("/distributor/scan")}
          >
            Scan Medicine
          </Button>

          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              value={sortBy}
              onChange={handleSortChange}
              label="Sort By"
              startAdornment={<SortIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="date-desc">Newest First</MenuItem>
              <MenuItem value="date-asc">Oldest First</MenuItem>
              <MenuItem value="name-asc">Name A-Z</MenuItem>
              <MenuItem value="name-desc">Name Z-A</MenuItem>
              <MenuItem value="expiry-asc">Expiry Date (Earliest)</MenuItem>
              <MenuItem value="expiry-desc">Expiry Date (Latest)</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : medicines.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Assigned Medicines
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You don't have any medicines assigned to you by manufacturers yet.
              Please contact your manufacturer partner to get medicines assigned
              to your distribution account.
            </Typography>
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              startIcon={<QrCodeIcon />}
              onClick={() => navigate("/distributor/scan")}
            >
              Scan a Medicine QR Code
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredMedicines.map((medicine) => {
              const isExpired = new Date(medicine.expirationDate) < new Date();

              return (
                <Grid item xs={12} sm={6} md={4} key={medicine.id}>
                  <MedicineCard
                    sx={{
                      border: medicine.flagged
                        ? "1px solid #f44336"
                        : isExpired
                        ? "1px solid #ff9800"
                        : "1px solid #e0e0e0",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6" component="h2" noWrap>
                          {medicine.name}
                        </Typography>

                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, medicine);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            ID:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {medicine.id}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Batch:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {medicine.batchNumber}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Manufacturer:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {medicine.manufacturer}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Exp. Date:
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            color={isExpired ? "error.main" : "inherit"}
                          >
                            {formatDate(medicine.expirationDate)}
                          </Typography>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 1 }} />

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <StatusChip
                          label={medicine.status}
                          statuscolor={getStatusColor(medicine.status)}
                          size="small"
                        />

                        {medicine.flagged && (
                          <Tooltip title="This medicine has been flagged">
                            <Chip
                              icon={<WarningIcon />}
                              label="Flagged"
                              size="small"
                              color="error"
                            />
                          </Tooltip>
                        )}
                      </Box>

                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<UpdateIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMedicine(medicine);
                          handleOpenUpdateDialog();
                        }}
                        disabled={medicine.flagged}
                      >
                        Update Status
                      </Button>
                    </CardContent>
                  </MedicineCard>
                </Grid>
              );
            })}
          </Grid>
        )}
      </InventoryContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenUpdateDialog}>
          <UpdateIcon fontSize="small" sx={{ mr: 1 }} />
          Update Status
        </MenuItem>
        <MenuItem onClick={handleOpenFlagDialog}>
          <WarningIcon fontSize="small" sx={{ mr: 1 }} />
          Flag Issue
        </MenuItem>
        <MenuItem onClick={handleOpenNotifyDialog}>
          <NotificationsIcon fontSize="small" sx={{ mr: 1 }} />
          Notify Manufacturer
        </MenuItem>
      </Menu>

      <Dialog
        open={updateDialogOpen}
        onClose={() => !updatingStatus && setUpdateDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Update Medicine Delivery Status</DialogTitle>
        <DialogContent>
          {selectedMedicine && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {selectedMedicine.name} (ID: {selectedMedicine.id})
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Status: {selectedMedicine.status}
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel id="status-select-label">New Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  name="status"
                  value={updateForm.status}
                  onChange={(e) => handleFormChange(e, setUpdateForm)}
                  label="New Status"
                  required
                >
                  {getAvailableStatusOptions(selectedMedicine.status).map(
                    (status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <TextField
                  label="Current Location"
                  name="location"
                  value={updateForm.location}
                  onChange={(e) => handleFormChange(e, setUpdateForm)}
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={detectLocation}
                        disabled={isDetectingLocation}
                      >
                        <MyLocationIcon />
                      </IconButton>
                    ),
                  }}
                />
              </FormControl>

              <FormControl fullWidth margin="normal">
                <TextField
                  label="Notes"
                  name="notes"
                  value={updateForm.notes}
                  onChange={(e) => handleFormChange(e, setUpdateForm)}
                  multiline
                  rows={3}
                  placeholder="Add any additional details about this delivery update"
                />
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setUpdateDialogOpen(false)}
            disabled={updatingStatus}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateSubmit}
            variant="contained"
            color="primary"
            disabled={
              updatingStatus || !updateForm.status || !updateForm.location
            }
          >
            {updatingStatus ? <CircularProgress size={24} /> : "Update Status"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={flagDialogOpen}
        onClose={() => !updatingStatus && setFlagDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: "error.main" }}>
          Flag Medicine Issue
        </DialogTitle>
        <DialogContent>
          {selectedMedicine && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Important</AlertTitle>
                Flagging a medicine will alert the manufacturer and regulatory
                authorities. This action cannot be undone.
              </Alert>

              <Typography variant="subtitle1" gutterBottom>
                {selectedMedicine.name} (ID: {selectedMedicine.id})
              </Typography>

              <FormControl fullWidth margin="normal">
                <TextField
                  label="Issue Reason"
                  name="reason"
                  value={flagForm.reason}
                  onChange={(e) => handleFormChange(e, setFlagForm)}
                  required
                  multiline
                  rows={3}
                  placeholder="Describe the issue with this medicine"
                />
              </FormControl>

              <FormControl fullWidth margin="normal">
                <TextField
                  label="Current Location"
                  name="location"
                  value={flagForm.location}
                  onChange={(e) => handleFormChange(e, setFlagForm)}
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={detectLocation}
                        disabled={isDetectingLocation}
                      >
                        <MyLocationIcon />
                      </IconButton>
                    ),
                  }}
                />
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setFlagDialogOpen(false)}
            disabled={updatingStatus}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFlagSubmit}
            variant="contained"
            color="error"
            disabled={updatingStatus || !flagForm.reason || !flagForm.location}
          >
            {updatingStatus ? <CircularProgress size={24} /> : "Flag Medicine"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notify Manufacturer Dialog */}
      <Dialog
        open={notifyDialogOpen}
        onClose={() => !updatingStatus && setNotifyDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Notify Manufacturer</DialogTitle>
        <DialogContent>
          {selectedMedicine && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Send a message to {selectedMedicine.manufacturer}
              </Typography>

              <FormControl fullWidth margin="normal">
                <TextField
                  label="Subject"
                  name="subject"
                  value={notifyForm.subject}
                  onChange={(e) => handleFormChange(e, setNotifyForm)}
                  required
                />
              </FormControl>

              <FormControl fullWidth margin="normal">
                <TextField
                  label="Message"
                  name="message"
                  value={notifyForm.message}
                  onChange={(e) => handleFormChange(e, setNotifyForm)}
                  required
                  multiline
                  rows={4}
                  placeholder="Enter your message to the manufacturer"
                />
              </FormControl>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setNotifyDialogOpen(false)}
            disabled={updatingStatus}
          >
            Cancel
          </Button>
          <Button
            onClick={handleNotifySubmit}
            variant="contained"
            color="primary"
            disabled={
              updatingStatus || !notifyForm.subject || !notifyForm.message
            }
          >
            {updatingStatus ? <CircularProgress size={24} /> : "Send Message"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DistributorInventory;
