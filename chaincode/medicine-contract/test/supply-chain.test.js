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

describe('Medicine Contract - Supply Chain Scenarios', () => {
  let contract;
  let ctx;

  beforeEach(() => {
    contract = new MedicineContract();
    ctx = new MockContext();
    ctx.stub.state = new Map();
    ctx.stub.privateData = new Map();
    ctx.stub.args = [];
  });

  describe('End-to-End Supply Chain Flow', () => {
    it('should track a medicine through its entire supply chain journey', async () => {
      // 1. Register a new medicine
      const id = 'MED-E2E-001';
      const name = 'Aspirin 100mg';
      const manufacturer = 'PharmaCo Ltd';
      const batchNumber = 'PCL-2025-123';
      const manufacturingDate = '2025-01-10';
      const expirationDate = '2027-01-10';
      const registrationLocation = 'Factory, Dublin';
      
      // Set timestamp for each stage to have deterministic testing
      ctx.stub.setTxTimestamp(1704931200, 0);
      
      // Register the medicine
      await contract.RegisterMedicine(
        ctx, 
        id, 
        name, 
        manufacturer, 
        batchNumber, 
        manufacturingDate, 
        expirationDate, 
        registrationLocation, 
        null
      );
      
      // Verify initial state
      let medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.status).to.equal('Manufactured');
      expect(medicine.currentOwner).to.equal(manufacturer);
      expect(medicine.supplyChain.length).to.equal(1);

      ctx.stub.setTxTimestamp(1705017600, 0);
      await contract.UpdateSupplyChain(
        ctx,
        id,
        manufacturer,
        'Quality Check',
        'QA Lab, Dublin',
        'All quality checks passed'
      );
      
      // Verify Quality Check state
      medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.status).to.equal('Quality Check');
      expect(medicine.supplyChain.length).to.equal(2);

      await contract.AssignDistributorsToMedicine(
        ctx,
        id,
        JSON.stringify(['National Distributor', 'City Pharmacy'])
      );
      
      // 3. Transfer to Distributor
      ctx.stub.setTxTimestamp(1705104000, 0);
      await contract.UpdateSupplyChain(
        ctx,
        id,
        'National Distributor',
        'In Distribution',
        'Distribution Center, Cork',
        'Received at central distribution'
      );
      
      // Verify Distributor state
      medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.status).to.equal('In Distribution');
      expect(medicine.currentOwner).to.equal('National Distributor');
      expect(medicine.supplyChain.length).to.equal(3);

      // 4. Flagging test
      ctx.stub.setTxTimestamp(1705190400, 0);
      await contract.FlagMedicine(
        ctx,
        id,
        'Quality Inspector',
        'Packaging damage observed',
        'Distribution Center, Cork'
      );
      
      // Verify Flagged state
      medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.status).to.equal('Flagged');
      expect(medicine.flagged).to.be.true;
      expect(medicine.supplyChain.length).to.equal(4);
   
      ctx.stub.setTxTimestamp(1705276800, 0);
      
      const locationData = JSON.stringify({
        facility: 'Medicine Repackaging Center',
        city: 'Cork',
        country: 'Ireland'
      });
      
      const handlerData = JSON.stringify({
        organization: 'National Distributor',
        department: 'Quality Control',
        personId: 'QC-567'
      });
      
      const documents = JSON.stringify([
        {
          type: 'Repackaging Report',
          id: 'RPK-2025-001',
          issued: '2025-01-14T10:30:00Z'
        }
      ]);
      
      await contract.UpdateEnhancedSupplyChain(
        ctx,
        id,
        'Repackaged',
        'Remediation',
        locationData,
        handlerData,
        '',
        documents,
        'Packaging replaced and product verified as undamaged'
      );

      medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.currentStatus).to.equal('Repackaged');
      expect(medicine.mainPhase).to.equal('Remediation');
      expect(medicine.supplyChain.length).to.equal(5);
    
      ctx.stub.setTxTimestamp(1705363200, 0);
      await contract.UpdateSupplyChain(
        ctx,
        id,
        'City Pharmacy',
        'At Pharmacy',
        'Main Street Pharmacy, Dublin',
        'Delivered to pharmacy'
      );
      
      // Verify Pharmacy state
      medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.status).to.equal('At Pharmacy');
      expect(medicine.currentOwner).to.equal('City Pharmacy');
      expect(medicine.supplyChain.length).to.equal(6);
    
      ctx.stub.setTxTimestamp(1705449600, 0);
      await contract.UpdateSupplyChain(
        ctx,
        id,
        'City Pharmacy',
        'Order Complete',
        'Main Street Pharmacy, Dublin',
        'Dispensed to patient'
      );
      
      // Verify Sold state
      medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.status).to.equal('Order Complete');
      expect(medicine.supplyChain.length).to.equal(7);
      
      ctx.stub.setTxTimestamp(1705536000, 0);
      await contract.UpdateSupplyChain(
        ctx,
        id,
        'PublicUser',
        'Claimed',
        'Patient App',
        'Medicine verified by patient'
      );
      
      // Verify final Claimed state
      medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.status).to.equal('Claimed');
      expect(medicine.currentOwner).to.equal('PublicUser');
      expect(medicine.supplyChain.length).to.equal(8);
      
      // Full journey verification
      const supplyChainStatuses = medicine.supplyChain.map(entry => entry.status);
      expect(supplyChainStatuses).to.deep.equal([
        'Manufactured',
        'Quality Check', 
        'In Distribution',
        'Flagged',
        'Repackaged',
        'At Pharmacy',
        'Order Complete',
        'Claimed'
      ]);
    });
  });

  describe('Supply Chain Logic Rules', () => {
    beforeEach(async () => {
      // Create a test medicine in "Order Complete" status for testing claim rules
      const id = 'MED-RULES-001';
      const medicine = {
        id,
        name: 'Test Medicine',
        manufacturer: 'TestCo',
        currentOwner: 'Pharmacy',
        expirationDate: '2027-01-01',
        status: 'Order Complete',
        flagged: false,
        supplyChain: [
          {
            timestamp: '2025-01-01T10:00:00Z',
            location: 'Factory',
            handler: 'TestCo',
            status: 'Manufactured',
            notes: 'Initial production'
          },
          {
            timestamp: '2025-01-05T10:00:00Z',
            location: 'Pharmacy',
            handler: 'Pharmacy',
            status: 'Order Complete',
            notes: 'Ready for patient'
          }
        ]
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
    });

    it('should allow claiming a medicine in Order Complete status by PublicUser', async () => {
      // Act
      const result = await contract.UpdateSupplyChain(
        ctx,
        'MED-RULES-001',
        'PublicUser',
        'Claimed',
        'Patient App',
        'Patient verified medicine'
      );
      
      // Assert
      const medicine = JSON.parse(result);
      expect(medicine.status).to.equal('Claimed');
      expect(medicine.currentOwner).to.equal('PublicUser');
    });

    it('should reject claiming by non-PublicUser', async () => {
      // Act & Assert
      await expect(
        contract.UpdateSupplyChain(
          ctx,
          'MED-RULES-001',
          'SomeoneElse',
          'Claimed',
          'Patient App',
          'Patient verified medicine'
        )
      ).to.be.rejectedWith('Only PublicUser can update a medicine in Order Complete status');
    });

    it('should reject non-Claimed status update by PublicUser', async () => {
      // Act & Assert
      await expect(
        contract.UpdateSupplyChain(
          ctx,
          'MED-RULES-001',
          'PublicUser',
          'SomeOtherStatus',
          'Patient App',
          'Notes'
        )
      ).to.be.rejectedWith('PublicUser can only update Order Complete status to Claimed');
    });

    it('should reject claiming an expired medicine', async () => {
      // Arrange - Create an expired medicine
      const id = 'MED-EXPIRED-001';
      const medicine = {
        id,
        name: 'Expired Medicine',
        manufacturer: 'TestCo',
        currentOwner: 'Pharmacy',
        expirationDate: '2024-01-01',
        status: 'Order Complete',
        flagged: false,
        supplyChain: [
          {
            timestamp: '2025-01-01T10:00:00Z',
            location: 'Factory',
            handler: 'TestCo',
            status: 'Manufactured',
            notes: 'Initial production'
          },
          {
            timestamp: '2025-01-05T10:00:00Z',
            location: 'Pharmacy',
            handler: 'Pharmacy',
            status: 'Order Complete',
            notes: 'Ready for patient'
          }
        ]
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
      
      // Act & Assert
      await expect(
        contract.UpdateSupplyChain(
          ctx,
          id,
          'PublicUser',
          'Claimed',
          'Patient App',
          'Patient verified medicine'
        )
      ).to.be.rejectedWith('Cannot claim an expired medicine');
    });

    it('should reject claiming a flagged medicine', async () => {
      // Arrange - Create a flagged medicine
      const id = 'MED-FLAGGED-001';
      const medicine = {
        id,
        name: 'Flagged Medicine',
        manufacturer: 'TestCo',
        currentOwner: 'Pharmacy',
        expirationDate: '2027-01-01', // Future date
        status: 'Order Complete',
        flagged: true,
        flagNotes: 'Suspected counterfeit',
        supplyChain: [
          {
            timestamp: '2025-01-01T10:00:00Z',
            location: 'Factory',
            handler: 'TestCo',
            status: 'Manufactured',
            notes: 'Initial production'
          },
          {
            timestamp: '2025-01-05T10:00:00Z',
            location: 'Pharmacy',
            handler: 'Pharmacy',
            status: 'Order Complete',
            notes: 'Ready for patient'
          }
        ]
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
      
      // Act & Assert
      await expect(
        contract.UpdateSupplyChain(
          ctx,
          id,
          'PublicUser',
          'Claimed',
          'Patient App',
          'Patient verified medicine'
        )
      ).to.be.rejectedWith('Cannot claim a flagged medicine');
    });

    it('should reject updates to a claimed medicine', async () => {
      const id = 'MED-CLAIMED-001';
      const medicine = {
        id,
        name: 'Claimed Medicine',
        manufacturer: 'TestCo',
        currentOwner: 'PublicUser',
        status: 'Claimed',
        supplyChain: [
          {
            timestamp: '2025-01-01T10:00:00Z',
            location: 'Factory',
            handler: 'TestCo',
            status: 'Manufactured',
            notes: 'Initial production'
          },
          {
            timestamp: '2025-01-10T10:00:00Z',
            location: 'Patient App',
            handler: 'PublicUser',
            status: 'Claimed',
            notes: 'Patient claimed medicine'
          }
        ]
      };
      await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
      
      // Act & Assert
      await expect(
        contract.UpdateSupplyChain(
          ctx,
          id,
          'TestCo',
          'Some Status',
          'Some Location',
          'Some Notes'
        )
      ).to.be.rejectedWith('Cannot update a medicine that has already been Claimed');
    });
  });
});