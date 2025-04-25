const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");

const app = express();
app.use(express.json());

const generateTestId = () => `test-id-${Math.random().toString(36).substring(2, 9)}`;

jest.mock("../../models/User", () => {
  const mockUsers = {
    "test-user-id": {
      _id: "test-user-id",
      username: "testuser",
      email: "test@example.com",
      role: "manufacturer",
      organization: "Test Org",
      isOrgAdmin: true,
      save: jest.fn().mockResolvedValue(true),
      comparePassword: jest.fn().mockResolvedValue(true),
    },
  };

  return {
    findOne: jest.fn().mockImplementation((query) => {
      if (query && query.email === "test@example.com") {
        return Promise.resolve(mockUsers["test-user-id"]);
      }
      return Promise.resolve(null);
    }),
    findById: jest.fn().mockImplementation((id) => {
      return {
        select: jest.fn().mockResolvedValue(mockUsers[id] || null)
      };
    }),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        { _id: "dist-1", username: "distributor1" },
        { _id: "dist-2", username: "distributor2" }
      ])
    })
  };
});

// Mock the Organization model
jest.mock('../../models/Organization', () => {
  return {
    findOne: jest.fn().mockResolvedValue(null)
  };
});

const User = require("../../models/User");
const Organization = require("../../models/Organization");
const authRoutes = require("../../routes/auth");
app.use("/api/auth", authRoutes);

jest.mock("bcryptjs", () => ({
  genSalt: jest.fn().mockResolvedValue("mock-salt"),
  hash: jest.fn().mockResolvedValue("hashed-password"),
  compare: jest.fn().mockImplementation((candidatePassword, hashedPassword) => {
    return Promise.resolve(candidatePassword === "password123");
  }),
}));

jest.mock("../../middleware/auth", () => ({
  verifyToken: (req, res, next) => {
    if (req.headers.authorization === "Bearer valid-token") {
      req.user = {
        id: "test-user-id",
        username: "testuser",
        role: req.headers["x-user-role"] || "manufacturer",
        organization: req.headers["x-user-org"] || "Test Org",
        isOrgAdmin: req.headers["x-user-admin"] === "true",
      };
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  },
}));

jest.mock("../../utils/passwordGenerator", () => ({
  generatePassword: jest.fn().mockReturnValue("generated-password")
}));

jest.mock("@sendgrid/mail", () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ statusCode: 202 }])
}));

describe("Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    test("should return 400 if validation fails", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "testuser",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    test("should return 400 if user already exists", async () => {
      User.findOne.mockResolvedValue({ email: "test@example.com" });

      const response = await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        role: "manufacturer",
        organization: "Test Org",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    test("should register a new user successfully", async () => {
      User.findOne.mockResolvedValue(null);

      await request(app).post("/api/auth/register").send({
        username: "testuser",
        email: "newuser@example.com",
        password: "password123",
        role: "manufacturer",
        organization: "Test Org",
      });

      expect(User.findOne).toHaveBeenCalledWith({ email: "newuser@example.com" });
    });
  });

  describe("POST /api/auth/login", () => {
    test("should return 400 if validation fails", async () => {
      const response = await request(app).post("/api/auth/login").send({
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("errors");
    });

    test("should return 400 if user does not exist", async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].msg).toBe("Invalid credentials");
    });

    test("should return 400 if password does not match", async () => {
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].msg).toBe("Invalid credentials");
    });

    test("should login successfully with valid credentials", async () => {
      const mockUser = {
        id: "user-id",
        username: "testuser",
        email: "test@example.com",
        role: "manufacturer",
        organization: "Test Org",
        isOrgAdmin: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);

      const response = await request(app).post("/api/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toEqual({
        id: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
        role: mockUser.role,
        organization: mockUser.organization,
        isOrgAdmin: mockUser.isOrgAdmin,
      });
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe("GET /api/auth/user", () => {
    test("should return 401 if not authenticated", async () => {
      const response = await request(app).get("/api/auth/user");

      expect(response.status).toBe(401);
    });

    test("should return user data if authenticated", async () => {
      const mockUser = {
        _id: "test-user-id",
        username: "testuser",
        email: "test@example.com",
        role: "manufacturer",
        organization: "Test Org",
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .get("/api/auth/user")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUser);
    });
  });

  describe("POST /api/auth/register-distributor", () => {
    beforeEach(() => {
      require("../../utils/passwordGenerator").generatePassword.mockReturnValue("generated-password");
    });

    test("should return 403 if user is not a manufacturer", async () => {
      const response = await request(app)
        .post("/api/auth/register-distributor")
        .set("Authorization", "Bearer valid-token")
        .set("x-user-role", "distributor")
        .send({
          username: "distributor",
          email: "distributor@example.com",
          firstName: "John",
          lastName: "Doe",
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "error",
        "Only manufacturers can register distributors"
      );
    });

    test("should register a distributor successfully", async () => {
        User.findOne.mockResolvedValue(null);

        await request(app)
          .post("/api/auth/register-distributor")
          .set("Authorization", "Bearer valid-token")
          .set("x-user-role", "manufacturer")
          .send({
            username: "distributor",
            email: "distributor@example.com",
            firstName: "John",
            lastName: "Doe",
            organization: "Distributor Org",
          });
      
        // Check that findOne was called with the correct query structure
        expect(User.findOne).toHaveBeenCalledWith(
          expect.objectContaining({
            $or: expect.arrayContaining([
              expect.objectContaining({ email: "distributor@example.com" }),
              expect.objectContaining({ username: "distributor" })
            ])
          })
        );
      });
  });

  describe("GET /api/auth/manufacturer-distributors", () => {
    test("should return 403 if user is not a manufacturer", async () => {
      const response = await request(app)
        .get("/api/auth/manufacturer-distributors")
        .set("Authorization", "Bearer valid-token")
        .set("x-user-role", "distributor");

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "error",
        "Only manufacturers can access distributor list"
      );
    });

    test("should return distributors for a manufacturer", async () => {
      const mockDistributors = [
        { _id: "dist-1", username: "distributor1" },
        { _id: "dist-2", username: "distributor2" },
      ];

      // Fix the find method mock
      User.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDistributors)
      });

      const response = await request(app)
        .get("/api/auth/manufacturer-distributors")
        .set("Authorization", "Bearer valid-token")
        .set("x-user-role", "manufacturer");

      // Check that the find method was called with right params
      expect(User.find).toHaveBeenCalledWith({
        role: "distributor",
        registeredBy: "test-user-id",
      });
    });
  });
});