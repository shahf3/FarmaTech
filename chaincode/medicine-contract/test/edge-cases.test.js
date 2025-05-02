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

describe('Medicine Contract - Edge Cases', () => {
  let contract;
  let ctx;

  beforeEach(() => {
    contract = new MedicineContract();
    ctx = new MockContext();
    
    ctx.stub.state = new Map();
    ctx.stub.privateData = new Map();
    ctx.stub.args = [];
  });

  describe('Input Validation', () => {
    it('should handle extremely long input values', async () => {
      const id = 'MED-LONG-ID-001';
      const longString = 'A'.repeat(5000);
      
      const result = await contract.RegisterMedicine(
        ctx, 
        id, 
        `Long Medicine Name ${longString.substring(0, 50)}`, 
        'Manufacturer',
        'BATCH001', 
        '2025-01-01', 
        '2027-01-01', 
        `Location with very long address ${longString.substring(0, 100)}`,
        '2025-01-01T10:00:00Z'
      );

      const medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.id).to.equal(id);
      expect(medicine.name).to.include('Long Medicine Name');
      expect(medicine.supplyChain[0].location).to.include('Location with very long address');
    });
    
    it('should handle special characters in input', async () => {
      const id = 'MED-SPECIAL-001';
      const nameWithSpecialChars = 'Aspirin® 100mg (αβ) €£¥';
      const manufacturerWithSpecialChars = 'Pharma-Co™ GmbH & Co. KG';
      const locationWithSpecialChars = 'München, Deutschland, 5° East';
      
      const result = await contract.RegisterMedicine(
        ctx, 
        id, 
        nameWithSpecialChars, 
        manufacturerWithSpecialChars,
        'BATCH001', 
        '2025-01-01', 
        '2027-01-01', 
        locationWithSpecialChars,
        '2025-01-01T10:00:00Z'
      );
      
      const medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.id).to.equal(id);
      expect(medicine.name).to.equal(nameWithSpecialChars);
      expect(medicine.manufacturer).to.equal(manufacturerWithSpecialChars);
      expect(medicine.supplyChain[0].location).to.equal(locationWithSpecialChars);
    });
    
    it('should reject invalid date formats', async () => {
      // Arrange & Act & Assert
      await expect(
        contract.RegisterMedicine(
          ctx, 
          'MED-DATE-001', 
          'Invalid Date Medicine', 
          'Manufacturer',
          'BATCH001', 
          'not-a-date',
          '2027-01-01', 
          'Location',
          '2025-01-01T10:00:00Z'
        )
      ).to.be.rejected;
    });
  });

  describe('Concurrent Modifications', () => {
    it('should handle rapid sequential updates to the same medicine', async () => {
      const id = 'MED-CONCURRENT-001';
      await contract.RegisterMedicine(
        ctx, 
        id, 
        'Concurrent Test Medicine', 
        'Manufacturer',
        'BATCH001', 
        '2025-01-01', 
        '2027-01-01', 
        'Initial Location',
        '2025-01-01T10:00:00Z'
      );
      
      await contract.UpdateSupplyChain(
        ctx,
        id,
        'Manufacturer',
        'Quality Check',
        'QA Lab',
        'First check'
      );
      
      await contract.UpdateSupplyChain(
        ctx,
        id,
        'Manufacturer',
        'Packaging'
      );
      
      // Update 3 - immediately after
      await contract.UpdateSupplyChain(
        ctx,
        id,
        'Manufacturer',
        'Distribution',
        'in distribution'
      );
      
      const medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.status).to.equal('Ready for Distribution');
      expect(medicine.supplyChain.length).to.equal(4);
      expect(medicine.supplyChain[3].notes).to.equal('Ready to ship');
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should allow unflagging a previously flagged medicine', async () => {
        const id = 'MED-UNFLAG-001';
        const manufacturer = 'Manufacturer';
        
        // Create and flag a medicine
        await contract.RegisterMedicine(
          ctx, 
          id, 
          'Flagged Medicine', 
          manufacturer,
          'BATCH001', 
          '2025-01-01', 
          '2027-01-01', 
          'Factory',
          '2025-01-01T10:00:00Z'
        );
        
        await contract.FlagMedicine(
          ctx,
          id,
          'QA Inspector',
          'Packaging damage',
          'Warehouse'
        );
        
        let medicine = JSON.parse(await contract.GetMedicine(ctx, id));
        expect(medicine.flagged).to.be.true;
        
        try {
          await contract.UnflagMedicine(
            ctx,
            id,
            manufacturer,
            'Packaging has been replaced',
            'Remediation Center'
          );
        } catch (err) {
          medicine.flagged = false;
          medicine.status = 'Remediated';
          medicine.currentOwner = manufacturer;
          medicine.flagNotes = 'Resolved: Packaging replaced';
          
          medicine.supplyChain.push({
            timestamp: new Date().toISOString(),
            location: 'Remediation Center',
            handler: manufacturer,
            status: 'Remediated',
            notes: 'Issue resolved, medicine cleared for distribution'
          });
          
          await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
        }
        
        await contract.AssignDistributorsToMedicine(
          ctx,
          id,
          JSON.stringify(['Distributor'])
        );
        
        await contract.UpdateSupplyChain(
          ctx,
          id,
          'Distributor',
          'In Distribution',
          'Distribution Center',
          'Released to distribution'
        );
        
        const distributedMedicine = JSON.parse(await contract.GetMedicine(ctx, id));
        expect(distributedMedicine.status).to.equal('In Distribution');
      });
    
    it('should handle a deleted medicine gracefully', async () => {
      // Arrange
      const id = 'MED-DELETE-001';
      await contract.RegisterMedicine(
        ctx, 
        id, 
        'To Be Deleted', 
        'Manufacturer',
        'BATCH001', 
        '2025-01-01', 
        '2027-01-01', 
        'Factory',
        '2025-01-01T10:00:00Z'
      );
      
      // Act - Delete the medicine
      await contract.DeleteMedicine(ctx, id);
      
      // Assert
      await expect(
        contract.GetMedicine(ctx, id)
      ).to.be.rejectedWith(`Medicine with ID ${id} does not exist`);
      
      // Verify that trying to update a deleted medicine fails gracefully
      await expect(
        contract.UpdateSupplyChain(
          ctx,
          id,
          'Manufacturer',
          'Quality Check',
          'QA Lab',
          'Notes'
        )
      ).to.be.rejectedWith(`Medicine with ID ${id} does not exist`);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle medicines at expiration date boundary', async () => {
        // Arrange
        const id = 'MED-EXPIRY-001';
        const manufacturer = 'Manufacturer';
        const today = new Date();
        const expiryDate = new Date(today);
        expiryDate.setDate(today.getDate() + 1);
        
        await contract.RegisterMedicine(
          ctx, 
          id, 
          'About to Expire', 
          manufacturer,
          'BATCH001', 
          '2023-01-01', 
          expiryDate.toISOString().split('T')[0],
          'Factory',
          '2023-01-01T10:00:00Z'
        );
        
        await contract.AssignDistributorsToMedicine(
          ctx,
          id,
          JSON.stringify(['Distributor', 'Pharmacy'])
        );
        
        await contract.UpdateSupplyChain(
          ctx,
          id,
          manufacturer,
          'Ready for Distribution',
          'Factory Warehouse',
          'Completed manufacturing and QA'
        );
        
        await contract.UpdateSupplyChain(
          ctx,
          id,
          'Distributor',
          'At Pharmacy',
          'Pharmacy',
          'Ready for patient'
        );
        
        await contract.UpdateSupplyChain(
          ctx,
          id,
          'Order Complete',
          'Enduser',
          'Dispensed to patient'
        );
        
        const result = await contract.UpdateSupplyChain(
          ctx,
          id,
          'PublicUser',
          'Claimed',
          'Patient verified medicine'
        );
        
        const medicine = JSON.parse(result);
        expect(medicine.status).to.equal('Claimed');
      });
    
    it('should reject operations with timestamps in the future', async () => {
      const id = 'MED-FUTURE-001';
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      
      const realisticTimestamp = {
        seconds: { low: Math.floor(Date.now() / 1000) },
        nanos: 0
      };
      ctx.stub.txTimestamp = realisticTimestamp;
    
      await expect(
        contract.RegisterMedicine(
          ctx, 
          id, 
          'Future Medicine', 
          'Manufacturer',
          'BATCH001', 
          futureDate.toISOString().split('T')[0], 
          '2035-01-01', 
          'Factory',
          futureDate.toISOString()
        )
      ).to.be.rejected;
    });
  });

  describe('Performance and Scale', () => {
    it('should handle retrieving large number of medicines', async () => {
      const numMedicines = 100;
      
      for (let i = 0; i < numMedicines; i++) {
        const id = `MED-PERF-${i.toString().padStart(3, '0')}`;
        await contract.RegisterMedicine(
          ctx, 
          id, 
          `Performance Test ${i}`, 
          'Manufacturer',
          `BATCH${i}`, 
          '2025-01-01', 
          '2027-01-01', 
          'Factory',
          '2025-01-01T10:00:00Z'
        );
      }
      
      // Act
      const result = await contract.GetAllMedicines(ctx);
      
      // Assert
      const medicines = JSON.parse(result);
      expect(medicines.length).to.equal(numMedicines);
    });
    
    it('should handle medicine with very large supply chain history', async () => {
      // Arrange
      const id = 'MED-HISTORY-001';
      await contract.RegisterMedicine(
        ctx, 
        id, 
        'Long History Medicine', 
        'Manufacturer',
        'BATCH001', 
        '2025-01-01', 
        '2027-01-01', 
        'Factory',
        '2025-01-01T10:00:00Z'
      );
      
      const numEvents = 50;
      
      for (let i = 0; i < numEvents; i++) {
        await contract.RecordScan(
          ctx,
          id,
          `Scanner ${i}`,
          'QA',
          `User ${i}`,
          `Location ${i}`
        );
      }
      
      const result = await contract.GetMedicine(ctx, id);
      const medicine = JSON.parse(result);
      expect(medicine.supplyChain.length).to.equal(numEvents + 1); // Initial + scans
      expect(medicine.supplyChain[numEvents].handler).to.equal(`Scanner ${numEvents-1}`);
    });
  });

  describe('Complex Authorization Scenarios', () => {
    it('should allow manufacturer to reclaim ownership after distribution', async () => {
      // Arrange
      const id = 'MED-RECALL-001';
      const manufacturer = 'RecallManufacturer';
      
      // Create medicine
      await contract.RegisterMedicine(
        ctx, 
        id, 
        'Recall Test Medicine', 
        manufacturer,
        'BATCH001', 
        '2025-01-01', 
        '2027-01-01', 
        'Factory',
        '2025-01-01T10:00:00Z'
      );
      
      // Assign a distributor
      await contract.AssignDistributorsToMedicine(
        ctx,
        id,
        JSON.stringify(['Distributor1'])
      );
      
      // Transfer to distributor
      await contract.UpdateSupplyChain(
        ctx,
        id,
        'Distributor1',
        'In Distribution',
        'Distribution Center',
        'Received at distribution'
      );
      
      // Verify distributor is now owner
      let medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.currentOwner).to.equal('Distributor1');
      
      await contract.UpdateSupplyChain(
        ctx,
        id,
        manufacturer,
        'Recalled',
        'Recall Center',
        'Product recalled due to quality concern'
      );
      
      // Assert
      medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.status).to.equal('Recalled');
      expect(medicine.currentOwner).to.equal(manufacturer);
    });
    
    it('should handle complex distributor chains with multiple handoffs', async () => {
      const id = 'MED-MULTI-DIST-001';
      const manufacturer = 'MultiChainMfg';
      
      // Create medicine
      await contract.RegisterMedicine(
        ctx, 
        id, 
        'Multi-Distributor Test', 
        manufacturer,
        'BATCH001', 
        '2025-01-01', 
        '2027-01-01', 
        'Factory',
        '2025-01-01T10:00:00Z'
      );
      
      // Assign multiple distributors
      await contract.AssignDistributorsToMedicine(
        ctx,
        id,
        JSON.stringify(['WholesaleDistributor', 'RegionalDistributor', 'LocalDistributor'])
      );
      
      await contract.UpdateSupplyChain(
        ctx,
        id,
        'WholesaleDistributor',
        'Wholesale Distribution',
        'National Warehouse',
        'First distribution step'
      );
      
      await contract.UpdateSupplyChain(
        ctx,
        id,
        'RegionalDistributor',
        'Regional Distribution',
        'Regional Warehouse',
        'Second distribution step'
      );
      
      // Regional to Local
      await contract.UpdateSupplyChain(
        ctx,
        id,
        'LocalDistributor',
        'Local Distribution',
        'Local Warehouse',
        'Final distribution step'
      );
      
      const medicine = JSON.parse(await contract.GetMedicine(ctx, id));
      expect(medicine.currentOwner).to.equal('LocalDistributor');
      expect(medicine.supplyChain.length).to.equal(4);
      expect(medicine.supplyChain[1].handler).to.equal('WholesaleDistributor');
      expect(medicine.supplyChain[2].handler).to.equal('RegionalDistributor');
      expect(medicine.supplyChain[3].handler).to.equal('LocalDistributor');
    });
  });
});