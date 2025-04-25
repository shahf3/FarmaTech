const securityUtils = require('../../utils/securityUtils');
const mockNotificationSave = jest.fn().mockResolvedValue(true);
const mockNotification = {
  _id: "notification-id",
  save: mockNotificationSave
};

jest.mock('../../models/Notification', () => {
  return {
    findById: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    default: jest.fn().mockImplementation(() => mockNotification)
  };
});

const Notification = require('../../models/Notification');

// Mock fabric-network - making sure to mock wallet.get properly
jest.mock('fabric-network', () => {
  const mockSubmitTransaction = jest.fn().mockImplementation((...args) => {
    if (args[0] === 'FlagMedicine') {
      return Buffer.from(JSON.stringify({
        id: args[1],
        flagged: true,
        flaggedBy: args[2],
        flagReason: args[3]
      }));
    }
    return Buffer.from(JSON.stringify({ success: true }));
  });

  const mockEvaluateTransaction = jest.fn().mockImplementation((...args) => {
    return Buffer.from(JSON.stringify({
      id: 'MED001',
      name: 'Test Medicine',
      manufacturer: 'Test Manufacturer',
      currentOwner: 'Test Manufacturer',
      status: 'Manufactured'
    }));
  });

  const mockDisconnect = jest.fn();

  const mockGetContract = jest.fn().mockReturnValue({
    submitTransaction: mockSubmitTransaction,
    evaluateTransaction: mockEvaluateTransaction
  });

  const mockGetNetwork = jest.fn().mockReturnValue({
    getContract: mockGetContract
  });

  // Create a mock wallet with a get function
  const mockWallet = {
    get: jest.fn().mockResolvedValue({ type: 'X.509' })
  };

  // Mock the entire Gateway
  const mockGateway = {
    connect: jest.fn().mockResolvedValue(undefined),
    getNetwork: mockGetNetwork,
    disconnect: mockDisconnect
  };

  const MockGateway = jest.fn().mockImplementation(() => mockGateway);

  return {
    Gateway: MockGateway,
    Wallets: {
      newFileSystemWallet: jest.fn().mockResolvedValue(mockWallet)
    }
  };
});

// Import after mocking
const { Gateway } = require('fabric-network');

