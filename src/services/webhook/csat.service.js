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
 *
 * Service-specific flow (serviceName provided):
 * {
 *   "clientPhone": 919321133877,
 *   "departmentName": "solutions",
 *   "serviceName": "Performance Marketing",
 *   "data": {
 *     "coreMetrics": { "overallSatisfaction": 5, "likelihoodToRecommend": 5 },
 *     "campaignExecution": 5,
 *     "comment": "Solutions test 02",
 *     "createdAt": "12/11/2025, 3:54:28 PM"
 *   }
 * }
 *
 * Department-level flow (no serviceName):
 * {
 *   "clientPhone": 919321133877,
 *   "departmentName": "solutions",
 *   "data": { ... }
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
  const serviceName = String(payload.serviceName || '').trim();

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

  // 6. Resolve current active cycle
  const cycle = await Cycle.getCurrentCycle();

  if (!cycle) {
    throw new Error('No active cycle found');
  }

  logger.info('Using cycle for webhook payload', {
    cycleId: cycle._id,
    cycleName: cycle.name,
  });

  // 7. Validate service for the given department (only if serviceName provided)
  let service = null;
  if (serviceName) {
    service = await Service.findByDepartmentAndName(
      department._id,
      serviceName,
      { activeOnly: true }
    );

    if (!service) {
      throw new Error(
        `Service not found for department "${departmentName}": ${serviceName}`
      );
    }
  }

  // The data key: use serviceName if provided, otherwise departmentName
  const dataKey = serviceName || departmentName;

  // 8. Extract payload data as-is (including per-service comment)
  const inputData = payload.data ?? {};

  // 9. Match response by client + department + active cycle
  const existingResponse = await CSATResponse.findOne({
    clientId: client._id,
    departmentId: department._id,
    cycleId: cycle._id,
  });

  if (existingResponse) {
    const existingData =
      existingResponse.data && typeof existingResponse.data === 'object'
        ? { ...existingResponse.data }
        : {};
    existingData[dataKey] = inputData;
    existingResponse.data = existingData;

    if (service) {
      const currentServices = Array.isArray(existingResponse.services)
        ? existingResponse.services.map(serviceId => String(serviceId))
        : [];
      currentServices.push(String(service._id));
      existingResponse.services = [...new Set(currentServices)];
    }

    existingResponse.submittedAt = new Date();
    existingResponse.version = 2;
    existingResponse.sbuId = sbu?._id || existingResponse.sbuId || null;

    await existingResponse.save();

    logger.info('Updated existing CSAT response from webhook', {
      responseId: existingResponse._id,
      brandId: brand._id,
      clientId: client._id,
      departmentId: department._id,
      cycleId: cycle._id,
      serviceId: service?._id || null,
      serviceName: serviceName || null,
      dataKey,
      sbuId: sbu?._id || existingResponse.sbuId || null,
    });

    return {
      action: 'updated',
      responseId: existingResponse._id,
      brand: brand.name,
      client: client.name,
      cycle: cycle.name,
      department: department.name,
      service: service?.name || null,
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
    services: service ? [service._id] : [],
    data: { [dataKey]: inputData },
    submittedAt: new Date(),
    version: 2,
    isValid: true,
  });

  logger.info('Created CSAT response from webhook', {
    responseId: csatResponse._id,
    brandId: brand._id,
    clientId: client._id,
    departmentId: department._id,
    cycleId: cycle._id,
    serviceId: service?._id || null,
    serviceName: serviceName || null,
    dataKey,
    sbuId: sbu?._id || null,
  });

  return {
    action: 'created',
    responseId: csatResponse._id,
    brand: brand.name,
    client: client.name,
    cycle: cycle.name,
    department: department.name,
    service: service?.name || null,
    sbu: sbu?.name || null,
  };
};

export default {
  createCSATResponse,
};
