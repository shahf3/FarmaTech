// src/components/dashboard/ContactAndOrder.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const ContactAndOrder = () => {
  const { user, token } = useAuth();
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    recipient: '',
  });
  const [orderForm, setOrderForm] = useState({
    orderId: '',
    medicineName: '',
    quantity: '',
    manufacturer: '',
    orderDate: new Date().toISOString().split('T')[0],
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [manufacturers, setManufacturers] = useState([]);
  const [activeTab, setActiveTab] = useState('contact');

  useEffect(() => {
    // Fetch list of manufacturers
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
  }, [token]);

  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrderInputChange = (e) => {
    const { name, value } = e.target;
    setOrderForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!contactForm.subject || !contactForm.message || !contactForm.recipient) {
      setFormError('All fields are required');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/messages`,
        {
          ...contactForm,
          sender: user.organization,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('Message sent successfully!');
      setContactForm({ subject: '', message: '', recipient: '' });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to send message. Please try again.');
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (
      !orderForm.orderId ||
      !orderForm.medicineName ||
      !orderForm.quantity ||
      !orderForm.manufacturer ||
      !orderForm.orderDate
    ) {
      setFormError('All fields are required');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/orders`,
        {
          ...orderForm,
          regulator: user.organization,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(`Order ${response.data.order.orderId} placed successfully!`);
      setOrderForm({
        orderId: '',
        medicineName: '',
        quantity: '',
        manufacturer: '',
        orderDate: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to place order. Please try again.');
    }
  };

  return (
    <div className="dashboard-section">
      <div className="tabs-container">
        <div
          className={`tab ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          Contact Manufacturer
        </div>
        <div
          className={`tab ${activeTab === 'order' ? 'active' : ''}`}
          onClick={() => setActiveTab('order')}
        >
          Place Order
        </div>
      </div>

      {activeTab === 'contact' && (
        <>
          <h2>Contact Manufacturer</h2>
          {formError && <div className="error-message">{formError}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          <form className="medicine-form" onSubmit={handleContactSubmit}>
            <div className="form-group">
              <label htmlFor="recipient">Recipient (Manufacturer):</label>
              <select
                id="recipient"
                name="recipient"
                value={contactForm.recipient}
                onChange={handleContactInputChange}
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
              <label htmlFor="subject">Subject:</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={contactForm.subject}
                onChange={handleContactInputChange}
                placeholder="e.g., Inquiry about Paracetamol supply"
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message:</label>
              <textarea
                id="message"
                name="message"
                value={contactForm.message}
                onChange={handleContactInputChange}
                placeholder="Enter your message here"
                rows="5"
              />
            </div>
            <button type="submit" className="submit-btn">Send Message</button>
          </form>
        </>
      )}

      {activeTab === 'order' && (
        <>
          <h2>Place Order with Manufacturer</h2>
          {formError && <div className="error-message">{formError}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          <form className="medicine-form" onSubmit={handleOrderSubmit}>
            <div className="form-group">
              <label htmlFor="orderId">Order ID:</label>
              <input
                type="text"
                id="orderId"
                name="orderId"
                value={orderForm.orderId}
                onChange={handleOrderInputChange}
                placeholder="e.g., ORD123"
              />
            </div>
            <div className="form-group">
              <label htmlFor="medicineName">Medicine Name:</label>
              <input
                type="text"
                id="medicineName"
                name="medicineName"
                value={orderForm.medicineName}
                onChange={handleOrderInputChange}
                placeholder="e.g., Paracetamol 500mg"
              />
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Quantity:</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={orderForm.quantity}
                onChange={handleOrderInputChange}
                placeholder="e.g., 1000"
                min="1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="manufacturer">Manufacturer:</label>
              <select
                id="manufacturer"
                name="manufacturer"
                value={orderForm.manufacturer}
                onChange={handleOrderInputChange}
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
                value={orderForm.orderDate}
                onChange={handleOrderInputChange}
              />
            </div>
            <button type="submit" className="submit-btn">Place Order</button>
          </form>
        </>
      )}
    </div>
  );
};

export default ContactAndOrder;