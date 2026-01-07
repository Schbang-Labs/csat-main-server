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

// Re-export constants
export { VALID_DEPARTMENTS } from './brand.model.js';

// Named exports
export { Department, SBU, Brand, Client, Cycle, CSATResponse };

// Default export as object
export default {
  Department,
  SBU,
  Brand,
  Client,
  Cycle,
  CSATResponse,
};
