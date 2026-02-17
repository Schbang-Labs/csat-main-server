import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const USER_ROLES = ['user', 'admin', 'head_department', 'sbu'];
const ACCESS_RESOURCE_TYPES = ['department', 'sbu'];

const accessScopeSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      enum: ACCESS_RESOURCE_TYPES,
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      default: null,
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'user',
      trim: true,
    },
    accessScopes: {
      type: [accessScopeSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

userSchema.pre('save', function userPreSave(next) {
  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

userSchema.methods.comparePassword = async function comparePassword(password) {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
