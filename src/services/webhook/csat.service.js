/**
 * CSAT Webhook Service
 * Creates CSAT responses from webhook data (e.g., from Pabbly)
 */

import logger from '#config/logger.js';
import {
  Client,
  SBU,
  Department,
  Service,
  Cycle,
  CSATResponse,
} from '../../models/index.js';

/**
 * Create a CSAT Response from webhook data
 * @param {Object} payload - Webhook payload data
 * @returns {Promise<Object>} Created CSAT response
 *
 * Expected payload structure from Pabbly:
 * {
 *   "clientPhone": 919321133877,
 *   "departmentName": "solutions",
 *   "data": {
 *     "coreMetrics": {
 *       "overallSatisfaction": 5,
 *       "likelihoodToRecommend": 5,
 *       "northStarMetrics": 5
 *     },
 *     "seniorLeadershipInvolvement": 5,
 *     "strategyExecution": 5,
 *     "teamResponsiveness": 5,
 *     "brandUnderstanding": 5,
 *     "deliveryMetrics": {
 *       "dataEffectiveness": 5,
 *       "teamProactivity": 5,
 *       "meetingBusinessGoals": 5
 *     },
 *     "qualityEvaluation": {
 *       "qualityOfDesignVideo": 5,
 *       "qualityOfIdeas": 5
 *     },
 *     "comment": "Solutions test 02",
 *     "createdAt": "12/11/2025, 3:54:28 PM"
 *   }
 * }
 */
