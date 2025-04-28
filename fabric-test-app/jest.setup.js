const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up the database between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Mock for the Hyperledger Fabric components
jest.mock("fabric-network", () => {
  const mockSubmitTransaction = jest.fn().mockImplementation((...args) => {
    if (args[0] === "RegisterMedicine") {
      return JSON.stringify({
        id: args[1],
        name: args[2],
        manufacturer: args[3],
        batchNumber: args[4],
        manufacturingDate: args[5],
        expirationDate: args[6],
        qrCode: `QR-${args[1]}`,
        status: "Manufactured",
        currentOwner: args[3],
      });
    } else if (args[0] === "UpdateSupplyChain") {
      return JSON.stringify({
        id: args[1],
        status: args[3],
        currentOwner: args[2],
      });
    } else if (args[0] === "FlagMedicine") {
      return JSON.stringify({
        id: args[1],
        flagged: true,
        flaggedBy: args[2],
        flagReason: args[3],
      });
    }
    return JSON.stringify({ success: true });
  });

  const mockEvaluateTransaction = jest.fn().mockImplementation((...args) => {
    if (args[0] === "GetMedicine") {
      return JSON.stringify({
        id: args[1],
        name: "Test Medicine",
        manufacturer: "Test Manufacturer",
        batchNumber: "BATCH123",
        manufacturingDate: "2023-01-01",
        expirationDate: "2026-01-01",
        qrCode: `QR-${args[1]}`,
        status: "Manufactured",
        currentOwner: "Test Manufacturer",
        flagged: false,
        supplyChain: [],
      });
    } else if (args[0] === "GetAllMedicines") {
      return JSON.stringify([
        {
          id: "MED001",
          name: "Test Medicine 1",
          manufacturer: "Test Manufacturer",
          batchNumber: "BATCH123",
          qrCode: "QR-MED001",
          status: "Manufactured",
        },
        {
          id: "MED002",
          name: "Test Medicine 2",
          manufacturer: "Test Manufacturer",
          batchNumber: "BATCH124",
          qrCode: "QR-MED002",
          status: "In Transit",
        },
      ]);
    } else if (args[0] === "GetMedicinesByManufacturer") {
      return JSON.stringify([
        {
          id: "MED001",
          name: "Test Medicine 1",
          manufacturer: args[1],
          batchNumber: "BATCH123",
          qrCode: "QR-MED001",
          status: "Manufactured",
        },
      ]);
    } else if (args[0] === "GetMedicinesByOwner") {
      return JSON.stringify([
        {
          id: "MED002",
          name: "Test Medicine 2",
          manufacturer: "Test Manufacturer",
          currentOwner: args[1],
          batchNumber: "BATCH124",
          qrCode: "QR-MED002",
          status: "In Transit",
        },
      ]);
    }
    return JSON.stringify({});
  });

  const mockDisconnect = jest.fn();
  const mockGetContract = jest.fn().mockReturnValue({
    submitTransaction: mockSubmitTransaction,
    evaluateTransaction: mockEvaluateTransaction,
  });

  const mockGetNetwork = jest.fn().mockReturnValue({
    getContract: mockGetContract,
  });

  const mockGatewayConnect = jest.fn().mockResolvedValue();

  return {
    Wallets: {
      newFileSystemWallet: jest.fn().mockResolvedValue({
        get: jest.fn().mockResolvedValue({ type: "X.509" }),
        getProviderRegistry: jest.fn().mockReturnValue({
          getProvider: jest.fn().mockReturnValue({
            getUserContext: jest.fn().mockResolvedValue({}),
          }),
        }),
      }),
    },
    Gateway: jest.fn().mockImplementation(() => {
      return {
        connect: mockGatewayConnect,
        getNetwork: mockGetNetwork,
        disconnect: mockDisconnect,
      };
    }),
  };
});

// Mock the crypto module for QR code verification
jest.mock("crypto", () => {
  const original = jest.requireActual("crypto");
  return {
    ...original,
    createHmac: jest.fn().mockImplementation(() => {
      return {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue("mockedhmac12345"),
      };
    }),
  };
});

// Mock for SendGrid
jest.mock("@sendgrid/mail", () => {
  return {
    setApiKey: jest.fn(),
    send: jest.fn().mockResolvedValue([
      {
        statusCode: 202,
        body: {},
        headers: {},
      },
    ]),
  };
});

// Mock for JWT
jest.mock("jsonwebtoken", () => {
  return {
    sign: jest.fn().mockImplementation((payload, secret, options, callback) => {
      if (callback) {
        callback(null, "test-token-12345");
        return;
      }
      return "test-token-12345";
    }),
    verify: jest.fn().mockImplementation((token, secret) => {
      if (token === "invalid-token") {
        throw new Error("Invalid token");
      }
      return { id: "test-user-id" };
    }),
  };
});
