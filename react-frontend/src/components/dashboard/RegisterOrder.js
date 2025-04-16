import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const RegisterOrder = () => {
  const { user, token } = useAuth();
  const [order, setOrder] = useState({
    orderId: '',
    medicineName: '',
    quantity: '',
    manufacturer: '',
    orderDate: '',
    regulator: user ? user.organization : '',
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [manufacturers, setManufacturers] = useState([]);

  useEffect(() => {
    // Fetch list of manufacturers from the backend
    const fetchManufacturers = async () => {
      try {
        const response = await axios.get(`${API_URL}/users/manufacturers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setManufacturers(response.data);
      } catch (err) {
        setFormError('Failed to fetch manufacturers. Please try again.');
      }
    };
    fetchManufacturers();

    // Set default order date to today
    const today = new Date().toISOString().split('T')[0];
    setOrder((prev) => ({ ...prev, orderDate: today }));
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrder((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (
      !order.orderId ||
      !order.medicineName ||
      !order.quantity ||
      !order.manufacturer ||
      !order.orderDate
    ) {
      setFormError('All fields are required');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/orders`, order, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage(`Order ${response.data.order.orderId} registered successfully!`);
      setOrder({
        orderId: '',
        medicineName: '',
        quantity: '',
        manufacturer: '',
        orderDate: new Date().toISOString().split('T')[0],
        regulator: user.organization,
      });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to register order. Please try again.');
    }
  };

  return (
    <div className="dashboard-section">
      <h2>Register New Order to Manufacturer</h2>
      {formError && <div className="error-message">{formError}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form className="medicine-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="orderId">Order ID:</label>
          <input
            type="text"
            id="orderId"
            name="orderId"
            value={order.orderId}
            onChange={handleInputChange}
            placeholder="e.g., ORD123"
          />
        </div>

        <div className="form-group">
          <label htmlFor="medicineName">Medicine Name:</label>
          <input
            type="text"
            id="medicineName"
            name="medicineName"
            value={order.medicineName}
            onChange={handleInputChange}
            placeholder="e.g., Paracetamol 500mg"
          />
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Quantity:</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={order.quantity}
            onChange={handleInputChange}
            placeholder="e.g., 1000"
            min="1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="manufacturer">Manufacturer:</label>
          <select
            id="manufacturer"
            name="manufacturer"
            value={order.manufacturer}
            onChange={handleInputChange}
          >
            <option value="">-- Select Manufacturer --</option>
            {manufacturers.map((manufacturer) => (
              <option key={manufacturer._id} value={manufacturer.organization}>
                {manufacturer.organization}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="orderDate">Order Date:</label>
          <input
            type="date"
            id="orderDate"
            name="orderDate"
            value={order.orderDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="regulator">Regulator:</label>
          <input
            type="text"
            id="regulator"
            name="regulator"
            value={order.regulator}
            readOnly
          />
        </div>

        <button type="submit" className="submit-btn">Register Order</button>
      </form>
    </div>
  );
};

export default RegisterOrder;