/**
 * Models Index
 * Central export for all MongoDB models
 */

import Department from './department.model.js';
import SBU from './sbu.model.js';
import Brand from './brand.model.js';
import Client from './client.model.js';
import Cycle from './cycle.model.js';
import CSATResponse from './csatResponse.model.js';
import Service from './service.model.js';
import User from './User.model.js';
import Session from './Session.model.js';

// History models
import SBUHistory from './sbuHistory.model.js';
import ClientHistory from './clientHistory.model.js';
import BrandHistory from './brandHistory.model.js';

// Re-export constants
export { VALID_DEPARTMENTS } from './brand.model.js';

// Named exports
export {
  Department,
  SBU,
  Brand,
  Client,
  Cycle,
  CSATResponse,
  Service,
  User,
  Session,
  SBUHistory,
  ClientHistory,
  BrandHistory,
};

// Default export as object
export default {
  Department,
  SBU,
  Brand,
  Client,
  Cycle,
  CSATResponse,
  Service,
  User,
  Session,
  SBUHistory,
  ClientHistory,
  BrandHistory,
};
