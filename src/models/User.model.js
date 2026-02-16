import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

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
      default: 'user',
      trim: true,
    },
    sbuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SBU',
      default: null,
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
