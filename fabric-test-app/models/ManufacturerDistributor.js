const mongoose = require('mongoose');

const ManufacturerDistributorSchema = new mongoose.Schema({
    manufacturerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    distributorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    manufacturerOrg: {
        type: String,
        required: true
    },
    distributorOrg: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    medicines: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

ManufacturerDistributorSchema.index({ manufacturerOrg: 1, distributorOrg: 1 }, { unique: true });

module.exports = mongoose.model('ManufacturerDistributor', ManufacturerDistributorSchema);