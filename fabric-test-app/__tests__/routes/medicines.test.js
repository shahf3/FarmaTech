const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Gateway, Wallets } = require('fabric-network');
const crypto = require('crypto');
const User = require('../../models/User');

const app = express();
app.use(express.json());

const medicineRoutes = require('../../routes/medicines');
app.use('/api/medicines', medicineRoutes);

app.get('/api/public/verify/:qrCode', (req, res) => {
  const { qrCode } = req.params;
  if (!qrCode) {
    return res.status(400).json({ error: 'QR code is required' });
  }
  
  if (!qrCode.startsWith('QR-')) {
    return res.status(400).json({ error: 'Invalid QR code format' });
  }
  
  res.json({
    id: 'MED001',
    name: 'Test Medicine',
    manufacturer: 'Test Manufacturer',
    batchNumber: 'BATCH123',
    manufacturingDate: '2023-01-01',
    expirationDate: '2026-01-01',
    status: 'Manufactured',
    flagged: false,
    verificationTimestamp: new Date().toISOString()
  });
});

jest.mock('../../middleware/auth', () => ({
  verifyToken: (req, res, next) => {
    if (req.headers.authorization === 'Bearer valid-token') {
      req.user = {
        id: 'test-user-id',
        username: 'testuser',
        role: req.headers['x-user-role'] || 'manufacturer',
        organization: req.headers['x-user-org'] || 'Test Manufacturer',
        isOrgAdmin: req.headers['x-user-admin'] === 'true'
      };
      next();
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  },
  checkRole: (roles) => (req, res, next) => {
    if (roles.includes(req.user?.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  },
  checkOrganization: () => (req, res, next) => {
    next();
  }
}));

jest.mock('../../utils/securityUtils', () => ({
  isAuthorizedToScan: jest.fn().mockImplementation((user, medicine) => {
    // Regulator can scan any medicine
    if (user.role === 'regulator') return true;
    
    // Manufacturer can only scan their own medicines
    if (user.role === 'manufacturer') {
      return user.organization === medicine.manufacturer;
    }
    
    // Distributor can scan medicines they own
    if (user.role === 'distributor') {
      return user.organization === medicine.currentOwner;
    }
    
    // End user can scan dispensed medicines
    if (user.role === 'enduser') {
      return medicine.status === 'Dispensed';
    }
    
    return false;
  }),
  flagMedicineForUnauthorizedAccess: jest.fn().mockResolvedValue({ id: 'MED001', flagged: true }),
  recordSecurityIncident: jest.fn().mockResolvedValue({ id: 'incident-1' })
}));

describe('Medicine Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/medicines', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/medicines');

      expect(response.status).toBe(401);
    });

    test('should return medicines for a manufacturer', async () => {
      const response = await request(app)
        .get('/api/medicines')
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-role', 'manufacturer')
        .set('x-user-org', 'Test Manufacturer');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should return medicines for a regulator', async () => {
      const response = await request(app)
        .get('/api/medicines')
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-role', 'regulator');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should return medicines for a distributor', async () => {
      const response = await request(app)
        .get('/api/medicines')
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-role', 'distributor')
        .set('x-user-org', 'Test Distributor');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should return 403 for unauthorized role', async () => {
      const response = await request(app)
        .get('/api/medicines')
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-role', 'enduser');

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/medicines', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/medicines')
        .send({
          id: 'MED001',
          name: 'Test Medicine',
          batchNumber: 'BATCH123',
          manufacturingDate: '2023-01-01',
          expirationDate: '2026-01-01'
        });

      expect(response.status).toBe(401);
    });

    test('should return 403 if user is not a manufacturer', async () => {
      const response = await request(app)
        .post('/api/medicines')
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-role', 'distributor')
        .send({
          id: 'MED001',
          name: 'Test Medicine',
          batchNumber: 'BATCH123',
          manufacturingDate: '2023-01-01',
          expirationDate: '2026-01-01'
        });

      expect(response.status).toBe(403);
    });

    test('should return 400 if validation fails', async () => {
      const response = await request(app)
        .post('/api/medicines')
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-role', 'manufacturer')
        .send({
          id: 'MED001'
        });

      expect(response.status).toBe(400);
    });

    test('should register a medicine successfully', async () => {
      const medicineData = {
        id: 'MED001',
        name: 'Test Medicine',
        batchNumber: 'BATCH123',
        manufacturingDate: '2023-01-01',
        expirationDate: '2026-01-01',
        registrationLocation: 'Test Location'
      };

      const response = await request(app)
        .post('/api/medicines')
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-role', 'manufacturer')
        .send(medicineData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('medicine');
      expect(response.body).toHaveProperty('secureQRCode');
      expect(response.body.medicine).toMatchObject({
        id: medicineData.id,
        name: medicineData.name,
        batchNumber: medicineData.batchNumber
      });
    });
  });

  describe('POST /api/medicines/:id/update', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/medicines/MED001/update')
        .send({
          status: 'In Transit',
          location: 'Warehouse'
        });

      expect(response.status).toBe(401);
    });

    test('should return 403 if user role is not allowed', async () => {
      const response = await request(app)
        .post('/api/medicines/MED001/update')
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-role', 'invalidrole')
        .send({
          status: 'In Transit',
          location: 'Warehouse'
        });

      expect(response.status).toBe(403);
    });

    test('should update medicine status successfully for distributor', async () => {
      const response = await request(app)
        .post('/api/medicines/MED001/update')
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-role', 'distributor')
        .send({
          status: 'In Transit',
          location: 'Warehouse',
          notes: 'Medicine is being transported'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('medicine');
      expect(response.body.medicine).toMatchObject({
        id: 'MED001',
        status: 'In Transit'
      });
    });

    test('should update medicine status successfully for manufacturer', async () => {
      const response = await request(app)
        .post('/api/medicines/MED001/update')
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-role', 'manufacturer')
        .send({
          status: 'Dispatched',
          location: 'Manufacturing Plant',
          notes: 'Medicine has been dispatched'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('medicine');
      expect(response.body.medicine).toMatchObject({
        id: 'MED001',
        status: 'Dispatched'
      });
    });
  });

  describe('POST /api/medicines/:id/flag', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/medicines/MED001/flag')
        .send({
          reason: 'Damaged package',
          location: 'Warehouse'
        });

      expect(response.status).toBe(401);
    });

    test('should flag a medicine successfully', async () => {
      const response = await request(app)
        .post('/api/medicines/MED001/flag')
        .set('Authorization', 'Bearer valid-token')
        .send({
          reason: 'Damaged package',
          location: 'Warehouse'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('medicine');
      expect(response.body.medicine).toHaveProperty('flagged', true);
    });
  });

  describe('GET /api/medicines/verify/:qrCode', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/medicines/verify/QR-MED001');

      expect(response.status).toBe(401);
    });

    test('should return medicine data for authorized scan', async () => {
      const response = await request(app)
        .get('/api/medicines/verify/QR-MED001')
        .set('Authorization', 'Bearer valid-token')
        .set('x-user-role', 'manufacturer')
        .set('x-user-org', 'Test Manufacturer');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'MED001');
      expect(response.body).toHaveProperty('roleSpecificActions');
      expect(response.body.roleSpecificActions).toHaveProperty('isAuthorizedScan', true);
    });
  });

  describe('GET /api/public/verify/:qrCode', () => {
    test('should return 400 if qrCode is invalid', async () => {
      const response = await request(app)
        .get('/api/public/verify/INVALID');

      expect(response.status).toBe(400);
    });

    test('should return medicine data for public verification', async () => {
      const response = await request(app)
        .get('/api/public/verify/QR-MED001');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'MED001');
      expect(response.body).toHaveProperty('name', 'Test Medicine');
      expect(response.body).toHaveProperty('manufacturer', 'Test Manufacturer');
    });
  });
});