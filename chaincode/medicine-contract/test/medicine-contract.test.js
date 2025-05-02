// fabric-samples/chaincode/medicine-contract/test/medicine-contract.test.js
'use strict';

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');
const { MockContext } = require('./mockStub');
const MedicineContract = require('../lib/medicine-contract');

chai.use(sinonChai);
chai.use(chaiAsPromised);
const { expect } = chai;

describe('Medicine Contract', () => {
  let contract;
  let ctx;

  beforeEach(() => {
    // Create a fresh contract and context before each test
    contract = new MedicineContract();
    ctx = new MockContext();
    
    // Reset ctx.stub state for each test
    ctx.stub.state = new Map();
    ctx.stub.privateData = new Map();
    ctx.stub.args = [];
  });

  describe('InitLedger', () => {
    it('should add initial medicines to the ledger', async () => {
      // Act
      await contract.InitLedger(ctx);
      
      // Assert
      // Verify the first medicine was added
      const med1Data = await ctx.stub.getState('MED1');
      expect(med1Data.toString()).to.not.be.empty;
      
      const medicine1 = JSON.parse(med1Data.toString());
      expect(medicine1.id).to.equal('MED1');
      expect(medicine1.name).to.equal('Paracetamol 500mg');
      expect(medicine1.manufacturer).to.equal('PharmaCo Ltd');
      
      // Verify the second medicine was added
      const med2Data = await ctx.stub.getState('MED2');
      expect(med2Data.toString()).to.not.be.empty;
      
      const medicine2 = JSON.parse(med2Data.toString());
      expect(medicine2.id).to.equal('MED2');
      expect(medicine2.name).to.equal('Amoxicillin 250mg');
    });
  });

  describe('RegisterMedicine', () => {
    it('should register a new medicine', async () => {
      // Arrange
      const id = 'MED3';
      const name = 'Ibuprofen 400mg';
      const manufacturer = 'MediLab Ltd';
      const batchNumber = 'ML-2025-001';
      const manufacturingDate = '2025-03-10';
      const expirationDate = '2028-03-10';
      const registrationLocation = 'Dublin, Ireland';
      const timestamp = '2025-03-10T09:00:00Z';
      
      // Act
      const result = await contract.RegisterMedicine(
        ctx, 
        id, 
        name, 
        manufacturer, 
        batchNumber, 
        manufacturingDate, 
        expirationDate, 
        registrationLocation, 
        timestamp
      );
      
      // Assert
      const medData = await ctx.stub.getState(id);
      expect(medData.toString()).to.not.be.empty;
      
      const medicine = JSON.parse(medData.toString());
      expect(medicine.id).to.equal(id);
      expect(medicine.name).to.equal(name);
      expect(medicine.manufacturer).to.equal(manufacturer);
      expect(medicine.batchNumber).to.equal(batchNumber);
      expect(medicine.currentOwner).to.equal(manufacturer);
      expect(medicine.status).to.equal('Manufactured');
      expect(medicine.supplyChain.length).to.equal(1);
      expect(medicine.supplyChain[0].location).to.equal(registrationLocation);
    });

    it('should throw an error if medicine with ID already exists', async () => {
      const id = 'MED3';
      const existingMed = {
        id,
        name: 'Existing Medicine'
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(existingMed)));
      await expect(
        contract.RegisterMedicine(
          ctx, 
          id, 
          'New Medicine', 
          'Manufacturer', 
          'BATCH-001', 
          '2025-01-01', 
          '2028-01-01', 
          'Location', 
          '2025-01-01T00:00:00Z'
        )
      ).to.be.rejectedWith(`Medicine with ID ${id} already exists`);
    });
  });

  describe('GetMedicine', () => {
    it('should return medicine when it exists', async () => {
      const id = 'MED3';
      const medicine = {
        id,
        name: 'Test Medicine',
        manufacturer: 'Test Manufacturer'
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
      const result = await contract.GetMedicine(ctx, id);
      expect(result).to.exist;
      expect(JSON.parse(result)).to.deep.equal(medicine);
    });
    
    it('should throw error when medicine does not exist', async () => {
      await expect(
        contract.GetMedicine(ctx, 'NONEXISTENT')
      ).to.be.rejectedWith('Medicine with ID NONEXISTENT does not exist');
    });
  });

  describe('UpdateSupplyChain', () => {
    it('should update medicine supply chain status', async () => {
      const id = 'MED4';
      const medicine = {
        id,
        name: 'Test Medicine',
        manufacturer: 'PharmaMed',
        currentOwner: 'PharmaMed',
        status: 'Manufactured',
        supplyChain: [{
          timestamp: '2025-04-01T10:00:00Z',
          location: 'Factory',
          handler: 'PharmaMed',
          status: 'Manufactured',
          notes: 'Initial production'
        }]
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
      const mockTimestamp = {
        seconds: { low: 1712745600 },
        nanos: 0
      };
      ctx.stub.txTimestamp = mockTimestamp;
      
      const handler = 'PharmaMed';
      const status = 'Quality Check';
      const location = 'QA Lab';
      const notes = 'Quality check passed';
      
      const result = await contract.UpdateSupplyChain(
        ctx,
        id,
        handler,
        status,
        location,
        notes
      );
      
      const medData = await ctx.stub.getState(id);
      const updatedMedicine = JSON.parse(medData.toString());
      
      expect(updatedMedicine.status).to.equal(status);
      expect(updatedMedicine.currentOwner).to.equal(handler);
      expect(updatedMedicine.supplyChain.length).to.equal(2);
      expect(updatedMedicine.supplyChain[1].status).to.equal(status);
      expect(updatedMedicine.supplyChain[1].location).to.equal(location);
      expect(updatedMedicine.supplyChain[1].notes).to.equal(notes);
    });
    
    it('should throw error for missing parameters', async () => {
      await expect(
        contract.UpdateSupplyChain(ctx, 'MED4', '', 'Status', 'Location', 'Notes')
      ).to.be.rejectedWith('Missing required parameters');
    });

    it('should throw error when medicine does not exist', async () => {
      await expect(
        contract.UpdateSupplyChain(
          ctx,
          'NONEXISTENT',
          'Handler',
          'Status',
          'Location',
          'Notes'
        )
      ).to.be.rejectedWith('Medicine with ID NONEXISTENT does not exist');
    });
  });

  describe('FlagMedicine', () => {
    it('should flag a medicine for issues', async () => {
      // Arrange
      const id = 'MED5';
      const medicine = {
        id,
        name: 'Test Medicine',
        manufacturer: 'PharmaMed',
        currentOwner: 'Distributor',
        status: 'In Distribution',
        supplyChain: [],
        flagged: false
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));

      const mockTimestamp = {
        seconds: { low: 1712745600 },
        nanos: 0
      };
      ctx.stub.txTimestamp = mockTimestamp;
    
      const flaggedBy = 'Regulator';
      const reason = 'Suspicious packaging';
      const location = 'Warehouse';
      
      const result = await contract.FlagMedicine(
        ctx,
        id,
        flaggedBy,
        reason,
        location
      );
      
      // Assert
      const medData = await ctx.stub.getState(id);
      const flaggedMedicine = JSON.parse(medData.toString());
      
      expect(flaggedMedicine.flagged).to.be.true;
      expect(flaggedMedicine.status).to.equal('Flagged');
      expect(flaggedMedicine.flagNotes).to.equal(reason);
      expect(flaggedMedicine.flaggedBy).to.equal(flaggedBy);
      expect(flaggedMedicine.supplyChain[0].status).to.equal('Flagged');
      expect(flaggedMedicine.supplyChain[0].notes).to.equal(reason);
    });
  });

  describe('GetAllMedicines', () => {
    it('should return all medicines in the ledger', async () => {
      // Arrange
      const med1 = {
        id: 'MED1',
        name: 'Medicine 1'
      };
      const med2 = {
        id: 'MED2',
        name: 'Medicine 2'
      };
      
      await ctx.stub.putState('MED1', Buffer.from(JSON.stringify(med1)));
      await ctx.stub.putState('MED2', Buffer.from(JSON.stringify(med2)));
      
      // Act
      const result = await contract.GetAllMedicines(ctx);
      
      // Assert
      const medicines = JSON.parse(result);
      expect(medicines).to.be.an('array');
      expect(medicines.length).to.equal(2);
      
      const medicineIds = medicines.map(med => med.id);
      expect(medicineIds).to.include('MED1');
      expect(medicineIds).to.include('MED2');
    });
  });

  describe('GetFlaggedMedicines', () => {
    it('should return only flagged medicines', async () => {
      // Arrange
      const med1 = {
        id: 'MED1',
        name: 'Medicine 1',
        flagged: true
      };
      const med2 = {
        id: 'MED2',
        name: 'Medicine 2',
        flagged: false
      };
      const med3 = {
        id: 'MED3',
        name: 'Medicine 3',
        flagged: true
      };
      
      await ctx.stub.putState('MED1', Buffer.from(JSON.stringify(med1)));
      await ctx.stub.putState('MED2', Buffer.from(JSON.stringify(med2)));
      await ctx.stub.putState('MED3', Buffer.from(JSON.stringify(med3)));
      
      // Act
      const result = await contract.GetFlaggedMedicines(ctx);
      
      // Assert
      const medicines = JSON.parse(result);
      expect(medicines).to.be.an('array');
      expect(medicines.length).to.equal(2);
      
      const medicineIds = medicines.map(med => med.id);
      expect(medicineIds).to.include('MED1');
      expect(medicineIds).to.include('MED3');
      expect(medicineIds).to.not.include('MED2');
    });
  });
});