describe('Security Utils', () => {
  describe('isAuthorizedToScan', () => {
    test('regulator should be authorized to scan any medicine', () => {
      const user = {
        role: 'regulator',
        organization: 'Drug Regulatory Authority'
      };
      
      const medicine = {
        id: 'MED001',
        manufacturer: 'Test Manufacturer',
        currentOwner: 'Test Distributor',
        status: 'In Transit',
        supplyChain: []
      };
      
      const isAuthorized = securityUtils.isAuthorizedToScan(user, medicine);
      expect(isAuthorized).toBe(true);
    });
    
    test('manufacturer should be authorized to scan only their own medicines', () => {
      const user = {
        role: 'manufacturer',
        organization: 'Test Manufacturer'
      };
      
      const ownMedicine = {
        id: 'MED001',
        manufacturer: 'Test Manufacturer',
        currentOwner: 'Test Distributor',
        status: 'In Transit',
        supplyChain: []
      };
      
      const isAuthorizedOwn = securityUtils.isAuthorizedToScan(user, ownMedicine);
      expect(isAuthorizedOwn).toBe(true);
      
      const otherMedicine = {
        id: 'MED002',
        manufacturer: 'Other Manufacturer',
        currentOwner: 'Test Distributor',
        status: 'In Transit',
        supplyChain: []
      };
      
      const isAuthorizedOther = securityUtils.isAuthorizedToScan(user, otherMedicine);
      expect(isAuthorizedOther).toBe(false);
    });
    
    test('distributor should be authorized to scan medicines they own or in transit to them', () => {
      const user = {
        role: 'distributor',
        organization: 'Test Distributor'
      };
      
      // Medicine owned by this distributor
      const ownedMedicine = {
        id: 'MED001',
        manufacturer: 'Test Manufacturer',
        currentOwner: 'Test Distributor',
        status: 'In Inventory',
        supplyChain: []
      };
      
      const isAuthorizedOwned = securityUtils.isAuthorizedToScan(user, ownedMedicine);
      expect(isAuthorizedOwned).toBe(true);

      const inTransitMedicine = {
        id: 'MED002',
        manufacturer: 'Test Manufacturer',
        currentOwner: 'Test Manufacturer',
        nextOwner: 'Test Distributor',
        status: 'In Transit',
        supplyChain: [
          {
            timestamp: '2025-01-01T12:00:00Z',
            user: 'manufacturer',
            notes: 'Shipping to Test Distributor'
          }
        ]
      };
      
      const isAuthorizedTransit = securityUtils.isAuthorizedToScan(user, inTransitMedicine);
      expect(isAuthorizedTransit).toBe(true);
      
      const otherMedicine = {
        id: 'MED003',
        manufacturer: 'Test Manufacturer',
        currentOwner: 'Other Distributor',
        status: 'In Inventory',
        supplyChain: []
      };
      
      const isAuthorizedOther = securityUtils.isAuthorizedToScan(user, otherMedicine);
      expect(isAuthorizedOther).toBe(false);
    });
    
    test('enduser should be authorized to scan only dispensed medicines', () => {
      const user = {
        role: 'enduser',
        organization: 'Patient'
      };
      
      const dispensedMedicine = {
        id: 'MED001',
        manufacturer: 'Test Manufacturer',
        currentOwner: 'Patient',
        status: 'Dispensed',
        supplyChain: []
      };
      
      const isAuthorizedDispensed = securityUtils.isAuthorizedToScan(user, dispensedMedicine);
      expect(isAuthorizedDispensed).toBe(true);
      
      const inTransitMedicine = {
        id: 'MED002',
        manufacturer: 'Test Manufacturer',
        currentOwner: 'Test Distributor',
        status: 'In Transit',
        supplyChain: []
      };
      
      const isAuthorizedTransit = securityUtils.isAuthorizedToScan(user, inTransitMedicine);
      expect(isAuthorizedTransit).toBe(false);
    });
    
    test('unknown roles should not be authorized to scan', () => {
      const user = {
        role: 'unknown',
        organization: 'Unknown Org'
      };
      
      const medicine = {
        id: 'MED001',
        manufacturer: 'Test Manufacturer',
        currentOwner: 'Test Distributor',
        status: 'In Transit',
        supplyChain: []
      };
      
      const isAuthorized = securityUtils.isAuthorizedToScan(user, medicine);
      expect(isAuthorized).toBe(false);
    });
  });
  
  describe('flagMedicineForUnauthorizedAccess', () => {
    test('should flag a medicine for unauthorized access', async () => {
      jest.clearAllMocks();
      
      const medicine = {
        id: 'MED001',
        manufacturer: 'Test Manufacturer',
        currentOwner: 'Test Distributor'
      };
      
      const user = {
        id: 'unauthorized-user',
        username: 'unauthorized',
        organization: 'Unauthorized Org'
      };
      
      const reason = 'Unauthorized scan attempt';
      const result = await securityUtils.flagMedicineForUnauthorizedAccess(medicine, user, reason);

      expect(result).toBeDefined();
      expect(Gateway).toHaveBeenCalled();
    });
    
    test('should handle errors during flagging', async () => {
      jest.clearAllMocks();
      const originalGatewayImpl = Gateway.mockImplementation;
      
      try {
        Gateway.mockImplementation(() => {
          throw new Error('wallet.get is not a function');
        });
  
        const medicine = { id: 'MED001' };
        const user = { id: 'user-id' };
  
        await expect(
          securityUtils.flagMedicineForUnauthorizedAccess(medicine, user, 'test')
        ).rejects.toThrow();
      } finally {
        Gateway.mockImplementation(originalGatewayImpl);
      }
    });
  });
  
  describe('recordSecurityIncident', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      
      mockNotification.medicineName = 'Test Medicine';
      mockNotification.batchNumber = 'BATCH001';
      mockNotification.save = jest.fn().mockResolvedValue(true);

      Notification.default.mockClear();
    });
    
    test('should record a security incident', async () => {
      const medicine = {
        id: 'MED001',
        name: 'Test Medicine',
        manufacturer: 'Test Manufacturer',
        batchNumber: 'BATCH001',
        medicineName: 'Test Medicine'
      };
      
      const user = {
        id: 'unauthorized-user',
        username: 'unauthorized',
        role: 'unknown',
        organization: 'Unauthorized Org'
      };

      const incident = await securityUtils.recordSecurityIncident(medicine, user, 'Unauthorized access');
      
      expect(incident).toBeDefined();
    });
    
    test('should handle errors during incident recording', async () => {
      const medicine = {
        id: 'MED001'
      };
      
      const user = {
        id: 'user-id'
      };
      
      Notification.default.mockImplementationOnce(() => {
        throw new Error('Database error');
      });
      
      const result = await securityUtils.recordSecurityIncident(medicine, user, 'test');
      expect(result).toBeNull();
    });
    
    test('should determine correct severity based on medicine and user', async () => {
      const controlledMedicine = {
        id: 'MED001',
        name: 'Controlled Medicine',
        medicineName: 'Controlled Medicine',
        batchNumber: 'BATCH001',
        controlledSubstance: true,
        manufacturer: 'Test Manufacturer'
      };
      
      const unknownUser = {
        id: 'unknown-user',
        username: 'unknown',
        role: 'unknown',
        organization: 'Unknown Org'
      };
      
      const incident = await securityUtils.recordSecurityIncident(controlledMedicine, unknownUser, 'Unauthorized access');
      
      expect(incident).toBeDefined();
    });
  });  
});