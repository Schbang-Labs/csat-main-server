/**
 * Admin Service
 * Business logic for SBU, Client, and Brand CRUD operations
 *
 * NOTE: History snapshots are NOT created automatically during CRUD operations.
 * Snapshots are only created when the /finalize API is explicitly called.
 */

import {
  SBU,
  Client,
  Brand,
  SBUHistory,
  ClientHistory,
  BrandHistory,
  Department,
} from '../../models/index.js';

// ============================================
// SBU Service Methods
// ============================================

/**
 * Create a new SBU
 * @param {Object} data - SBU data
 * @param {string|string[]} data.brandId - Single brand ID or array of brand IDs to add to brands array
 * @param {string[]} data.brands - Array of brand IDs (will be merged with brandId)
 * @param {string} data.associateVP - Single associate VP (will be added to associateVPs if not already present)
 * @param {string[]} data.associateVPs - Array of associate VPs
 * @returns {Promise<Object>} Created SBU with updated brands
 *
 * @description When brands are linked to this SBU, the Brand's services array
 * is automatically updated to set the sbuId for the matching department.
 */
export const createSBU = async data => {
  const { Department } = await import('../../models/index.js');

  // Auto-generate slug from SBU name if not provided
  if (data.name && !data.slug) {
    data.slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  // Handle brandId - can be a single ID or an array
  const brandIdsToAdd = [];

  if (data.brandId) {
    if (Array.isArray(data.brandId)) {
      brandIdsToAdd.push(...data.brandId);
    } else {
      brandIdsToAdd.push(data.brandId);
    }
    delete data.brandId; // Remove brandId from data as we'll use brands array
  }

  // Merge with existing brands array if provided
  if (data.brands && Array.isArray(data.brands)) {
    brandIdsToAdd.push(...data.brands);
  }

  // Remove duplicates and set brands array
  let validatedBrands = [];
  if (brandIdsToAdd.length > 0) {
    const uniqueBrandIds = [...new Set(brandIdsToAdd.map(id => id.toString()))];

    // Validate that all brand IDs exist
    validatedBrands = await Brand.find({
      _id: { $in: uniqueBrandIds },
      isActive: true,
    });

    const existingBrandIds = validatedBrands.map(b => b._id.toString());
    const invalidBrandIds = uniqueBrandIds.filter(
      id => !existingBrandIds.includes(id)
    );

    if (invalidBrandIds.length > 0) {
      throw new Error(
        `Invalid or inactive brand IDs: ${invalidBrandIds.join(', ')}`
      );
    }

    data.brands = uniqueBrandIds;
  }

  // Handle associateVP - add to associateVPs array if not already present
  if (data.associateVP) {
    const associateVPsArray = data.associateVPs || [];
    if (!associateVPsArray.includes(data.associateVP)) {
      associateVPsArray.push(data.associateVP);
    }
    data.associateVPs = associateVPsArray;
  }

  // Ensure associateVPs has unique values
  if (data.associateVPs && Array.isArray(data.associateVPs)) {
    data.associateVPs = [
      ...new Set(data.associateVPs.filter(vp => vp && vp.trim())),
    ];
  }

  const sbu = await SBU.create(data);

  // After creating SBU, update the linked brands' services array with the sbuId
  if (validatedBrands.length > 0) {
    // Get the department name for this SBU
    const department = await Department.findById(sbu.departmentId);
    if (department) {
      const departmentName = department.name.toLowerCase();

      // Update each brand's services array
      for (const brand of validatedBrands) {
        // Find the service entry for this department
        const serviceIndex = brand.services.findIndex(
          s => s.department === departmentName
        );

        if (serviceIndex !== -1) {
          // Update existing service entry with sbuId
          brand.services[serviceIndex].sbuId = sbu._id;
        } else {
          // Create new service entry for this department
          brand.services.push({
            department: departmentName,
            sbuId: sbu._id,
            isActive: true,
            startDate: new Date(),
            endDate: null,
          });
        }

        await brand.save();
        console.log(
          `✅ Updated brand "${brand.name}" with sbuId for department "${departmentName}"`
        );
      }
    }
  }

  return sbu;
};

/**
 * Update an SBU
 * @param {string} id - SBU ID
 * @param {Object} updates - Update data
 * @param {string} updates.executiveVP - Executive VP name
 * @param {string} updates.associateVP - Single associate VP (adds to existing)
 * @param {string[]} updates.associateVPs - Replace the entire associateVPs array
 * @param {string[]} updates.brands - Replace the entire brands array (for cycle changes)
 * @param {string|string[]} updates.brandId - Single brand ID or array to append to brands
 * @param {string[]} updates.addBrands - Brand IDs to add to existing brands array
 * @param {string[]} updates.removeBrands - Brand IDs to remove from existing brands array
 * @returns {Promise<Object>} Updated SBU and metadata
 *
 * @description When brands are changed, their services array is automatically
 * updated to set/unset the sbuId for the matching department.
 * Use 'brands' to completely replace all brands (ideal for cycle changes).
 */
export const updateSBU = async (id, updates) => {
  await import('../../models/index.js');

  const sbu = await SBU.findById(id).populate('departmentId');
  if (!sbu) {
    throw new Error('SBU not found');
  }

  const departmentName = sbu.departmentId?.name?.toLowerCase();
  const brandsToUpdateWithSbu = []; // Brands to add sbuId
  const brandsToRemoveSbu = []; // Brands to remove sbuId

  // Handle brands - completely replace the entire brands array
  // This is ideal for cycle changes where all brands under an SBU may change
  if (updates.brands && Array.isArray(updates.brands)) {
    const newBrandIds = [...new Set(updates.brands.map(id => id.toString()))];

    // Validate all new brand IDs
    const newBrands = await Brand.find({
      _id: { $in: newBrandIds },
      isActive: true,
    });
    const validNewBrandIds = new Set(newBrands.map(b => b._id.toString()));
    const invalidIds = newBrandIds.filter(id => !validNewBrandIds.has(id));

    if (invalidIds.length > 0) {
      throw new Error(
        `Invalid or inactive brand IDs: ${invalidIds.join(', ')}`
      );
    }

    // Find brands being removed (were in old list but not in new)
    const oldBrandIds = new Set(sbu.brands.map(b => b.toString()));
    const removedBrandIds = [...oldBrandIds].filter(
      id => !validNewBrandIds.has(id)
    );

    if (removedBrandIds.length > 0) {
      const removedBrands = await Brand.find({ _id: { $in: removedBrandIds } });
      brandsToRemoveSbu.push(...removedBrands);
    }

    // Find brands being added (in new list but not in old)
    const addedBrandIds = newBrandIds.filter(id => !oldBrandIds.has(id));
    const addedBrands = newBrands.filter(b =>
      addedBrandIds.includes(b._id.toString())
    );
    brandsToUpdateWithSbu.push(...addedBrands);

    // Set the new brands array
    sbu.brands = newBrandIds;
    delete updates.brands;

    console.log(
      `🔄 Replacing brands array - Removed: ${removedBrandIds.length}, Added: ${addedBrandIds.length}`
    );
  }

  // Handle brandId - append to existing brands
  if (updates.brandId) {
    const brandIdsToAdd = Array.isArray(updates.brandId)
      ? updates.brandId
      : [updates.brandId];

    // Validate brand IDs
    const existingBrands = await Brand.find({
      _id: { $in: brandIdsToAdd },
      isActive: true,
    });
    const existingBrandIds = new Set(existingBrands.map(b => b._id.toString()));
    const invalidIds = brandIdsToAdd.filter(
      id => !existingBrandIds.has(id.toString())
    );

    if (invalidIds.length > 0) {
      throw new Error(
        `Invalid or inactive brand IDs: ${invalidIds.join(', ')}`
      );
    }

    // Append to existing brands (avoiding duplicates)
    const currentBrandIds = new Set(sbu.brands.map(b => b.toString()));
    brandIdsToAdd.forEach(bid => currentBrandIds.add(bid.toString()));
    sbu.brands = [...currentBrandIds];

    // Track brands needing sbuId update
    brandsToUpdateWithSbu.push(...existingBrands);

    delete updates.brandId;
  }

  // Handle addBrands - append specific brands
  if (updates.addBrands && Array.isArray(updates.addBrands)) {
    const existingBrands = await Brand.find({
      _id: { $in: updates.addBrands },
      isActive: true,
    });
    const existingBrandIds = new Set(existingBrands.map(b => b._id.toString()));
    const invalidIds = updates.addBrands.filter(
      id => !existingBrandIds.has(id.toString())
    );

    if (invalidIds.length > 0) {
      throw new Error(
        `Invalid or inactive brand IDs: ${invalidIds.join(', ')}`
      );
    }

    const currentBrandIds = new Set(sbu.brands.map(b => b.toString()));
    updates.addBrands.forEach(bid => currentBrandIds.add(bid.toString()));
    sbu.brands = [...currentBrandIds];

    // Track brands needing sbuId update
    brandsToUpdateWithSbu.push(...existingBrands);

    delete updates.addBrands;
  }

  // Handle removeBrands - remove specific brands
  if (updates.removeBrands && Array.isArray(updates.removeBrands)) {
    const brandsBeingRemoved = await Brand.find({
      _id: { $in: updates.removeBrands },
    });
    brandsToRemoveSbu.push(...brandsBeingRemoved);

    const removeSet = new Set(updates.removeBrands.map(id => id.toString()));
    sbu.brands = sbu.brands.filter(b => !removeSet.has(b.toString()));

    delete updates.removeBrands;
  }

  // Handle associateVP - add single VP to associateVPs array
  if (updates.associateVP && !updates.associateVPs) {
    const currentVPs = new Set(sbu.associateVPs || []);
    currentVPs.add(updates.associateVP);
    sbu.associateVPs = [...currentVPs].filter(vp => vp && vp.trim());
  }

  // Handle associateVPs array - ensure unique values
  if (updates.associateVPs && Array.isArray(updates.associateVPs)) {
    updates.associateVPs = [
      ...new Set(updates.associateVPs.filter(vp => vp && vp.trim())),
    ];
  }

  // Check if leadership fields are being updated (for future use)
  const leadershipFields = [
    'executiveVP',
    'associateVP',
    'associateVPs',
    'creativeDirector',
  ];
  // eslint-disable-next-line no-unused-vars
  const _isLeadershipChange = leadershipFields.some(
    field => updates[field] !== undefined && updates[field] !== sbu[field]
  );

  // Apply remaining updates
  Object.assign(sbu, updates);
  await sbu.save();

  // Update brand services for added brands
  if (brandsToUpdateWithSbu.length > 0 && departmentName) {
    for (const brand of brandsToUpdateWithSbu) {
      const serviceIndex = brand.services.findIndex(
        s => s.department === departmentName
      );
      if (serviceIndex !== -1) {
        brand.services[serviceIndex].sbuId = sbu._id;
      } else {
        brand.services.push({
          department: departmentName,
          sbuId: sbu._id,
          isActive: true,
          startDate: new Date(),
          endDate: null,
        });
      }
      await brand.save();
      console.log(
        `✅ Updated brand "${brand.name}" with sbuId for department "${departmentName}"`
      );
    }
  }

  // Remove sbuId from removed brands
  if (brandsToRemoveSbu.length > 0 && departmentName) {
    for (const brand of brandsToRemoveSbu) {
      const serviceIndex = brand.services.findIndex(
        s => s.department === departmentName
      );
      if (serviceIndex !== -1) {
        brand.services[serviceIndex].sbuId = null;
        await brand.save();
        console.log(
          `🔄 Removed sbuId from brand "${brand.name}" for department "${departmentName}"`
        );
      }
    }
  }

  return { sbu };
};

/**
 * Get all active SBUs with pagination and search
 * @param {Object} options - Pagination and search options
 * @param {number} options.page - Page number (1-indexed, default: 1)
 * @param {number} options.limit - Items per page (default: 10, 0 for all)
 * @param {string} options.search - Search query to filter by name, executiveVP, associateVP, associateVPs
 * @returns {Promise<Object>} Paginated SBUs with metadata
 */
export const getAllSBUs = async (options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { isActive: true };

  // Add search filter if provided
  if (options.search && options.search.trim()) {
    const searchRegex = new RegExp(options.search.trim(), 'i');
    query.$or = [
      { name: searchRegex },
      { executiveVP: searchRegex },
      { associateVP: searchRegex },
      { associateVPs: searchRegex },
    ];
  }

  // Get total count for pagination metadata
  const totalCount = await SBU.countDocuments(query);

  // If limit is 0, return all results (no pagination)
  let sbus;
  if (limit === 0) {
    sbus = await SBU.find(query)
      .populate('departmentId', 'name displayName')
      .populate('brands', 'name slug')
      .sort({ name: 1 }); // Sort by name ascending

    return {
      data: sbus,
      totalCount,
      totalPages: 1,
      currentPage: 1,
      limit: totalCount,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  sbus = await SBU.find(query)
    .populate('departmentId', 'name displayName')
    .populate('brands', 'name slug')
    .sort({ name: 1 }) // Sort by name ascending
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: sbus,
    totalCount,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Get SBU by ID with optional cycle history
 * @param {string} id - SBU ID
 * @param {string|null} cycleId - Optional cycle ID for historical data
 * @returns {Promise<Object>} SBU data
 */
export const getSBUById = async (id, cycleId = null) => {
  if (cycleId) {
    const data = await SBUHistory.getByCycle(id, cycleId);
    if (!data) {
      throw new Error('No history found for this SBU and cycle');
    }
    return { data, isHistorical: true };
  }

  const data = await SBU.findById(id)
    .populate('departmentId', 'name displayName')
    .populate('brands', 'name slug');

  if (!data) {
    throw new Error('SBU not found');
  }

  return { data, isHistorical: false };
};

/**
 * Get SBU history across all cycles
 * @param {string} id - SBU ID
 * @returns {Promise<Array>} History records
 */
export const getSBUHistory = async id => {
  return SBUHistory.getHistory(id);
};

// ============================================
// Client Service Methods
// ============================================

/**
 * Create a new Client (POC)
 * @param {Object} data - Client data
 * @param {string} data.brandId - Brand ID (required)
 * @param {string} data.name - Client name (required)
 * @param {string} data.phone - Client phone (required)
 * @param {string} data.email - Client email (optional)
 * @param {Array} data.serviceMapping - Optional, if not provided will be auto-populated from brand's services
 * @returns {Promise<Object>} Created client
 */
export const createClient = async data => {
  // If serviceMapping is not provided, auto-populate from brand's departments
  if (!data.serviceMapping || data.serviceMapping.length === 0) {
    if (!data.brandId) {
      throw new Error('brandId is required to create a client');
    }

    // Find the brand to get its departments
    const brand = await Brand.findById(data.brandId);
    if (!brand) {
      throw new Error('Brand not found');
    }

    // Get active departments from brand's services array
    const activeDepartments = brand.services
      .filter(service => service.isActive)
      .map(service => ({
        department: service.department,
        isActive: true,
      }));

    if (activeDepartments.length > 0) {
      data.serviceMapping = activeDepartments;
    }
  }

  const client = await Client.create(data);

  return client;
};

/**
 * Update a Client
 * @param {string} id - Client ID
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Updated client
 */
export const updateClient = async (id, updates) => {
  const client = await Client.findById(id);
  if (!client) {
    throw new Error('Client not found');
  }

  // Handle empty brandId - set to null if empty string or falsy
  if (updates.brandId !== undefined && !updates.brandId) {
    updates.brandId = null;
  }

  // Apply updates
  Object.assign(client, updates);
  await client.save();

  return client;
};

/**
 * Get all active Clients with pagination and search
 * @param {Object} filters - Optional filters { brandId, search }
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (1-indexed, default: 1)
 * @param {number} options.limit - Items per page (default: 10, 0 for all)
 * @returns {Promise<Object>} Paginated clients with metadata
 */
export const getAllClients = async (filters = {}, options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { isActive: true };
  if (filters.brandId) query.brandId = filters.brandId;

  // Add search filter if provided
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');

    // Find brands matching the search to include their clients
    const matchingBrands = await Brand.find(
      { name: searchRegex, isActive: true },
      '_id'
    );
    const matchingBrandIds = matchingBrands.map(b => b._id);

    query.$or = [
      { name: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { brandId: { $in: matchingBrandIds } },
    ];
  }

  // Get total count for pagination metadata
  const totalCount = await Client.countDocuments(query);

  // If limit is 0, return all results (no pagination)
  let clients;
  if (limit === 0) {
    clients = await Client.find(query)
      .populate('brandId', 'name slug')
      .sort({ name: 1 }); // Sort by name ascending

    return {
      data: clients,
      totalCount,
      totalPages: 1,
      currentPage: 1,
      limit: totalCount,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  clients = await Client.find(query)
    .populate('brandId', 'name slug')
    .sort({ name: 1 }) // Sort by name ascending
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: clients,
    totalCount,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Get Client by ID with optional cycle history
 * @param {string} id - Client ID
 * @param {string|null} cycleId - Optional cycle ID for historical data
 * @returns {Promise<Object>} Client data
 */
export const getClientById = async (id, cycleId = null) => {
  if (cycleId) {
    const data = await ClientHistory.getByCycle(id, cycleId);
    if (!data) {
      throw new Error('No history found for this Client and cycle');
    }
    return { data, isHistorical: true };
  }

  const data = await Client.findById(id).populate('brandId', 'name slug');

  if (!data) {
    throw new Error('Client not found');
  }

  return { data, isHistorical: false };
};

/**
 * Get Client history across all cycles
 * @param {string} id - Client ID
 * @returns {Promise<Array>} History records
 */
export const getClientHistory = async id => {
  return ClientHistory.getHistory(id);
};

// ============================================
// Brand Service Methods
// ============================================

/**
 * Create a new Brand
 * @param {Object} data - Brand data
 * @param {string} data.name - Brand name (required)
 * @param {string[]} data.departments - Array of department names (e.g., ["solutions", "media", "tech"])
 *                                      Will create service entries with sbuId: null
 * @param {Object[]} data.services - Alternatively, provide pre-configured services array
 * @returns {Promise<Object>} Created brand
 */
export const createBrand = async data => {
  // Auto-generate slug from brand name if not provided
  if (data.name && !data.slug) {
    data.slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
  }

  // Handle departments array - convert to services array
  if (data.departments && Array.isArray(data.departments)) {
    const { VALID_DEPARTMENTS } = await import('../../models/brand.model.js');

    // Validate all department names
    const invalidDepts = data.departments.filter(
      d => !VALID_DEPARTMENTS.includes(d.toLowerCase())
    );
    if (invalidDepts.length > 0) {
      throw new Error(
        `Invalid department(s): ${invalidDepts.join(', ')}. Valid departments are: ${VALID_DEPARTMENTS.join(', ')}`
      );
    }

    // Create services array from departments (sbuId will be null initially)
    const newServices = data.departments.map(dept => ({
      department: dept.toLowerCase(),
      sbuId: null,
      isActive: true,
      startDate: new Date(),
      endDate: null,
    }));

    // Merge with existing services if any, avoiding duplicates
    const existingServices = data.services || [];
    const existingDepts = new Set(existingServices.map(s => s.department));

    const mergedServices = [
      ...existingServices,
      ...newServices.filter(s => !existingDepts.has(s.department)),
    ];

    data.services = mergedServices;
    delete data.departments; // Remove from data as we've converted it
  }

  const brand = await Brand.create(data);
  console.log('brand created successfully', brand);
  return brand;
};

/**
 * Update a Brand
 * @param {string} id - Brand ID
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Updated brand
 */
export const updateBrand = async (id, updates) => {
  const brand = await Brand.findById(id);
  if (!brand) {
    throw new Error('Brand not found');
  }

  // Apply updates
  Object.assign(brand, updates);
  await brand.save();

  return brand;
};

/**
 * Get all active Brands with pagination and search
 * @param {Object} filters - Optional filters { department, departmentId, sbuId, search }
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (1-indexed, default: 1)
 * @param {number} options.limit - Items per page (default: 10, 0 for all)
 * @returns {Promise<Object>} Paginated brands with metadata
 */
export const getAllBrands = async (filters = {}, options = {}) => {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { isActive: true };

  // Handle department filter (string name)
  if (filters.department) {
    query['services.department'] = filters.department.toLowerCase();
    query['services.isActive'] = true;
  }

  // Handle departmentId filter (lookup name from ID)
  if (filters.departmentId) {
    const department = await Department.findById(filters.departmentId);
    if (department) {
      // If department is found, filter by its name
      // Override any existing department filter if both are passed (or logical AND, but usually one is used)
      // Here we set efficient query
      query['services.department'] = department.name.toLowerCase();
      query['services.isActive'] = true;
    } else {
      // If ID provided but not found, return empty result is probably best
      // or we can ignore it. Returning empty seems safer/more correct.
      // e.g. departmentId=fake -> return nothing
      return {
        data: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: page,
        limit,
        hasNextPage: false,
        hasPrevPage: false,
      };
    }
  }

  if (filters.sbuId) {
    query['services.sbuId'] = filters.sbuId;
    query['services.isActive'] = true;
  }

  // Add search filter if provided
  if (filters.search && filters.search.trim()) {
    const searchRegex = new RegExp(filters.search.trim(), 'i');

    // Find SBUs matching the search to include brands linked to those SBUs
    const matchingSBUs = await SBU.find(
      {
        $or: [
          { name: searchRegex },
          { executiveVP: searchRegex },
          { associateVP: searchRegex },
          { associateVPs: searchRegex },
        ],
        isActive: true,
      },
      '_id'
    );
    const matchingSBUIds = matchingSBUs.map(s => s._id);

    query.$or = [
      { name: searchRegex },
      { 'services.sbuId': { $in: matchingSBUIds } },
    ];
  }

  // Get total count for pagination metadata
  const totalCount = await Brand.countDocuments(query);

  // If limit is 0, return all results (no pagination)
  let brands;
  if (limit === 0) {
    brands = await Brand.find(query)
      .populate('services.sbuId', 'name slug')
      .populate('pocs', 'name phone email')
      .sort({ name: 1 }); // Sort by name ascending

    return {
      data: brands,
      totalCount,
      totalPages: 1,
      currentPage: 1,
      limit: totalCount,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  brands = await Brand.find(query)
    .populate('services.sbuId', 'name slug')
    .populate('pocs', 'name phone email')
    .sort({ name: 1 }) // Sort by name ascending
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: brands,
    totalCount,
    totalPages,
    currentPage: page,
    limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Get Brand by ID with optional cycle history
 * @param {string} id - Brand ID
 * @param {string|null} cycleId - Optional cycle ID for historical data
 * @returns {Promise<Object>} Brand data
 */
export const getBrandById = async (id, cycleId = null) => {
  if (cycleId) {
    const data = await BrandHistory.getByCycle(id, cycleId);
    if (!data) {
      throw new Error('No history found for this Brand and cycle');
    }
    return { data, isHistorical: true };
  }

  const data = await Brand.findById(id)
    .populate('services.sbuId', 'name slug')
    .populate('pocs', 'name phone email');

  if (!data) {
    throw new Error('Brand not found');
  }

  return { data, isHistorical: false };
};

/**
 * Get Brand history across all cycles
 * @param {string} id - Brand ID
 * @returns {Promise<Array>} History records
 */
export const getBrandHistory = async id => {
  return BrandHistory.getHistory(id);
};

/**
 * Update Brand POCs
 * @param {string} id - Brand ID
 * @param {Array} pocs - POC IDs array
 * @returns {Promise<Object>} Updated brand
 */
export const updateBrandPocs = async (id, pocs) => {
  const brand = await Brand.findById(id);
  if (!brand) {
    throw new Error('Brand not found');
  }

  brand.pocs = pocs;
  await brand.save();

  return brand;
};

export default {
  // SBU
  createSBU,
  updateSBU,
  getAllSBUs,
  getSBUById,
  getSBUHistory,
  // Client
  createClient,
  updateClient,
  getAllClients,
  getClientById,
  getClientHistory,
  // Brand
  createBrand,
  updateBrand,
  getAllBrands,
  getBrandById,
  getBrandHistory,
  updateBrandPocs,
};
