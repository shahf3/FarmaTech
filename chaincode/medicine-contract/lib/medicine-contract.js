'use strict';

const { Contract } = require('fabric-contract-api');

class MedicineContract extends Contract {
    // Initialize ledger with some sample medicines
    async InitLedger(ctx) {
        const medicines = [
            {
                id: 'MED1',
                name: 'Paracetamol 500mg',
                manufacturer: 'PharmaCo Ltd',
                batchNumber: 'PCL-2025-001',
                manufacturingDate: '2025-01-15',
                expirationDate: '2028-01-15',
                currentOwner: 'PharmaCo Ltd',
                status: 'Manufactured',
                qrCode: 'QR-PCL-2025-001',
                supplyChain: [
                    {
                        timestamp: '2025-01-15T10:30:45Z',
                        location: 'Dublin, Ireland',
                        handler: 'PharmaCo Ltd',
                        status: 'Manufactured',
                        notes: 'Initial production completed',
                    },
                ],
                flagged: false,
                flagNotes: '',
            },
            {
                id: 'MED2',
                name: 'Amoxicillin 250mg',
                manufacturer: 'MediGen Ireland',
                batchNumber: 'MGI-2025-042',
                manufacturingDate: '2025-02-03',
                expirationDate: '2027-02-03',
                currentOwner: 'HSE Distribution Center',
                status: 'In Distribution',
                qrCode: 'QR-MGI-2025-042',
                supplyChain: [
                    {
                        timestamp: '2025-02-03T09:15:22Z',
                        location: 'Galway, Ireland',
                        handler: 'MediGen Ireland',
                        status: 'Manufactured',
                        notes: 'Production batch completed',
                    },
                    {
                        timestamp: '2025-02-10T14:22:10Z',
                        location: 'Dublin, Ireland',
                        handler: 'HSE Distribution Center',
                        status: 'In Distribution',
                        notes: 'Received at central distribution',
                    },
                ],
                flagged: false,
                flagNotes: '',
            },
        ];

        for (const medicine of medicines) {
            await ctx.stub.putState(
                medicine.id,
                Buffer.from(JSON.stringify(medicine))
            );
            console.log(`Medicine ${medicine.id} initialized`);
        }
    }

