const { verifyToken, checkRole } = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');

jest.mock('../../models/User');

describe('Auth Middleware', () => {
  describe('verifyToken', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        header: jest.fn()
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should return 401 if no token is provided', async () => {
      req.header.mockReturnValue(undefined);

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No token, authorization denied' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 if token is invalid', async () => {
      req.header.mockReturnValue('Bearer invalid-token');
      
      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token is not valid' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 if user does not exist', async () => {
      req.header.mockReturnValue('Bearer valid-token');
      User.findById.mockResolvedValue(null);

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should set req.user and call next if token is valid', async () => {
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        username: 'testuser',
        role: 'manufacturer',
        organization: 'Test Org',
        isOrgAdmin: true
      };

      req.header.mockReturnValue('Bearer valid-token');
      User.findById.mockResolvedValue(mockUser);

      await verifyToken(req, res, next);

      expect(req.user).toEqual({
        id: mockUser._id,
        username: mockUser.username,
        role: mockUser.role,
        organization: mockUser.organization,
        isOrgAdmin: mockUser.isOrgAdmin
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('checkRole', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        user: {
          id: 'user-id',
          role: 'manufacturer'
        }
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test('should return 401 if req.user is not present', () => {
      req.user = undefined;
      const checkRoleMiddleware = checkRole(['manufacturer']);

      checkRoleMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 403 if user role is not in allowed roles', () => {
      req.user.role = 'distributor';
      const checkRoleMiddleware = checkRole(['manufacturer', 'regulator']);

      checkRoleMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next if user role is in allowed roles', () => {
      req.user.role = 'manufacturer';
      const checkRoleMiddleware = checkRole(['manufacturer', 'regulator']);

      checkRoleMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('should call next if user role is the only allowed role', () => {
      req.user.role = 'regulator';
      const checkRoleMiddleware = checkRole(['regulator']);

      checkRoleMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});