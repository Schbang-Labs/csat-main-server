/**
 * Brand Profile Service
 * Builds a single consolidated "everything for one brand" payload keyed by the
 * Second Brain brand id (Brand.secondBrainId).
 *
 * Returns, for the matched CSAT brand:
 *   - brand          : the Brand document with current service/SBU mapping
 *   - pocs           : ALL clients (POCs) for the brand — active AND inactive
 *   - handlingSbus   : the current SBU(s) handling the brand, with department
 *   - responses      : all CSAT responses, each enriched with handling SBU,
 *                      cycle (incl. human month label) and client details
 */

import { Brand, Client, SBU, CSATResponse } from '../../models/index.js';

/**
 * Month label for a cycle (mirrors Cycle.createYearCycles month mapping).
 * @param {number} cycleNumber 1-6
 * @param {number} year
 * @returns {string|null} e.g. "June-July 2025"
 */
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const CYCLE_MONTHS = {
  1: [4], // May
  2: [5, 6], // June-July
  3: [7], // August
  4: [8, 9], // September-October
  5: [10], // November
  6: [11], // December
};

export const cycleMonthLabel = (cycleNumber, year) => {
  const months = CYCLE_MONTHS[cycleNumber];
  if (!months) return null;
  const names = months.map(m => MONTH_NAMES[m]).join('-');
  return year ? `${names} ${year}` : names;
};

/**
 * Resolve a Brand from a Second Brain id.
 * secondBrainId is NOT guaranteed unique (rare duplicate brand docs exist),
 * so we prefer an active brand and report when several matched.
 */
const resolveBrand = async secondBrainId => {
  const matches = await Brand.find({ secondBrainId })
    .populate('services.sbuId', 'name slug departmentId')
    .lean();

  if (matches.length === 0) return { brand: null, matchedCount: 0 };

  // Prefer active, then most recently updated.
  matches.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

  return { brand: matches[0], matchedCount: matches.length };
};

/**
 * Build the full brand profile by Second Brain brand id.
 * @param {number} secondBrainId
 * @returns {Promise<Object|null>} profile payload, or null if no brand matched
 */
export const getBrandProfileBySecondBrainId = async secondBrainId => {
  const { brand, matchedCount } = await resolveBrand(secondBrainId);
  if (!brand) return null;

  const brandId = brand._id;

  // ── POCs (ALL clients, active + inactive) ────────────────────────────────
  const pocs = await Client.find({ brandId })
    .populate('serviceMapping.subservices', 'name normalizedName departmentId')
    .sort({ isActive: -1, name: 1 })
    .lean();

  // ── Current SBU(s) handling the brand ────────────────────────────────────
  // Source of truth for "current" = Brand.services[].sbuId (live mapping).
  // Cross-checked with SBU.brands as a fallback so we never miss an assignment.
  const sbuIdsFromServices = (brand.services || [])
    .map(s => s.sbuId?._id || s.sbuId)
    .filter(Boolean)
    .map(String);

  const sbusFromBrandsRef = await SBU.find({ brands: brandId, isActive: true })
    .select('_id')
    .lean();

  const handlingSbuIds = [
    ...new Set([
      ...sbuIdsFromServices,
      ...sbusFromBrandsRef.map(s => String(s._id)),
    ]),
  ];

  const handlingSbus = await SBU.find({ _id: { $in: handlingSbuIds } })
    .populate('departmentId', 'name code displayName')
    .lean();

  // Which departments each handling SBU covers for THIS brand (from services).
  const deptsBySbu = new Map();
  for (const s of brand.services || []) {
    const sid = String(s.sbuId?._id || s.sbuId || '');
    if (!sid) continue;
    if (!deptsBySbu.has(sid)) deptsBySbu.set(sid, []);
    deptsBySbu.get(sid).push({ department: s.department, isActive: s.isActive });
  }
  const handlingSbusEnriched = handlingSbus.map(s => ({
    ...s,
    handlesDepartments: deptsBySbu.get(String(s._id)) || [],
  }));

  // ── CSAT responses (all cycles) with full context ────────────────────────
  const rawResponses = await CSATResponse.find({ brandId })
    .populate('clientId', 'name phone email isActive')
    .populate('cycleId', 'name cycleNumber year status startDate endDate')
    .populate('departmentId', 'name code displayName')
    .populate('sbuId', 'name slug departmentId')
    .populate('services', 'name normalizedName')
    .sort({ submittedAt: -1 })
    .lean();

  const responses = rawResponses.map(r => {
    const cycle = r.cycleId || null;
    return {
      _id: r._id,
      submittedAt: r.submittedAt,
      version: r.version,
      isValid: r.isValid,
      comment: r.comment ?? null,
      data: r.data, // schemaless ratings payload
      handlingSbu: r.sbuId || null, // SBU on the response (live)
      cycle: cycle
        ? {
          _id: cycle._id,
          name: cycle.name,
          cycleNumber: cycle.cycleNumber,
          year: cycle.year,
          status: cycle.status,
          month: cycleMonthLabel(cycle.cycleNumber, cycle.year),
        }
        : null,
      department: r.departmentId || null,
      client: r.clientId || null,
      services: r.services || [],
    };
  });

  return {
    secondBrainId,
    matchedBrandCount: matchedCount,
    brand: {
      _id: brand._id,
      name: brand.name,
      slug: brand.slug,
      secondBrainId: brand.secondBrainId,
      isActive: brand.isActive,
      services: brand.services || [],
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    },
    handlingSbus: handlingSbusEnriched,
    pocs,
    responses,
    counts: {
      pocs: pocs.length,
      activePocs: pocs.filter(p => p.isActive !== false).length,
      handlingSbus: handlingSbusEnriched.length,
      responses: responses.length,
    },
  };
};

export default { getBrandProfileBySecondBrainId, cycleMonthLabel };