    // Helper function to validate date formats
    _validateDate(dateString) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            return false;
        }

        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return false;
        }

        return true;
    }

    _isDateInFuture(dateString) {
        const inputDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return inputDate > today;
    }

    _validateDateLogic(manufacturingDate, expirationDate) {
        const mfgDate = new Date(manufacturingDate);
        const expDate = new Date(expirationDate);
        return expDate > mfgDate;
    }

    // Register a new medicine
    async RegisterMedicine(
        ctx,
        id,
        name,
        manufacturer,
        batchNumber,
        manufacturingDate,
        expirationDate,
        registrationLocation,
        timestamp
    ) {
        console.log('========= RegisterMedicine =========');
        console.log(`Medicine ID: ${id}`);

        // Check if medicine with ID already exists
        const exists = await this.MedicineExists(ctx, id);
        if (exists) {
            throw new Error(`Medicine with ID ${id} already exists`);
        }

        if (!this._validateDate(manufacturingDate)) {
            throw new Error(`Invalid manufacturing date format: ${manufacturingDate}. Required format: YYYY-MM-DD`);
        }

        if (!this._validateDate(expirationDate)) {
            throw new Error(`Invalid expiration date format: ${expirationDate}. Required format: YYYY-MM-DD`);
        }

        if (this._isDateInFuture(manufacturingDate)) {
            throw new Error(`Manufacturing date cannot be in the future: ${manufacturingDate}`);
        }

        if (!this._validateDateLogic(manufacturingDate, expirationDate)) {
            throw new Error(`Expiration date must be after manufacturing date`);
        }

        name = this._sanitizeField(name, 'name', 200);
        manufacturer = this._sanitizeField(manufacturer, 'manufacturer', 100);
        batchNumber = this._sanitizeField(batchNumber, 'batchNumber', 50);
        registrationLocation = this._sanitizeField(registrationLocation, 'registrationLocation', 200);

        const qrCode = `QR-${batchNumber}`;
        const supplyChainTimestamp = timestamp || '2025-01-01T00:00:00Z';
        const supplyChainEntry = {
            timestamp: supplyChainTimestamp,
            location: registrationLocation || manufacturer.split(' ').pop(),
            handler: manufacturer,
            status: 'Manufactured',
            notes: 'Initial production registration',
        };

        // Create the medicine object
        const medicine = {
            id,
            name,
            manufacturer,
            batchNumber,
            manufacturingDate,
            expirationDate,
            currentOwner: manufacturer,
            status: 'Manufactured',
            qrCode,
            supplyChain: [supplyChainEntry],
            flagged: false,
            flagNotes: '',
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
        return JSON.stringify(medicine);
    }

    _sanitizeField(value, fieldName, maxLength) {
        if (!value) {
            return '';
        }
        
        const trimmed = value.trim();
        
        if (trimmed.length > maxLength) {
            console.log(`Warning: ${fieldName} exceeded max length of ${maxLength}. Truncating.`);
            return trimmed.substring(0, maxLength);
        }
        
        return trimmed;
    }

    // Update medicine supply chain status
    async UpdateSupplyChain(ctx, id, handler, status, location, notes) {
        console.log('========= UpdateSupplyChain =========');
        console.log(`Medicine ID: ${id}`);
        console.log(`Handler: ${handler}`);
        console.log(`Status: ${status}`);
        console.log(`Location: ${location}`);
        console.log(`Notes: ${notes}`);
    
        if (!id || !handler || !status || !location) {
            throw new Error(
                'Missing required parameters: id, handler, status, and location are mandatory'
            );
        }
  
        const exists = await this.MedicineExists(ctx, id);
        if (!exists) {
            throw new Error(`Medicine with ID ${id} does not exist`);
        }
   
        const medicineJSON = await ctx.stub.getState(id);
        const medicine = JSON.parse(medicineJSON.toString());
    
        if (!medicine) {
            throw new Error(`Unable to retrieve medicine with ID ${id}`);
        }
    
        // If medicine is in Order Complete status, only PublicUser can update to Claimed
        if (medicine.status === 'Order Complete') {
            if (handler !== 'PublicUser') {
                throw new Error(
                    `Only PublicUser can update a medicine in Order Complete status. Handler ${handler} is not allowed.`
                );
            }
            if (status !== 'Claimed') {
                throw new Error(
                    `PublicUser can only update Order Complete status to Claimed, not ${status}`
                );
            }

            if (medicine.flagged) {
                throw new Error('Cannot claim a flagged medicine');
            }
            const expirationDate = new Date(medicine.expirationDate);
            const currentDate = new Date();
            if (expirationDate < currentDate) {
                throw new Error('Cannot claim an expired medicine');
            }
        } else if (status === 'Claimed') {
            throw new Error('Claimed status can only be set after Order Complete');
        } else if (medicine.status === 'Claimed') {
            // Prevent any updates to a Claimed medicine
            throw new Error('Cannot update a medicine that has already been Claimed');
        } else {
            const isCurrentOwner = medicine.currentOwner === handler;
            const isManufacturer = medicine.manufacturer === handler;
            
            let isAssignedDistributor = false;
            if (medicine.assignedDistributors) {
                if (Array.isArray(medicine.assignedDistributors)) {
                    isAssignedDistributor = medicine.assignedDistributors.includes(handler);
                } else if (typeof medicine.assignedDistributors === 'string') {
                    isAssignedDistributor = medicine.assignedDistributors.split(',')
                        .map(d => d.trim())
                        .includes(handler);
                }
            }
    
            if (isManufacturer) {
            } 
            else if (handler === 'PublicUser' && status === 'Scanned') {
            }
            
            else if ((handler === 'Regulator' || handler === 'Inspector') && 
                     ['Inspected', 'Approved', 'Recalled'].includes(status)) {
            }

            else if (!isCurrentOwner && !isManufacturer && !isAssignedDistributor) {
                throw new Error(
                    `User ${handler} is not authorized to update this medicine. User must be current owner, manufacturer, or assigned distributor.`
                );
            }
    
            const restrictedStatuses = ['Manufactured', 'Quality Check'];
            if (restrictedStatuses.includes(status) && !isManufacturer) {
                throw new Error(
                    `Only the manufacturer can set status to ${status}`
                );
            }
        }
    
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds =
            txTimestamp.seconds.low * 1000 +
            Math.floor(txTimestamp.nanos / 1000000);
        const timestamp = new Date(milliseconds).toISOString();
    
        // Create a new supply chain entry with deterministic timestamp
        const supplyChainEntry = {
            timestamp,
            location,
            handler,
            status,
            notes: notes || 'No additional notes',
        };
    
        medicine.supplyChain.push(supplyChainEntry);
        medicine.currentOwner = handler;
        medicine.status = status;
        
        if (status === 'Remediated' || status === 'Repackaged') {
            medicine.flagged = false;
            medicine.flagNotes = `Resolved: ${notes || 'Issue remediated'}`;
        }
    
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
        console.log(`Successfully updated supply chain for medicine ${id}`);
        return JSON.stringify(medicine);
    }    

    async FlagMedicine(ctx, id, flaggedBy, reason, location) {
        if (!id || !flaggedBy || !reason || !location) {
            throw new Error(
                'Missing required parameters for flagging medicine'
            );
        }

        const exists = await this.MedicineExists(ctx, id);
        if (!exists) {
            throw new Error(`Medicine with ID ${id} does not exist`);
        }

        const medicineJSON = await ctx.stub.getState(id);
        const medicine = JSON.parse(medicineJSON.toString());
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds =
            txTimestamp.seconds.low * 1000 +
            Math.floor(txTimestamp.nanos / 1000000);
        const timestamp = new Date(milliseconds).toISOString();

        const flagEntry = {
            timestamp,
            location,
            handler: flaggedBy,
            status: 'Flagged',
            notes: reason,
        };

        medicine.supplyChain.push(flagEntry);
        medicine.flagged = true;
        medicine.flagNotes = reason;
        medicine.status = 'Flagged';
        medicine.flaggedTimestamp = timestamp;
        medicine.flaggedBy = flaggedBy;
        medicine.unauthorizedScanDetails = {
            flaggedTimestamp: timestamp,
            flaggedBy: flaggedBy,
            reason: reason,
            location: location,
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));

        return JSON.stringify(medicine);
    }

    async UnflagMedicine(ctx, id, unflaggedBy, resolutionNotes, location) {
        console.log('========= UnflagMedicine =========');
        console.log(`Medicine ID: ${id}`);
        console.log(`Unflagged by: ${unflaggedBy}`);
        console.log(`Location: ${location}`);
        
        if (!id || !unflaggedBy || !resolutionNotes || !location) {
            throw new Error(
                'Missing required parameters for unflagging medicine'
            );
        }
    
        const exists = await this.MedicineExists(ctx, id);
        if (!exists) {
            throw new Error(`Medicine with ID ${id} does not exist`);
        }
    
        const medicineJSON = await ctx.stub.getState(id);
        const medicine = JSON.parse(medicineJSON.toString());
    
        if (!medicine.flagged) {
            throw new Error(`Medicine with ID ${id} is not flagged`);
        }
    
        if (unflaggedBy !== medicine.manufacturer) {
            throw new Error(
                `Only the manufacturer (${medicine.manufacturer}) can unflag a medicine. Attempted by: ${unflaggedBy}`
            );
        }
    
        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds =
            txTimestamp.seconds.low * 1000 +
            Math.floor(txTimestamp.nanos / 1000000);
        const timestamp = new Date(milliseconds).toISOString();
    
        const unflagEntry = {
            timestamp,
            location,
            handler: unflaggedBy,
            status: 'Remediated',
            notes: `Unflagged: ${resolutionNotes}`,
        };

        medicine.supplyChain.push(unflagEntry);
        medicine.flagged = false;
        medicine.flagNotes = `Resolved: ${resolutionNotes}`;
        medicine.status = 'Remediated';
        medicine.unflaggedTimestamp = timestamp;
        medicine.unflaggedBy = unflaggedBy;
    
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
        console.log(`Successfully unflagged medicine ${id}`);
        
        return JSON.stringify(medicine);
    }
    // Get medicine by ID
    async GetMedicine(ctx, id) {
        console.log('========= GetMedicine =========');
        console.log(`Medicine ID: ${id}`);

        const medicineJSON = await ctx.stub.getState(id);
        if (!medicineJSON || medicineJSON.length === 0) {
            throw new Error(`Medicine with ID ${id} does not exist`);
        }
        return medicineJSON.toString();
    }

    // Get all medicines
    async GetAllMedicines(ctx) {
        console.log('========= GetAllMedicines =========');

        const iterator = await ctx.stub.getStateByRange('', '');
        const results = await this._GetAllResults(iterator);
        return JSON.stringify(results);
    }

    // Check if medicine exists
    async MedicineExists(ctx, id) {
        const medicineJSON = await ctx.stub.getState(id);
        return medicineJSON && medicineJSON.length > 0;
    }

    async _GetAllResults(iterator) {
        const results = [];
        let result = await iterator.next();

        while (!result.done) {
            const strValue = Buffer.from(
                result.value.value.toString()
            ).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            results.push(record);
            result = await iterator.next();
        }
        return results;
    }

    // Get flagged medicines for regulators
    async GetFlaggedMedicines(ctx) {
        console.log('========= GetFlaggedMedicines =========');

        const queryString = {
            selector: {
                flagged: true,
            },
        };

        const iterator = await ctx.stub.getQueryResult(
            JSON.stringify(queryString)
        );
        const results = await this._GetAllResults(iterator);
        return JSON.stringify(results);
    }

    // Get medicines by manufacturer
    async GetMedicinesByManufacturer(ctx, manufacturer) {
        console.log('========= GetMedicinesByManufacturer =========');
        console.log(`Manufacturer: ${manufacturer}`);

        const queryString = {
            selector: {
                manufacturer: manufacturer,
            },
        };

        const iterator = await ctx.stub.getQueryResult(
            JSON.stringify(queryString)
        );
        const results = await this._GetAllResults(iterator);
        return JSON.stringify(results);
    }

    // Get medicines (for distributors)
    async GetMedicinesByOwner(ctx, owner) {
        console.log('========= GetMedicinesByOwner =========');
        console.log(`Owner: ${owner}`);

        const iterator = await ctx.stub.getStateByRange('', '');
        let allMedicines = await this._GetAllResults(iterator);

        const filteredMedicines = allMedicines.filter((medicine) => {
            const isCurrentOwner = medicine.currentOwner === owner;
            const isAssignedDistributor =
                medicine.assignedDistributors &&
                Array.isArray(medicine.assignedDistributors) &&
                medicine.assignedDistributors.includes(owner);

            return isCurrentOwner || isAssignedDistributor;
        });
        console.log(
            `Filtered medicines for ${owner}: ${filteredMedicines.length} of ${allMedicines.length}`
        );

        filteredMedicines.forEach((med) => {
            console.log(
                `Medicine ${med.id}: currentOwner=${
                    med.currentOwner
                }, assignedDistributors=${JSON.stringify(
                    med.assignedDistributors || []
                )}`
            );
        });

        return JSON.stringify(filteredMedicines);
    }

    // Delete a medicine
    async DeleteMedicine(ctx, id) {
        console.log('========= DeleteMedicine =========');
        console.log(`Medicine ID: ${id}`);

        const exists = await this.MedicineExists(ctx, id);
        if (!exists) {
            throw new Error(`Medicine with ID ${id} does not exist`);
        }

        return ctx.stub.deleteState(id);
    }

    // Record scanning activity in the medicine's supply chain history
    async RecordScan(ctx, id, organization, role, username, location) {
        console.log('========= RecordScan =========');
        console.log(`Medicine ID: ${id}`);
        console.log(`Scanned by: ${organization} (${role}: ${username})`);
        console.log(`Location: ${location}`);

        if (!id || !organization || !role || !location) {
            throw new Error('Missing required parameters for recording scan');
        }

        const exists = await this.MedicineExists(ctx, id);
        if (!exists) {
            throw new Error(`Medicine with ID ${id} does not exist`);
        }

        // Get the medicine from the ledger
        const medicineJSON = await ctx.stub.getState(id);
        const medicine = JSON.parse(medicineJSON.toString());

        const txTimestamp = ctx.stub.getTxTimestamp();
        const milliseconds =
            txTimestamp.seconds.low * 1000 +
            Math.floor(txTimestamp.nanos / 1000000);
        const timestamp = new Date(milliseconds).toISOString();

        // Create a new supply chain entry for the scan
        const scanEntry = {
            timestamp,
            location,
            handler: organization,
            status: 'Scanned',
            notes: `QR code scanned by ${username} (${role}) from ${organization}`,
        };

        medicine.supplyChain.push(scanEntry);

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(medicine)));
        console.log(`Successfully recorded scan for medicine ${id}`);
        return JSON.stringify(medicine);
    }

    async RegisterManufacturerMapping(ctx, businessName, orgId) {
        const mappingKey = ctx.stub.createCompositeKey('manufacturerMapping', [
            businessName,
        ]);

        const existingBytes = await ctx.stub.getState(mappingKey);
        if (existingBytes && existingBytes.length > 0) {
            const mapping = JSON.parse(existingBytes.toString());
            mapping.orgId = orgId;
            await ctx.stub.putState(
                mappingKey,
                Buffer.from(JSON.stringify(mapping))
            );
            return JSON.stringify(mapping);
        }

        const mapping = {
            businessName: businessName,
            orgId: orgId,
            createdAt: new Date().toISOString(),
        };

        await ctx.stub.putState(
            mappingKey,
            Buffer.from(JSON.stringify(mapping))
        );
        console.log(`Created manufacturer mapping: ${businessName} → ${orgId}`);

        return JSON.stringify(mapping);
    }

    async AssignDistributorsToMedicine(ctx, medicineId, distributorsJSON) {
        // Check if medicine exists
        const medicineBytes = await ctx.stub.getState(medicineId);
        if (!medicineBytes || medicineBytes.length === 0) {
            throw new Error(`Medicine ${medicineId} does not exist`);
        }

        // Get the medicine data
        const medicine = JSON.parse(medicineBytes.toString());

        const currentId = ctx.clientIdentity.getMSPID();
        console.log('Current MSP ID:', currentId);

        // debugging
        const clientMSP = ctx.clientIdentity.getMSPID();
        const clientOrg = clientMSP.replace('MSP', '');
        console.log('Auth Check:', {
            clientMSP: clientMSP,
            clientOrg: clientOrg,
            manufacturer: medicine.manufacturer,
        });

        console.log(
            `DEVELOPMENT MODE: Bypassing manufacturer check for ${medicine.manufacturer}`
        );

        let distributors;
        try {
            distributors = JSON.parse(distributorsJSON);
        } catch (error) {
            throw new Error(
                `Invalid distributors JSON format: ${error.message}`
            );
        }

        medicine.assignedDistributors = distributors;

        // Save to ledger
        await ctx.stub.putState(
            medicineId,
            Buffer.from(JSON.stringify(medicine))
        );

        return JSON.stringify(medicine);
    }
}

module.exports = MedicineContract;