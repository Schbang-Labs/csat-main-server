import mongoose from 'mongoose';

/**
 * Department Model
 * Stores the 7 departments/service lines available in the CSAT system
 */
const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    // Whether this department has proper SBU names (true for Solutions, false for others)
    hasSBUs: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: 'departments',
  }
);

// Indexes - name is already unique via schema

/**
 * Static: Get all active departments
 * @returns {Promise<Array>}
 */
departmentSchema.statics.getActive = async function () {
  return this.find({ isActive: true });
};

const Department = mongoose.model('Department', departmentSchema);

export default Department;
