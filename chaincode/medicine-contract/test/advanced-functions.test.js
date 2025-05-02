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

describe('Medicine Contract - Advanced Functions', () => {
  let contract;
  let ctx;

  beforeEach(() => {
    // Create a fresh contract and context before each test
    contract = new MedicineContract();
    ctx = new MockContext();
    ctx.stub.state = new Map();
    ctx.stub.privateData = new Map();
    ctx.stub.args = [];
    ctx.stub.setMSPID('Org1MSP');
  });

  describe('AssignDistributorsToMedicine', () => {
    it('should assign distributors to a medicine', async () => {
      const id = 'MED1';
      const medicine = {
        id,
        name: 'Test Medicine',
        manufacturer: 'PharmaMed',
        currentOwner: 'PharmaMed',
        status: 'Manufactured'
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
      
      const distributors = ['Distributor1', 'Distributor2', 'Distributor3'];
      const distributorsJSON = JSON.stringify(distributors);
      const result = await contract.AssignDistributorsToMedicine(
        ctx,
        id,
        distributorsJSON
      );
      
      const medData = await ctx.stub.getState(id);
      const updatedMedicine = JSON.parse(medData.toString());
      
      expect(updatedMedicine.assignedDistributors).to.deep.equal(distributors);
    });
    
    it('should throw error when medicine does not exist', async () => {
      const distributors = ['Distributor1', 'Distributor2'];
      const distributorsJSON = JSON.stringify(distributors);
      
      await expect(
        contract.AssignDistributorsToMedicine(
          ctx,
          'NONEXISTENT',
          distributorsJSON
        )
      ).to.be.rejectedWith('Medicine NONEXISTENT does not exist');
    });
    
    it('should throw error with invalid distributors JSON', async () => {
      const id = 'MED1';
      const medicine = {
        id,
        name: 'Test Medicine',
        manufacturer: 'PharmaMed'
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
      
      await expect(
        contract.AssignDistributorsToMedicine(
          ctx,
          id,
          'invalid-json'
        )
      ).to.be.rejectedWith('Invalid distributors JSON format');
    });
  });

  describe('UpdateEnhancedSupplyChain', () => {
    it('should update medicine with enhanced supply chain data', async () => {
      const id = 'MED1';
      const medicine = {
        id,
        name: 'Test Medicine',
        manufacturer: 'PharmaMed',
        currentOwner: 'PharmaMed',
        status: 'Manufactured',
        mainPhase: 'Production',
        supplyChain: []
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));

      const mockTimestamp = {
        seconds: { low: 1712745600 },
        nanos: 0
      };
      ctx.stub.txTimestamp = mockTimestamp;
      
      const newStatus = 'Quality Checked';
      const phaseCategory = 'QualityAssurance';
      const locationData = JSON.stringify({
        facility: 'PharmaMed QA Lab',
        address: '123 Pharma Street',
        city: 'Dublin',
        country: 'Ireland',
        gpsCoordinates: {
          latitude: 53.349805,
          longitude: -6.26031
        }
      });
      
      const handlerData = JSON.stringify({
        organization: 'PharmaMed QA',
        department: 'Quality Control',
        personId: 'QA-123',
        personName: 'John Quality'
      });
      
      const transportData = JSON.stringify({
        method: 'Internal Transfer',
        vehicleId: 'INT-001',
        carrier: 'PharmaMed Logistics',
        departureTime: '2025-04-10T10:00:00Z',
        estimatedArrival: '2025-04-10T10:30:00Z'
      });
      
      const documents = JSON.stringify([
        {
          type: 'QA Report',
          id: 'QA-2025-042',
          issued: '2025-04-10T12:00:00Z',
          verificationHash: 'abc123def456'
        }
      ]);
      
      const notes = 'Quality check completed successfully. All tests passed.';
      
      const result = await contract.UpdateEnhancedSupplyChain(
        ctx,
        id,
        newStatus,
        phaseCategory,
        locationData,
        handlerData,
        transportData,
        documents,
        notes
      );
      
      // Assert
      const medData = await ctx.stub.getState(id);
      const updatedMedicine = JSON.parse(medData.toString());
      
      expect(updatedMedicine.currentStatus).to.equal(newStatus);
      expect(updatedMedicine.mainPhase).to.equal(phaseCategory);
      expect(updatedMedicine.supplyChain.length).to.equal(1);
      
      const latestEntry = updatedMedicine.supplyChain[0];
      expect(latestEntry.status).to.equal(newStatus);
      expect(latestEntry.phase).to.equal(phaseCategory);
      expect(latestEntry.notes).to.equal(notes);
      
      // Verify complex objects
      expect(latestEntry.location).to.deep.equal(JSON.parse(locationData));
      expect(latestEntry.handler).to.deep.equal(JSON.parse(handlerData));
      expect(latestEntry.transportInfo).to.deep.equal(JSON.parse(transportData));
      expect(latestEntry.documents).to.deep.equal(JSON.parse(documents));
    });
  });

  describe('RecordScan', () => {
    it('should record scanning activity in medicine history', async () => {
      const id = 'MED1';
      const medicine = {
        id,
        name: 'Test Medicine',
        manufacturer: 'PharmaMed',
        supplyChain: []
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));

      // Mock timestamp for deterministic testing
      ctx.stub.txTimestamp = {
        seconds: { low: 1712745600 },
        nanos: 0
      };
      
      // Act
      const organization = 'HealthCare Clinic';
      const role = 'Pharmacist';
      const username = 'Dr. Smith';
      const location = 'Dublin Clinic';
      
      const result = await contract.RecordScan(
        ctx,
        id,
        organization,
        role,
        username,
        location
      );
      
      // Assert
      const medData = await ctx.stub.getState(id);
      const updatedMedicine = JSON.parse(medData.toString());
      
      expect(updatedMedicine.supplyChain.length).to.equal(1);
      
      const scanEntry = updatedMedicine.supplyChain[0];
      expect(scanEntry.status).to.equal('Scanned');
      expect(scanEntry.location).to.equal(location);
      expect(scanEntry.handler).to.equal(organization);
      expect(scanEntry.notes).to.include(username);
      expect(scanEntry.notes).to.include(role);
    });
  });
});