export const createCSATResponse = async payload => {
  // 1. Validate required fields
  if (!payload.clientPhone) {
    throw new Error('clientPhone is required');
  }
  if (!payload.departmentName) {
    throw new Error('departmentName is required');
  }

  // Convert phone to string for searching
  const rawPhone = String(payload.clientPhone);

  // Sanitize phone number - remove country code prefixes
  const sanitizePhone = phone => {
    let sanitized = phone.replace(/\s+/g, '').replace(/[-()]/g, ''); // Remove spaces, dashes, parentheses

    // Remove common country code prefixes
    if (sanitized.startsWith('+91')) {
      sanitized = sanitized.substring(3);
    } else if (sanitized.startsWith('91') && sanitized.length > 10) {
      sanitized = sanitized.substring(2);
    } else if (sanitized.startsWith('0')) {
      sanitized = sanitized.substring(1);
    }

    return sanitized;
  };

  const sanitizedPhone = sanitizePhone(rawPhone);
  logger.info('Looking up client for webhook payload', {
    rawPhone,
    sanitizedPhone,
  });

  // 2. Find Client by phone number - try multiple variations
  let client = await Client.findOne({ phone: sanitizedPhone }).populate(
    'brandId'
  );

  // If not found, try with original phone
  if (!client && sanitizedPhone !== rawPhone) {
    client = await Client.findOne({ phone: rawPhone }).populate('brandId');
  }

  // If still not found, try searching with regex for partial match (last 10 digits)
  if (!client && sanitizedPhone.length >= 10) {
    const last10Digits = sanitizedPhone.slice(-10);
    client = await Client.findOne({
      phone: { $regex: last10Digits + '$' },
    }).populate('brandId');
  }

  if (!client) {
    throw new Error(
      `Client with phone ${rawPhone} (sanitized: ${sanitizedPhone}) not found in database`
    );
  }

  logger.info('Matched client for webhook payload', {
    clientId: client._id,
    clientName: client.name,
  });

  // 3. Get Brand from the client
  const brand = client.brandId;
  if (!brand) {
    throw new Error(`Brand not found for client ${client.name}`);
  }

  logger.info('Matched brand for webhook payload', {
    brandId: brand._id,
    brandName: brand.name,
  });

  // 4. Find Department
  const departmentName = payload.departmentName.toLowerCase();
  const department = await Department.findOne({ name: departmentName });
  if (!department) {
    throw new Error(`Department not found: ${departmentName}`);
  }

  logger.info('Matched department for webhook payload', {
    departmentId: department._id,
    departmentName: department.name,
  });

  // 5. Find SBU - Priority: SBU.brands array first, then Brand.services
  let sbu = null;
  
  // First, try to find SBU where this brand is in the brands array for this department
  sbu = await SBU.findOne({
    brands: brand._id,
    departmentId: department._id,
  });
  
  if (sbu) {
    logger.info('Matched SBU from brands array', {
      sbuId: sbu._id,
      sbuName: sbu.name,
    });
  } else {
    // Fallback: Check Brand's services for sbuId
    const brandService = brand.services?.find(
      s => s.department === departmentName
    );
    if (brandService && brandService.sbuId) {
      sbu = await SBU.findById(brandService.sbuId);
      if (sbu) {
        logger.info('Matched SBU from brand services', {
          sbuId: sbu._id,
          sbuName: sbu.name,
        });
      }
    }
  }
  
  if (!sbu) {
    logger.warn('No SBU found for webhook payload', {
      brandId: brand._id,
      brandName: brand.name,
      departmentName,
    });
  }

  // 6. Get target cycle (Cycle 6 - hardcoded for now)
  const TARGET_CYCLE_ID = '697094a7eeeba79186851689';
  const cycle = await Cycle.findById(TARGET_CYCLE_ID);
  
  if (!cycle) {
    throw new Error(`Target cycle not found with ID: ${TARGET_CYCLE_ID}`);
  }

  logger.info('Using cycle for webhook payload', {
    cycleId: TARGET_CYCLE_ID,
    cycleName: cycle.name,
  });

  // 7. Extract data from payload - Department agnostic approach
  // Since CSATResponse.data is Mixed type, we store whatever structure comes in
  const inputData = payload.data || {};
  const serviceName = payload.service ? String(payload.service).trim() : '';
  const isServiceForm = Boolean(serviceName);

  if (isServiceForm) {
    const service = await Service.findByDepartmentAndName(
      department._id,
      serviceName,
      { activeOnly: true }
    );

    if (!service) {
      throw new Error(
        `Service not found for department "${departmentName}": ${serviceName}`
      );
    }

    const existingResponse = await CSATResponse.findOne({
      clientId: client._id,
      departmentId: department._id,
      cycleId: cycle._id,
    });

    if (!existingResponse) {
      throw new Error(
        'Core CSAT response not found for this client and department in current cycle'
      );
    }

    const existingData =
      existingResponse.data && typeof existingResponse.data === 'object'
        ? { ...existingResponse.data }
        : {};

    existingData[serviceName] = inputData;
    existingResponse.data = existingData;

    if (!Array.isArray(existingResponse.services)) {
      existingResponse.services = [];
    }

    const hasService = existingResponse.services.some(
      serviceId => String(serviceId) === String(service._id)
    );
    if (!hasService) {
      existingResponse.services.push(service._id);
    }

    existingResponse.submittedAt = new Date();
    existingResponse.sbuId = sbu?._id || existingResponse.sbuId || null;
    await existingResponse.save();

    logger.info('Updated CSAT response with service-form payload', {
      responseId: existingResponse._id,
      brandId: brand._id,
      clientId: client._id,
      departmentId: department._id,
      serviceId: service._id,
      serviceName: service.name,
      sbuId: sbu?._id || existingResponse.sbuId || null,
    });

    return {
      action: 'updated',
      responseId: existingResponse._id,
      brand: brand.name,
      client: client.name,
      cycle: cycle.name,
      department: department.name,
      service: service.name,
      sbu: sbu?.name || null,
    };
  }

  // 8. Build CSAT data object - preserves department-specific fields as-is
  const csatData = {
    // Track which department this response is for
    servicesCovered: {
      solutions: departmentName === 'solutions',
      media: departmentName === 'media',
      tech: departmentName === 'tech',
      seo: departmentName === 'seo',
      martech: departmentName === 'martech',
      fluence: departmentName === 'fluence',
      smp: departmentName === 'smp',
    },
    // Store department identifier
    department: departmentName,
    // Preserve all incoming data as-is (supports different structures per department)
    // This includes coreMetrics, deliveryMetrics, qualityEvaluation, or any tech-specific fields
    ...inputData,
    // Ensure common metadata fields
    formVersion: inputData.formVersion || 'v1',
    filledAt: inputData.createdAt || new Date().toISOString(),
  };

  // Remove createdAt from root if it exists (we've moved it to filledAt)
  delete csatData.createdAt;

  // 9. Check if response already exists for this brand+client+cycle+department
  const existingResponse = await CSATResponse.findOne({
    brandId: brand._id,
    clientId: client._id,
    cycleId: cycle._id,
    departmentId: department._id,
  });

  if (existingResponse) {
    // Update existing response
    existingResponse.data = {
      ...(existingResponse.data && typeof existingResponse.data === 'object'
        ? existingResponse.data
        : {}),
      ...csatData,
    };
    if (!Array.isArray(existingResponse.services)) {
      existingResponse.services = [];
    }
    existingResponse.comment = inputData.comment || '';
    existingResponse.submittedAt = new Date();
    existingResponse.sbuId = sbu?._id || null;
    await existingResponse.save();

    logger.info('Updated existing CSAT response from webhook', {
      responseId: existingResponse._id,
      brandId: brand._id,
      clientId: client._id,
      departmentId: department._id,
      sbuId: sbu?._id || null,
    });

    return {
      action: 'updated',
      responseId: existingResponse._id,
      brand: brand.name,
      client: client.name,
      cycle: cycle.name,
      department: department.name,
      sbu: sbu?.name || null,
    };
  }

  // 10. Create new CSAT response
  const csatResponse = await CSATResponse.create({
    brandId: brand._id,
    clientId: client._id,
    cycleId: cycle._id,
    departmentId: department._id,
    sbuId: sbu?._id || null,
    services: [],
    data: csatData,
    comment: inputData.comment || '',
    submittedAt: new Date(),
    isValid: true,
  });

  logger.info('Created CSAT response from webhook', {
    responseId: csatResponse._id,
    brandId: brand._id,
    clientId: client._id,
    departmentId: department._id,
    sbuId: sbu?._id || null,
  });

  return {
    action: 'created',
    responseId: csatResponse._id,
    brand: brand.name,
    client: client.name,
    cycle: cycle.name,
    department: department.name,
    sbu: sbu?.name || null,
  };
};

export default {
  createCSATResponse,
};
