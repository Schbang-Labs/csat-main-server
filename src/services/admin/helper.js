/**
 * Admin Service Helper Functions
 * Utility functions for admin operations
 */

/**
 * Check if leadership fields have changed
 * @param {Object} current - Current SBU data
 * @param {Object} updates - Update data
 * @returns {boolean} True if leadership changed
 */
export const hasLeadershipChanged = (current, updates) => {
  const leadershipFields = [
    'executiveVP',
    'associateVP',
    'associateVPs',
    'creativeDirector',
  ];
  return leadershipFields.some(
    field => updates[field] !== undefined && updates[field] !== current[field]
  );
};

/**
 * Determine the reason for a snapshot based on changes
 * @param {Object} updates - Update data
 * @param {string} defaultReason - Default reason if no specific change detected
 * @returns {string} Snapshot reason
 */
export const getSnapshotReason = (updates, defaultReason = 'manual') => {
  if (updates.services !== undefined) return 'service_change';
  if (updates.pocs !== undefined) return 'poc_change';
  if (updates.serviceMapping !== undefined) return 'service_change';
  return defaultReason;
};

/**
 * Build query filters for admin lists
 * @param {Object} filters - Filter parameters
 * @returns {Object} MongoDB query
 */
export const buildAdminQuery = (filters = {}) => {
  const query = { isActive: true };

  if (filters.brandId) {
    query.brandId = filters.brandId;
  }

  if (filters.department) {
    query['services.department'] = filters.department;
    query['services.isActive'] = true;
  }

  if (filters.sbuId) {
    query['services.sbuId'] = filters.sbuId;
    query['services.isActive'] = true;
  }

  return query;
};

export default {
  hasLeadershipChanged,
  getSnapshotReason,
  buildAdminQuery,
};
