/**
 * CSAT Webhook Service
 * Creates CSAT responses from webhook data (e.g., from Pabbly)
 */

import {
  Client,
  SBU,
  Department,
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
  console.log(
    `🔍 Looking up client with phone: ${rawPhone} (sanitized: ${sanitizedPhone})`
  );

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

  console.log(`✅ Found client: ${client.name}`);

  // 3. Get Brand from the client
  const brand = client.brandId;
  if (!brand) {
    throw new Error(`Brand not found for client ${client.name}`);
  }

  console.log(`✅ Found brand: ${brand.name}`);

  // 4. Find Department
  const departmentName = payload.departmentName.toLowerCase();
  const department = await Department.findOne({ name: departmentName });
  if (!department) {
    throw new Error(`Department not found: ${departmentName}`);
  }

  console.log(`✅ Found department: ${department.name}`);

  // 5. Find SBU from Brand's services for this department
  let sbu = null;
  const brandService = brand.services?.find(
    s => s.department === departmentName
  );
  if (brandService && brandService.sbuId) {
    sbu = await SBU.findById(brandService.sbuId);
    if (sbu) {
      console.log(`✅ Found SBU: ${sbu.name}`);
    }
  }

  // If no SBU from brand services, try to find from SBU.brands array
  if (!sbu) {
    sbu = await SBU.findOne({
      brands: brand._id,
      departmentId: department._id,
    });
    if (sbu) {
      console.log(`✅ Found SBU from brands array: ${sbu.name}`);
    }
  }

  // 6. Get current active cycle or latest cycle
  let cycle = await Cycle.findOne({ status: 'active' });
  if (!cycle) {
    cycle = await Cycle.findOne().sort({ year: -1, cycleNumber: -1 });
  }
  if (!cycle) {
    throw new Error('No cycle found. Please seed cycles first.');
  }

  console.log(`✅ Using cycle: ${cycle.name}`);

  // 7. Extract data from payload
  const inputData = payload.data || {};
  const coreMetrics = inputData.coreMetrics || {};
  const deliveryMetrics = inputData.deliveryMetrics || {};
  const qualityEvaluation = inputData.qualityEvaluation || {};

  // 8. Build CSAT data object matching the CSATResponse model structure
  const csatData = {
    servicesCovered: {
      solutions: departmentName === 'solutions',
      media: departmentName === 'media',
      tech: departmentName === 'tech',
      seo: departmentName === 'seo',
      martech: departmentName === 'martech',
      fluence: departmentName === 'fluence',
      smp: departmentName === 'smp',
    },
    coreMetrics: {
      overallSatisfaction: Number(coreMetrics.overallSatisfaction) || 0,
      likelihoodToRecommend: Number(coreMetrics.likelihoodToRecommend) || 0,
      northStarMetrics: Number(coreMetrics.northStarMetrics) || 0,
      // These fields are at data level in incoming payload
      seniorLeadershipInvolvement:
        Number(inputData.seniorLeadershipInvolvement) || 0,
      strategyExecution: Number(inputData.strategyExecution) || 0,
      teamResponsiveness: Number(inputData.teamResponsiveness) || 0,
      brandUnderstanding: Number(inputData.brandUnderstanding) || 0,
    },
    deliveryMetrics: {
      dataEffectiveness: Number(deliveryMetrics.dataEffectiveness) || 0,
      teamProactivity: Number(deliveryMetrics.teamProactivity) || 0,
      meetingBusinessGoals: Number(deliveryMetrics.meetingBusinessGoals) || 0,
    },
    qualityEvaluation: {
      qualityOfDesignVideo: Number(qualityEvaluation.qualityOfDesignVideo) || 0,
      qualityOfIdeas: Number(qualityEvaluation.qualityOfIdeas) || 0,
    },
    formVersion: 'v1',
    filledAt: inputData.createdAt || new Date().toISOString(),
  };

  // 9. Check if response already exists for this brand+client+cycle+department
  const existingResponse = await CSATResponse.findOne({
    brandId: brand._id,
    clientId: client._id,
    cycleId: cycle._id,
    departmentId: department._id,
  });

  if (existingResponse) {
    // Update existing response
    existingResponse.data = csatData;
    existingResponse.comment = inputData.comment || '';
    existingResponse.submittedAt = new Date();
    existingResponse.sbuId = sbu?._id || null;
    await existingResponse.save();

    console.log(`✅ Updated existing CSAT response: ${existingResponse._id}`);

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
    data: csatData,
    comment: inputData.comment || '',
    submittedAt: new Date(),
    isValid: true,
  });

  console.log(`✅ Created new CSAT response: ${csatResponse._id}`);

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
