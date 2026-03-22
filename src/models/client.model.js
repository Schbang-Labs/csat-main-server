import mongoose from 'mongoose';

/**
 * Client Model
 * Stores client point-of-contact (POC) details
 * One brand can have multiple POCs, and the same person may be POC for different services
 */
const clientSchema = new mongoose.Schema(
  {
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    // Which departments/services this POC is responsible for
    serviceMapping: [
      {
        department: {
          type: String,
          required: true,
        },
        // Service IDs under this department for this client
        subservices: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service',
          },
        ],
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'clients',
  }
);

// Indexes
clientSchema.index({ brandId: 1 });
clientSchema.index({ phone: 1 });
clientSchema.index({ 'serviceMapping.department': 1 });
clientSchema.index({ 'serviceMapping.subservices': 1 });

// Compound unique: same person shouldn't be duplicated for same brand+phone
clientSchema.index({ brandId: 1, phone: 1 }, { unique: true });

/**
 * Static: Get all clients/POCs for a brand
 * @param {ObjectId} brandId
 * @returns {Promise<Array>}
 */
clientSchema.statics.getByBrand = async function (brandId) {
  return this.find({ brandId, isActive: true });
};

/**
 * Static: Get clients by phone number
 * @param {string} phone
 * @returns {Promise<Array>}
 */
clientSchema.statics.getByPhone = async function (phone) {
  return this.find({ phone, isActive: true }).populate('brandId', 'name slug');
};

/**
 * Static: Get clients by department
 * @param {string} department
 * @returns {Promise<Array>}
 */
clientSchema.statics.getByDepartment = async function (department) {
  return this.find({
    'serviceMapping.department': department,
    'serviceMapping.isActive': true,
    isActive: true,
  }).populate('brandId', 'name slug');
};

/**
 * Static: Get or create client by brand and phone
 * @param {ObjectId} brandId
 * @param {string} phone
 * @param {Object} clientData
 * @returns {Promise<Document>}
 */
clientSchema.statics.findOrCreate = async function (
  brandId,
  phone,
  clientData
) {
  let client = await this.findOne({ brandId, phone });
  if (!client) {
    client = await this.create({
      brandId,
      phone,
      ...clientData,
    });
  }
  return client;
};

const Client = mongoose.model('Client', clientSchema);

export default Client;
