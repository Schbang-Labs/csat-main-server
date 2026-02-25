import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: false,
      default: null,
    },
    isValid: {
      type: Boolean,
      default: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'sessions',
  }
);

// NOTE: TTL index on expiresAt has been removed.
// Sessions persist indefinitely until invalidated via logout.
// After deploying, drop the existing TTL index in MongoDB:
// db.sessions.dropIndex("expiresAt_1")

const Session = mongoose.model('Session', sessionSchema);

export default Session;
