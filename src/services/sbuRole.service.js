import { SBU } from '../models/index.js';

export const normalizeName = value => {
  if (!value || typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
};

export const getRoleFromSBULeadName = async name => {
  const normalizedUserName = normalizeName(name);

  if (!normalizedUserName) {
    return {
      role: 'user',
      sbuId: null,
    };
  }

  const sbus = await SBU.find({
    isActive: true,
    leadNames: { $exists: true, $ne: [] },
  })
    .select('name leadNames')
    .lean();

  for (const sbu of sbus) {
    const leadNames = (sbu.leadNames || []).map(normalizeName);
    if (leadNames.includes(normalizedUserName)) {
      return {
        role: sbu.name,
        sbuId: sbu._id,
      };
    }
  }

  return {
    role: 'user',
    sbuId: null,
  };
};

export default {
  normalizeName,
  getRoleFromSBULeadName,
};
