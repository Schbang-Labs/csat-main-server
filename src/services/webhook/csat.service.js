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
  CSATResponseLog,
} from '../../models/index.js';

/**
 * Create a CSAT Response from webhook data
 * @param {Object} payload - Webhook payload data
 * @param {Object} options - Additional options
 * @param {string} options.requestId - HTTP request ID for correlation
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
export const createCSATResponse = async (payload, options = {}) => {
  const startTime = Date.now();
  let currentStep = 'validate_payload';

  // Log context -- populated progressively through the pipeline
  const logContext = {
    rawPayload: payload,
    clientPhone: String(payload.clientPhone || ''),
    departmentName: payload.departmentName || null,
    serviceName: String(payload.serviceName || '').trim() || null,
    requestId: options.requestId || null,
  };

  try {
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
    logContext.sanitizedPhone = sanitizedPhone;

    logger.info('Looking up client for webhook payload', {
      rawPhone,
      sanitizedPhone,
    });

    // 2. Find Client by phone number - try multiple variations
    currentStep = 'find_client';
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

    logContext.clientName = client.name;
    logContext.clientId = client._id;

    logger.info('Matched client for webhook payload', {
      clientId: client._id,
      clientName: client.name,
    });

    // 3. Get Brand from the client
    currentStep = 'extract_brand';
    const brand = client.brandId;
    if (!brand) {
      throw new Error(`Brand not found for client ${client.name}`);
    }

    logContext.brandName = brand.name;
    logContext.brandId = brand._id;

    logger.info('Matched brand for webhook payload', {
      brandId: brand._id,
      brandName: brand.name,
    });

    // 4. Find Department
    currentStep = 'find_department';
    const departmentName = payload.departmentName.toLowerCase();
    const department = await Department.findOne({ name: departmentName });
    if (!department) {
      throw new Error(`Department not found: ${departmentName}`);
    }

    logContext.departmentId = department._id;

    logger.info('Matched department for webhook payload', {
      departmentId: department._id,
      departmentName: department.name,
    });

    // 5. Find SBU - Priority: SBU.brands array first, then Brand.services
    currentStep = 'find_sbu';
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

    if (sbu) {
      logContext.sbuName = sbu.name;
      logContext.sbuId = sbu._id;
    } else {
      logger.warn('No SBU found for webhook payload', {
        brandId: brand._id,
        brandName: brand.name,
        departmentName,
      });
    }

    // 6. Resolve current active cycle
    currentStep = 'get_cycle';
    const cycle = await Cycle.getCurrentCycle();

    if (!cycle) {
      throw new Error('No active cycle found');
    }

    logContext.cycleName = cycle.name;
    logContext.cycleId = cycle._id;

    logger.info('Using cycle for webhook payload', {
      cycleId: cycle._id,
      cycleName: cycle.name,
    });

    // 7. Validate service for the given department (only if serviceName provided)
    currentStep = 'validate_service';
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

      logContext.serviceId = service._id;
    }

    // The data key: use serviceName if provided, otherwise departmentName
    const dataKey = serviceName || departmentName;

    // 8. Extract payload data as-is (including per-service comment)
    currentStep = 'upsert_response';
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

      logContext.status = 'success';
      logContext.action = 'updated';
      logContext.csatResponseId = existingResponse._id;

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

    logContext.status = 'success';
    logContext.action = 'created';
    logContext.csatResponseId = csatResponse._id;

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
  } catch (error) {
    logContext.status = 'failure';
    logContext.failedAtStep = currentStep;
    logContext.error = {
      message: error.message,
      stack: error.stack,
    };

    throw error;
  } finally {
    logContext.durationMs = Date.now() - startTime;

    // Fire-and-forget -- never block the webhook response
    CSATResponseLog.create(logContext).catch(err => {
      logger.error('Failed to write CSATResponseLog', {
        error: err.message,
        requestId: logContext.requestId,
      });
    });
  }
};

export default {
  createCSATResponse,
};
