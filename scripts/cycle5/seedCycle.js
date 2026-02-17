/**
 * Seed Script - CSAT Cycle 5 Responses
 * Migrates CSAT response data from Cycle 5 into MongoDB
 *
 * Run with: node scripts/seedCycle.js
 * Run AFTER: seedBrands.js, seedSBUs.js, seedDepartments.js (dependencies must exist)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  Brand,
  Client,
  Cycle,
  Department,
  SBU,
  CSATResponse,
} from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

/**
 * CSAT Cycle 5 Response Data
 * Extracted from docs/CSAT_DB_v2_Cycle_5_Data.md
 * Each entry maps to one CSATResponse document
 */
const CYCLE_5_Solution_RESPONSES = [
  {
    brandName: 'iQOO',
    pocName: 'Rashi Anthony',
    phone: '9910879402',
    timestamp: '12/16/2025, 11:02:00 AM',
    comment:
      'The team is totally new, they are getting to know the brand better. Available for calls. The delivery has improved. Good response from the team.',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 4,
      seniorLeadershipInvolvement: 4,
      strategyExecution: 4,
      teamResponsiveness: 4,
      brandUnderstanding: 4,
      dataEffectiveness: 4,
      teamProactivity: 4,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 0,
      qualityOfIdeas: 0,
    },
  },
  {
    brandName: 'Ample Group',
    pocName: 'Nabeel Ahmed',
    phone: '8792488536',
    timestamp: '12/16/2025, 11:16:00 AM',
    comment:
      'No comments. Its been a while since Schbang has been working on the Imagine account. But I feel like that we are making no progress.',
    scores: {
      overallSatisfaction: 1,
      likelihoodToRecommend: 1,
      northStarMetrics: 1,
      seniorLeadershipInvolvement: 1,
      strategyExecution: 1,
      teamResponsiveness: 1,
      brandUnderstanding: 0,
      dataEffectiveness: 0,
      teamProactivity: 1,
      meetingBusinessGoals: 2,
      qualityOfDesignVideo: 1,
      qualityOfIdeas: 1,
    },
  },
  {
    brandName: 'Castrol POWER1',
    pocName: 'Radhika Gokhale',
    phone: '8879689407',
    timestamp: '12/16/2025, 11:38:12 AM',
    comment: 'Goos',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 4,
      seniorLeadershipInvolvement: 4,
      strategyExecution: 4,
      teamResponsiveness: 4,
      brandUnderstanding: 4,
      dataEffectiveness: 3,
      teamProactivity: 4,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 5,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Britannia',
    pocName: 'Shree Das',
    phone: '9718294118',
    timestamp: '12/16/2025, 11:44:35 AM',
    comment: '',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 2,
      strategyExecution: 1,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 3,
      teamProactivity: 2,
      meetingBusinessGoals: 2,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'ITC Limited Corporate',
    pocName: 'Aurko Dasgupta',
    phone: '9831317083',
    timestamp: '12/17/2025, 7:01:56 AM',
    comment: 'Ample scope for improvement.',
    scores: {
      overallSatisfaction: 2,
      likelihoodToRecommend: 2,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 1,
      strategyExecution: 2,
      teamResponsiveness: 2,
      brandUnderstanding: 2,
      dataEffectiveness: 2,
      teamProactivity: 2,
      meetingBusinessGoals: 2,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 2,
    },
  },
  {
    brandName: 'Gyproc',
    pocName: 'Divyesh Panchal',
    phone: '9819123198',
    timestamp: '12/17/2025, 7:04:35 AM',
    comment: 'Na',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 3,
      teamProactivity: 4,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'HDFC Life',
    pocName: 'Ria Das',
    phone: '7045301998',
    timestamp: '12/17/2025, 9:43:12 AM',
    comment:
      'In sync with creative goals. Ideas and thoughts Need to be corroborated with more robust insights.',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 1,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 4,
      dataEffectiveness: 2,
      teamProactivity: 4,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Medimix',
    pocName: 'Siddhartha',
    phone: '9953606758',
    timestamp: '12/17/2025, 10:24:22 AM',
    comment: 'Overall ok',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 3,
      teamProactivity: 3,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Medimix',
    pocName: 'Pooja Suchak',
    phone: '8976075027',
    timestamp: '12/17/2025, 10:46:44 AM',
    comment:
      'Overall, the score stands at 3.5/5. We\'ve observed the team\'s eagerness to improve, learn, and take a solution-oriented approach, which is encouraging. Building stronger synergy, along with greater acceptance and acknowledgement of feedback and the need for change, will be key to driving success for both the brand and the agency. We look forward to an even more productive and impactful next phase.',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 4,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 4,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 2,
      dataEffectiveness: 2,
      teamProactivity: 3,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Castrol POWER1',
    pocName: 'Gaurav Khatri',
    phone: '9130098805',
    timestamp: '12/17/2025, 12:39:19 PM',
    comment: 'Good team to work with',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 4,
      strategyExecution: 4,
      teamResponsiveness: 5,
      brandUnderstanding: 4,
      dataEffectiveness: 2,
      teamProactivity: 3,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Kiehl\'s',
    pocName: 'Avanee Parulekar',
    phone: '9920242841',
    timestamp: '12/17/2025, 1:20:06 PM',
    comment: 'The turnaround has been so amazing!!',
    scores: {
      overallSatisfaction: 5,
      likelihoodToRecommend: 5,
      northStarMetrics: 4,
      seniorLeadershipInvolvement: 5,
      strategyExecution: 5,
      teamResponsiveness: 5,
      brandUnderstanding: 5,
      dataEffectiveness: 4,
      teamProactivity: 5,
      meetingBusinessGoals: 5,
      qualityOfDesignVideo: 5,
      qualityOfIdeas: 5,
    },
  },
  {
    brandName: 'HDFC Bank',
    pocName: 'Akhil',
    phone: '9987564471',
    timestamp: '12/17/2025, 4:09:15 PM',
    comment:
      'Team needs to be more proactive in sharing new ideas, concepts, formats. Lack of brand understaing is still there, need to work collectively to resolve this.',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 2,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 4,
      teamProactivity: 3,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 2,
    },
  },
  {
    brandName: 'IIFL',
    pocName: 'Mritunjay Bisht',
    phone: '9867528257',
    timestamp: '12/18/2025, 9:02:35 AM',
    comment: 'NO comments',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 4,
      teamProactivity: 4,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 2,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Riot Games - Valorant',
    pocName: 'Harsh Sinha',
    phone: '8879949141',
    timestamp: '12/18/2025, 9:02:47 AM',
    comment: '.',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 5,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 4,
      teamResponsiveness: 5,
      brandUnderstanding: 5,
      dataEffectiveness: 4,
      teamProactivity: 5,
      meetingBusinessGoals: 5,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Riot Games - Valorant',
    pocName: 'Anushka Bhatnagar',
    phone: '8959178078',
    timestamp: '12/18/2025, 9:03:19 AM',
    comment: '',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 3,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 2,
      strategyExecution: 4,
      teamResponsiveness: 4,
      brandUnderstanding: 4,
      dataEffectiveness: 3,
      teamProactivity: 4,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Flair Pens',
    pocName: 'Chirag Koli',
    phone: '9769900469',
    timestamp: '12/18/2025, 9:03:39 AM',
    comment: 'Need to work more on content and campaign organic than paid',
    scores: {
      overallSatisfaction: 2,
      likelihoodToRecommend: 2,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 4,
      dataEffectiveness: 2,
      teamProactivity: 3,
      meetingBusinessGoals: 2,
      qualityOfDesignVideo: 2,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'HDFC Bank',
    pocName: 'Dipti Nadkarni',
    phone: '9819661191',
    timestamp: '12/18/2025, 9:04:17 AM',
    comment:
      'Still lacks senior leadership , analytics and data led approach . Team is good with smaller daily task and execution work.',
    scores: {
      overallSatisfaction: 2,
      likelihoodToRecommend: 1,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 1,
      strategyExecution: 2,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 1,
      teamProactivity: 4,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 2,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Milton',
    pocName: 'Priyanka Datta',
    phone: '8130778113',
    timestamp: '12/18/2025, 9:06:52 AM',
    comment: 'Nq',
    scores: {
      overallSatisfaction: 2,
      likelihoodToRecommend: 2,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 4,
      strategyExecution: 3,
      teamResponsiveness: 2,
      brandUnderstanding: 3,
      dataEffectiveness: 0,
      teamProactivity: 3,
      meetingBusinessGoals: 1,
      qualityOfDesignVideo: 1,
      qualityOfIdeas: 2,
    },
  },
  {
    brandName: 'ITC HR',
    pocName: 'Dhrthi Bhatt',
    phone: '9444341510',
    timestamp: '12/18/2025, 10:29:25 AM',
    comment:
      'Improvement is visible. Reva is proactive and works well with feedback',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 3,
      teamProactivity: 3,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Metro',
    pocName: 'Harsh Shah',
    phone: '9833345457',
    timestamp: '12/18/2025, 11:17:37 AM',
    comment:
      'Data alignment with creatives is a miss. Decent ideas which never translate into good execution. Campaign analysis is poor and always needs rework. Senior leadership involvement is appreciated but the day to day work hasnt seen notable growth wrt to consistensy and brand imagery. Thanks nevertheless',
    scores: {
      overallSatisfaction: 1,
      likelihoodToRecommend: 1,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 2,
      teamResponsiveness: 3,
      brandUnderstanding: 3,
      dataEffectiveness: 0,
      teamProactivity: 2,
      meetingBusinessGoals: 2,
      qualityOfDesignVideo: 1,
      qualityOfIdeas: 2,
    },
  },
  {
    brandName: 'Safari Genie',
    pocName: 'Shishir Kumar',
    phone: '9588616839',
    timestamp: '12/18/2025, 12:40:16 PM',
    comment: 'Na',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 4,
      seniorLeadershipInvolvement: 4,
      strategyExecution: 3,
      teamResponsiveness: 5,
      brandUnderstanding: 4,
      dataEffectiveness: 4,
      teamProactivity: 4,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Huggies',
    pocName: 'Pratik',
    phone: '9953948545',
    timestamp: '12/18/2025, 2:37:15 PM',
    comment: 'Execution on influencer campaign is just beyond explanation',
    scores: {
      overallSatisfaction: 2,
      likelihoodToRecommend: 2,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 1,
      teamResponsiveness: 1,
      brandUnderstanding: 1,
      dataEffectiveness: 2,
      teamProactivity: 1,
      meetingBusinessGoals: 2,
      qualityOfDesignVideo: 2,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Celio',
    pocName: 'Rafiq Shaikh',
    phone: '9833202153',
    timestamp: '12/18/2025, 5:08:42 PM',
    comment:
      'Team, all Instagram posts for Celio must be planned in advance and scheduled for 6 PM without exception. For carousel posts, the front and back views of the merchandise must be uploaded sequentially to maintain visual flow. Currently, images are being uploaded randomly, which dilutes the product story. Additionally, final polished creatives are being shared very late, leaving no room for review or correction. This needs immediate improvement.',
    scores: {
      overallSatisfaction: 1,
      likelihoodToRecommend: 3,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 1,
      strategyExecution: 2,
      teamResponsiveness: 2,
      brandUnderstanding: 2,
      dataEffectiveness: 2,
      teamProactivity: 1,
      meetingBusinessGoals: 2,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 1,
    },
  },
  {
    brandName: 'Celio',
    pocName: 'Rejoy Rajan',
    phone: '9686188441',
    timestamp: '12/19/2025, 6:48:19 AM',
    comment: 'Loads to do before we go. . .',
    scores: {
      overallSatisfaction: 2,
      likelihoodToRecommend: 3,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 2,
      strategyExecution: 2,
      teamResponsiveness: 4,
      brandUnderstanding: 2,
      dataEffectiveness: 2,
      teamProactivity: 1,
      meetingBusinessGoals: 2,
      qualityOfDesignVideo: 2,
      qualityOfIdeas: 2,
    },
  },
  {
    brandName: 'CRIF High Mark',
    pocName: 'Garima Singh',
    phone: '9819037898',
    timestamp: '12/19/2025, 7:12:52 AM',
    comment: 'Attention to detail is required',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 4,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 4,
      teamResponsiveness: 4,
      brandUnderstanding: 4,
      dataEffectiveness: 4,
      teamProactivity: 4,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Mahindra Rise',
    pocName: 'Shilpi Dubey Pathak',
    phone: '9004082459',
    timestamp: '12/19/2025, 8:19:34 AM',
    comment: 'Quality of work can improve a lot',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 5,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 5,
      strategyExecution: 3,
      teamResponsiveness: 5,
      brandUnderstanding: 3,
      dataEffectiveness: 3,
      teamProactivity: 5,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Mahindra Rise',
    pocName: 'Avantika',
    phone: '9833779503',
    timestamp: '12/19/2025, 8:20:30 AM',
    comment: '',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 4,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 3,
      teamProactivity: 3,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'HDFC Bank',
    pocName: 'Alisha',
    phone: '9769171848',
    timestamp: '12/19/2025, 11:38:10 AM',
    comment: '.',
    scores: {
      overallSatisfaction: 1,
      likelihoodToRecommend: 0,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 1,
      strategyExecution: 0,
      teamResponsiveness: 3,
      brandUnderstanding: 0,
      dataEffectiveness: 2,
      teamProactivity: 0,
      meetingBusinessGoals: 2,
      qualityOfDesignVideo: 2,
      qualityOfIdeas: 2,
    },
  },
  {
    brandName: 'Greencell NueGo',
    pocName: 'Vishal Gundetty',
    phone: '9920697652',
    timestamp: '12/19/2025, 12:51:28 PM',
    comment:
      'Good work by Tanmay More, Manan Gala, Rudrangshu Tripathy and all the designers ans creative team',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 4,
      seniorLeadershipInvolvement: 4,
      strategyExecution: 4,
      teamResponsiveness: 5,
      brandUnderstanding: 4,
      dataEffectiveness: 4,
      teamProactivity: 4,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'CRIF High Mark',
    pocName: 'Greeshma Nachane',
    phone: '9920959673',
    timestamp: '12/19/2025, 5:44:29 PM',
    comment:
      'Few new team members need to understand the brand and products well. The lack of understanding is visible in the ideas or the way they communicate.',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 3,
      teamProactivity: 4,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Aditya Birla Novel',
    pocName: 'Delzeen Damania',
    phone: '9321539567',
    timestamp: '12/20/2025, 2:59:19 AM',
    comment:
      'The team struggles to adhere to timelines committed. There is lack of innovation and fresh content. There is no data backed or competior analysis insights to help improve content. Misses in a lot of hygene checks. Design sensibility needs to adapat and improbe with time',
    scores: {
      overallSatisfaction: 2,
      likelihoodToRecommend: 2,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 4,
      strategyExecution: 2,
      teamResponsiveness: 3,
      brandUnderstanding: 3,
      dataEffectiveness: 1,
      teamProactivity: 3,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 2,
      qualityOfIdeas: 2,
    },
  },
  {
    brandName: 'Simpolo',
    pocName: 'Nilotpal Chakraborty',
    phone: '9974408808',
    timestamp: '12/20/2025, 6:08:09 AM',
    comment:
      'I feel solutions team now is not that concerns about bau social ideas and this can be easily seen in the references and concepts shared also we are not able to match the timeline on execution and output quality. It seems since the change of poc has i sense this jmpact on brand bau content & we are very slow and late on catching up trends on social media that is not right. I still feel ORM has issue still across linkedin and Instagram and fb. Lack of competition data analytics and understanding content analysis.',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 4,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 2,
      teamProactivity: 3,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Gyproc',
    pocName: 'Ankur Bali',
    phone: '9833999165',
    timestamp: '12/22/2025, 7:03:26 AM',
    comment: '',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 4,
      dataEffectiveness: 4,
      teamProactivity: 4,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Dominos',
    pocName: 'Surabhi Prasoon',
    phone: '8299775274',
    timestamp: '12/22/2025, 10:34:38 AM',
    comment: '',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 1,
      strategyExecution: 3,
      teamResponsiveness: 2,
      brandUnderstanding: 4,
      dataEffectiveness: 2,
      teamProactivity: 3,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'UltraTech Cement',
    pocName: 'Kanupriya Didwaniya',
    phone: '9967717670',
    timestamp: '12/22/2025, 1:40:02 PM',
    comment: 'We need to align better',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 4,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 5,
      strategyExecution: 2,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 2,
      teamProactivity: 3,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Cavin Kare',
    pocName: 'Akashivan Suresh',
    phone: '9791052222',
    timestamp: '12/22/2025, 1:50:38 PM',
    comment: 'All good',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 4,
      seniorLeadershipInvolvement: 4,
      strategyExecution: 4,
      teamResponsiveness: 4,
      brandUnderstanding: 4,
      dataEffectiveness: 4,
      teamProactivity: 4,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Encore',
    pocName: 'Sachin Vishwakarma',
    phone: '9870559269',
    timestamp: '12/23/2025, 3:57:47 AM',
    comment: 'All the best',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 4,
      strategyExecution: 4,
      teamResponsiveness: 4,
      brandUnderstanding: 4,
      dataEffectiveness: 3,
      teamProactivity: 4,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'L\'oreal Professionnel',
    pocName: 'Shreya Mohan',
    phone: '9620991342',
    timestamp: '12/23/2025, 4:54:36 AM',
    comment:
      'Have had a pleasant time working with the team. Would really give a shout out to Neha Bedse who has really understood what LPro Needs v quickly.',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 5,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 5,
      strategyExecution: 4,
      teamResponsiveness: 5,
      brandUnderstanding: 4,
      dataEffectiveness: 3,
      teamProactivity: 5,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'L\'oreal Redken',
    pocName: 'Vidhi Dhruv',
    phone: '9619714546',
    timestamp: '12/23/2025, 6:26:15 AM',
    comment:
      'Happy with the teams commitment to tasks- be it big or small. More collaboration required on creative for brand- that\'s something we need to work on as well.',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 5,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 3,
      teamResponsiveness: 5,
      brandUnderstanding: 3,
      dataEffectiveness: 3,
      teamProactivity: 4,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Simpolo',
    pocName: 'Deep Aghara',
    phone: '8511356222',
    timestamp: '12/23/2025, 7:43:26 AM',
    comment: 'Better performance then before',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 4,
      seniorLeadershipInvolvement: 5,
      strategyExecution: 4,
      teamResponsiveness: 5,
      brandUnderstanding: 5,
      dataEffectiveness: 3,
      teamProactivity: 4,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 4,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Oriana',
    pocName: 'Rajagopalan M',
    phone: '7904206683',
    timestamp: '12/23/2025, 9:03:04 AM',
    comment: 'Overall Good',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      northStarMetrics: 5,
      seniorLeadershipInvolvement: 5,
      strategyExecution: 4,
      teamResponsiveness: 5,
      brandUnderstanding: 4,
      dataEffectiveness: 4,
      teamProactivity: 5,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 4,
    },
  },
  {
    brandName: 'Kerastase',
    pocName: 'Smridhi Kapur',
    phone: '8368979592',
    timestamp: '12/24/2025, 4:36:56 AM',
    comment: 'Na',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 4,
      seniorLeadershipInvolvement: 2,
      strategyExecution: 3,
      teamResponsiveness: 5,
      brandUnderstanding: 4,
      dataEffectiveness: 2,
      teamProactivity: 3,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Lancome',
    pocName: 'Divya Kalra',
    phone: '9711862718',
    timestamp: '12/24/2025, 9:03:36 AM',
    comment:
      'team is very high on responsiveness and pro active with a great positive attitude.',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 3,
      seniorLeadershipInvolvement: 3,
      strategyExecution: 4,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 3,
      teamProactivity: 5,
      meetingBusinessGoals: 4,
      qualityOfDesignVideo: 3,
      qualityOfIdeas: 3,
    },
  },
  {
    brandName: 'Optimum Nutrition + Isopure',
    pocName: 'Amit Midha',
    phone: '9999371335',
    timestamp: '12/29/2025, 9:12:02 AM',
    comment:
      'Team needs to pull up their performance on creative execution. Senior resources involvement is limited . Only junior client servicing people are responsive .',
    scores: {
      overallSatisfaction: 2,
      likelihoodToRecommend: 1,
      northStarMetrics: 1,
      seniorLeadershipInvolvement: 0,
      strategyExecution: 3,
      teamResponsiveness: 4,
      brandUnderstanding: 3,
      dataEffectiveness: 0,
      teamProactivity: 1,
      meetingBusinessGoals: 2,
      qualityOfDesignVideo: 2,
      qualityOfIdeas: 1,
    },
  },
  {
    brandName: 'Amazon SEA',
    pocName: 'Michelle Chua',
    phone: '1111111111',
    timestamp: '17/12/2025, 15:52',
    comment:
      'Deepesh has been a strong and reliable support system for our business, consistently demonstrating high ownership and accountability in everything he does. He is proactive in identifying opportunities and sharing ideas that contribute meaningfully to business growth, often going beyond his core responsibilities to ensure strong outcomes. One of Deepesh\'s key strengths is his ability to keep stakeholders well informed. He provides clear and timely updates on the progress of his work, which gives me strong confidence in having him a',
    scores: {
      overallSatisfaction: 5,
      likelihoodToRecommend: 5,
      northStarMetrics: 5,
      seniorLeadershipInvolvement: 5,
      strategyExecution: 5,
      teamResponsiveness: 5,
      brandUnderstanding: 5,
      dataEffectiveness: 4,
      teamProactivity: 5,
      meetingBusinessGoals: 5,
      qualityOfDesignVideo: 5,
      qualityOfIdeas: 5,
    },
  },
  {
    brandName: 'Amazon FUSE',
    pocName: 'Alejandra Hurtado',
    phone: '2222222222',
    timestamp: '17/12/2025, 16:01',
    comment: 'Na',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      northStarMetrics: 2,
      seniorLeadershipInvolvement: 1,
      strategyExecution: 2,
      teamResponsiveness: 3,
      brandUnderstanding: 2,
      dataEffectiveness: 2,
      teamProactivity: 2,
      meetingBusinessGoals: 3,
      qualityOfDesignVideo: 0,
      qualityOfIdeas: 0,
    },
  },
];

/**
 * CSAT Cycle 5 Media Department Response Data
 * Extracted from docs/CSAT_DB_v2_Cycle_5_Data.md
 */
const CYCLE_5_MEDIA_RESPONSES = [
  {
    brandName: 'ACCA',
    pocName: 'Saahil Kalvani',
    phone: '919820835273',
    timestamp: '12/16/2025, 11:15:17 AM',
    comment: 'Najuka and her team are doing a fantastic job. Thanks',
    scores: {
      overallSatisfaction: 5,
      likelihoodToRecommend: 5,
      strategyAlignment: 5,
      teamProactivity: 5,
      creativeRefreshment: 5,
      teamCollaboration: 5,
      optimizationEffectiveness: 5,
      timelyExecution: 5,
      teamTransparency: 5,
      feedbackResponse: 5,
      overallEffectiveness: 5,
    },
  },
  {
    brandName: 'Hobby Ideas',
    pocName: 'Jay Desai',
    phone: '918600801263',
    timestamp: '12/17/2025, 7:02:41 AM',
    comment: 'Need more proactive inputs from the team.',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 3,
      strategyAlignment: 4,
      teamProactivity: 3,
      creativeRefreshment: 2,
      teamCollaboration: 3,
      optimizationEffectiveness: 3,
      timelyExecution: 4,
      teamTransparency: 5,
      feedbackResponse: 4,
      overallEffectiveness: 3,
    },
  },
  {
    brandName: 'Medimix',
    pocName: 'Pooja Suchak',
    phone: '918976075027',
    timestamp: '12/17/2025, 10:51:08 AM',
    comment:
      'There is a need for the media team to take greater ownership of their responsibilities, while staying closely aligned with the objectives being pursued and fully synced with the proposed content strategy and the solutions team. Accuracy in reports and presentations is critical and needs to be consistently ensured. On a positive note, the end goal remains clear, and we are aligned and on track to achieve it.',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      strategyAlignment: 3,
      teamProactivity: 3,
      creativeRefreshment: 2,
      teamCollaboration: 2,
      optimizationEffectiveness: 4,
      timelyExecution: 3,
      teamTransparency: 3,
      feedbackResponse: 2,
      overallEffectiveness: 3,
    },
  },
  {
    brandName: 'Metro',
    pocName: 'Harsh Shah',
    phone: '919833345457',
    timestamp: '12/18/2025, 11:18:31 AM',
    comment: 'NA',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 3,
      strategyAlignment: 3,
      teamProactivity: 3,
      creativeRefreshment: 1,
      teamCollaboration: 4,
      optimizationEffectiveness: 3,
      timelyExecution: 4,
      teamTransparency: 3,
      feedbackResponse: 4,
      overallEffectiveness: 4,
    },
  },
  {
    brandName: 'Groviva',
    pocName: 'Anjali Pawar',
    phone: '917972446697',
    timestamp: '12/18/2025, 2:49:47 PM',
    comment: 'O',
    scores: {
      overallSatisfaction: 3,
      likelihoodToRecommend: 3,
      strategyAlignment: 3,
      teamProactivity: 5,
      creativeRefreshment: 4,
      teamCollaboration: 4,
      optimizationEffectiveness: 4,
      timelyExecution: 4,
      teamTransparency: 4,
      feedbackResponse: 4,
      overallEffectiveness: 5,
    },
  },
  {
    brandName: 'Mahindra Rise',
    pocName: 'Avantika',
    phone: '919833779503',
    timestamp: '12/19/2025, 8:21:31 AM',
    comment: 'NA',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      strategyAlignment: 4,
      teamProactivity: 4,
      creativeRefreshment: 4,
      teamCollaboration: 4,
      optimizationEffectiveness: 4,
      timelyExecution: 4,
      teamTransparency: 4,
      feedbackResponse: 4,
      overallEffectiveness: 4,
    },
  },
  {
    brandName: 'Simpolo',
    pocName: 'Nilotpal Chakraborty',
    phone: '919974408808',
    timestamp: '12/20/2025, 6:18:11 AM',
    comment:
      'Optimisation is not taken properly and i don\'t believe just to burn money. Earlier we were very closely monitoring CPL and quality of lead. Awareness campaigns are good and no issue in them but performance is major concern. I want the team to highly be active on data interpretation and understanding business goals and targets. We cannot miss on KPI. Linkedkn ads took us two months to activate so delayed approach is not good. Its been observed that at times im giving solutions to media team on strategy pov. We have never analysed creative performances and A/B testing on performance campaigns',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 3,
      strategyAlignment: 4,
      teamProactivity: 4,
      creativeRefreshment: 2,
      teamCollaboration: 3,
      optimizationEffectiveness: 2,
      timelyExecution: 4,
      teamTransparency: 4,
      feedbackResponse: 4,
      overallEffectiveness: 3,
    },
  },
  {
    brandName: 'Kosmoderma',
    pocName: 'Albin',
    phone: '919980202719',
    timestamp: '1/7/2026, 12:29:07',
    comment:
      'We are very happy with Schbang\'s performance marketing efforts. The team demonstrated a strong understanding of our business objectives and executed performance campaigns with clear strategic direction.',
    scores: {
      overallSatisfaction: 4,
      likelihoodToRecommend: 4,
      strategyAlignment: 4,
      teamProactivity: 4,
      creativeRefreshment: 4,
      teamCollaboration: 4,
      optimizationEffectiveness: 5,
      timelyExecution: 5,
      teamTransparency: 4,
      feedbackResponse: 5,
      overallEffectiveness: 5,
    },
  },
];

/**
 * Generate slug from name
 */
const generateSlug = name => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Parse timestamp string to Date object
 */
const parseTimestamp = timestampStr => {
  // Handle formats like "12/16/2025, 11:02:00 AM" or "17/12/2025, 15:52"
  try {
    // Try standard format first
    const date = new Date(timestampStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    // Try DD/MM/YYYY format
    const parts = timestampStr.match(
      /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2})/
    );
    if (parts) {
      const [, day, month, year, hour, minute] = parts;
      return new Date(year, month - 1, day, hour, minute);
    }
    return new Date();
  } catch {
    return new Date();
  }
};

/**
 * Seed CSAT Responses for Cycle 5
 */
async function seedCycle5Responses() {
  console.log('📊 Seeding CSAT Cycle 5 Responses...\n');

  // Step 1: Get or create Cycle 5 for 2025
  let cycle = await Cycle.findOne({ year: 2025, cycleNumber: 5 });
  if (!cycle) {
    cycle = await Cycle.create({
      name: 'Cycle 5',
      cycleNumber: 5,
      year: 2025,
      startDate: new Date(2025, 10, 1), // November 1
      endDate: new Date(2025, 11, 31, 23, 59, 59), // December 31
      status: 'closed',
      isActive: true,
    });
    console.log('  ✓ Created Cycle 5 (2025)');
  } else {
    console.log(`  ✓ Found existing Cycle 5 (2025) - ID: ${cycle._id}`);
  }

  // Step 2: Get Brand Solutions department from DB
  let solutionsDept = await Department.findOne({ name: 'solutions' });
  if (!solutionsDept) {
    solutionsDept = await Department.create({
      name: 'solutions',
      isActive: true,
    });
    console.log('  ✓ Created Brand Solutions department');
  } else {
    console.log(
      `  ✓ Found Brand Solutions department - ID: ${solutionsDept._id}`
    );
  }

  // Step 3: Get all brands from DB mapped by name/slug
  const brands = await Brand.find({});
  const brandMap = {};
  brands.forEach(brand => {
    brandMap[brand.name] = brand;
    brandMap[brand.name.toLowerCase()] = brand;
    brandMap[generateSlug(brand.name)] = brand;
  });
  console.log(`  ✓ Loaded ${brands.length} brands from database`);

  // Step 4: Get all SBUs from DB
  const sbus = await SBU.find({});
  const sbuMap = {};
  sbus.forEach(sbu => {
    sbuMap[sbu.name] = sbu;
    sbuMap[generateSlug(sbu.name)] = sbu;
  });
  console.log(`  ✓ Loaded ${sbus.length} SBUs from database`);

  console.log('\n🔄 Processing responses...\n');

  let created = 0;
  let skipped = 0;
  let errors = 0;
  const missingBrands = new Set();

  for (const response of CYCLE_5_Solution_RESPONSES) {
    try {
      // Find brand in DB
      let brand =
        brandMap[response.brandName] ||
        brandMap[response.brandName.toLowerCase()] ||
        brandMap[generateSlug(response.brandName)];

      if (!brand) {
        // Create brand if not exists
        const slug = generateSlug(response.brandName);
        brand = await Brand.create({
          name: response.brandName,
          slug,
          services: [{ department: 'solutions', isActive: true }],
          isActive: true,
        });
        brandMap[response.brandName] = brand;
        missingBrands.add(response.brandName);
        console.log(`    + Created missing brand: ${response.brandName}`);
      }

      // Find or create client (POC)
      let client = await Client.findOne({
        brandId: brand._id,
        phone: response.phone,
      });

      if (!client) {
        client = await Client.create({
          brandId: brand._id,
          name: response.pocName,
          phone: response.phone,
          serviceMapping: [{ department: 'solutions', isActive: true }],
          isActive: true,
        });
      }

      // Check if response already exists for this brand+client+cycle+department
      const existingResponse = await CSATResponse.findOne({
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycle._id,
        departmentId: solutionsDept._id,
      });

      if (existingResponse) {
        skipped++;
        console.log(
          `  ⏭️  Skipped (exists): ${response.brandName} - ${response.pocName}`
        );
        continue;
      }

      // Get SBU from brand's services if available
      const brandSolutionsService = brand.services?.find(
        s => s.department === 'solutions'
      );
      const sbuId = brandSolutionsService?.sbuId || null;

      // Build the data object for CSATResponse (schemaless Mixed field)
      const csatData = {
        servicesCovered: {
          solutions: true,
          media: false,
          tech: false,
          seo: false,
          martech: false,
          fluence: false,
          smp: false,
        },
        coreMetrics: {
          overallSatisfaction: response.scores.overallSatisfaction,
          likelihoodToRecommend: response.scores.likelihoodToRecommend,
          northStarMetrics: response.scores.northStarMetrics,
          seniorLeadershipInvolvement:
            response.scores.seniorLeadershipInvolvement,
          strategyExecution: response.scores.strategyExecution,
          teamResponsiveness: response.scores.teamResponsiveness,
          brandUnderstanding: response.scores.brandUnderstanding,
        },
        deliveryMetrics: {
          dataEffectiveness: response.scores.dataEffectiveness,
          teamProactivity: response.scores.teamProactivity,
          meetingBusinessGoals: response.scores.meetingBusinessGoals,
        },
        qualityEvaluation: {
          qualityOfDesignVideo: response.scores.qualityOfDesignVideo,
          qualityOfIdeas: response.scores.qualityOfIdeas,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp).toISOString(),
      };

      // Create CSAT Response
      await CSATResponse.create({
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycle._id,
        departmentId: solutionsDept._id,
        sbuId,
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ ${response.brandName} - ${response.pocName} (Score: ${response.scores.overallSatisfaction})`
      );
    } catch (error) {
      errors++;
      console.error(
        `  ✗ Failed: ${response.brandName} - ${response.pocName}: ${error.message}`
      );
    }
  }

  console.log(
    `\n✅ Solutions seeding complete: ${created} created, ${skipped} skipped, ${errors} errors`
  );

  if (missingBrands.size > 0) {
    console.log(
      `\n⚠️  Created ${missingBrands.size} missing brands: ${Array.from(missingBrands).join(', ')}`
    );
  }
}

/**
 * Seed CSAT Responses for Cycle 5 - Media Department
 */
async function seedCycle5MediaResponses() {
  console.log('\n📺 Seeding CSAT Cycle 5 Media Responses...\n');

  // Step 1: Get Cycle 5 for 2025
  const cycle = await Cycle.findOne({ year: 2025, cycleNumber: 5 });
  if (!cycle) {
    console.error('  ✗ Cycle 5 (2025) not found. Run Solutions seeding first.');
    return;
  }
  console.log(`  ✓ Found Cycle 5 (2025) - ID: ${cycle._id}`);

  // Step 2: Get Media department from DB
  let mediaDept = await Department.findOne({ name: 'media' });
  if (!mediaDept) {
    mediaDept = await Department.create({
      name: 'media',
      isActive: true,
    });
    console.log('  ✓ Created Media department');
  } else {
    console.log(`  ✓ Found Media department - ID: ${mediaDept._id}`);
  }

  // Step 3: Get all brands from DB
  const brands = await Brand.find({});
  const brandMap = {};
  brands.forEach(brand => {
    brandMap[brand.name] = brand;
    brandMap[brand.name.toLowerCase()] = brand;
    brandMap[generateSlug(brand.name)] = brand;
  });
  console.log(`  ✓ Loaded ${brands.length} brands from database`);

  console.log('\n🔄 Processing Media responses...\n');

  let created = 0;
  let skipped = 0;
  let errors = 0;
  const missingBrands = new Set();

  for (const response of CYCLE_5_MEDIA_RESPONSES) {
    try {
      // Find brand in DB
      let brand =
        brandMap[response.brandName] ||
        brandMap[response.brandName.toLowerCase()] ||
        brandMap[generateSlug(response.brandName)];

      if (!brand) {
        // Create brand if not exists
        const slug = generateSlug(response.brandName);
        brand = await Brand.create({
          name: response.brandName,
          slug,
          services: [{ department: 'media', isActive: true }],
          isActive: true,
        });
        brandMap[response.brandName] = brand;
        missingBrands.add(response.brandName);
        console.log(`    + Created missing brand: ${response.brandName}`);
      }

      // Find or create client (POC)
      let client = await Client.findOne({
        brandId: brand._id,
        phone: response.phone,
      });

      if (!client) {
        client = await Client.create({
          brandId: brand._id,
          name: response.pocName,
          phone: response.phone,
          serviceMapping: [{ department: 'media', isActive: true }],
          isActive: true,
        });
      }

      // Check if response already exists
      const existingResponse = await CSATResponse.findOne({
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycle._id,
        departmentId: mediaDept._id,
      });

      if (existingResponse) {
        skipped++;
        console.log(
          `  ⏭️  Skipped (exists): ${response.brandName} - ${response.pocName}`
        );
        continue;
      }

      // Build the data object for Media CSATResponse
      const csatData = {
        servicesCovered: {
          solutions: false,
          media: true,
          tech: false,
          seo: false,
          martech: false,
          fluence: false,
          smp: false,
        },
        coreMetrics: {
          overallSatisfaction: response.scores.overallSatisfaction,
          likelihoodToRecommend: response.scores.likelihoodToRecommend,
          strategyAlignment: response.scores.strategyAlignment,
          teamProactivity: response.scores.teamProactivity,
          creativeRefreshment: response.scores.creativeRefreshment,
          teamCollaboration: response.scores.teamCollaboration,
        },
        deliveryMetrics: {
          optimizationEffectiveness: response.scores.optimizationEffectiveness,
          timelyExecution: response.scores.timelyExecution,
          teamTransparency: response.scores.teamTransparency,
          feedbackResponse: response.scores.feedbackResponse,
          overallEffectiveness: response.scores.overallEffectiveness,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp).toISOString(),
      };

      // Create CSAT Response
      await CSATResponse.create({
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycle._id,
        departmentId: mediaDept._id,
        sbuId: null, // Media doesn't have SBU assignments
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ ${response.brandName} - ${response.pocName} (Score: ${response.scores.overallSatisfaction})`
      );
    } catch (error) {
      errors++;
      console.error(
        `  ✗ Failed: ${response.brandName} - ${response.pocName}: ${error.message}`
      );
    }
  }

  console.log(
    `\n✅ Media seeding complete: ${created} created, ${skipped} skipped, ${errors} errors`
  );

  if (missingBrands.size > 0) {
    console.log(
      `\n⚠️  Created ${missingBrands.size} missing brands: ${Array.from(missingBrands).join(', ')}`
    );
  }
}

/**
 * Main Seed Function
 */
async function seed() {
  console.log('🌱 Starting CSAT Cycle 5 Seeding...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Seed Solutions Department
    await seedCycle5Responses();

    // Seed Media Department
    await seedCycle5MediaResponses();

    // Summary
    const cycle = await Cycle.findOne({ year: 2025, cycleNumber: 5 });
    if (cycle) {
      const responseCount = await CSATResponse.countDocuments({
        cycleId: cycle._id,
      });
      const solutionsDept = await Department.findOne({ name: 'solutions' });
      const mediaDept = await Department.findOne({ name: 'media' });

      const solutionsCount = solutionsDept
        ? await CSATResponse.countDocuments({
          cycleId: cycle._id,
          departmentId: solutionsDept._id,
        })
        : 0;
      const mediaCount = mediaDept
        ? await CSATResponse.countDocuments({
          cycleId: cycle._id,
          departmentId: mediaDept._id,
        })
        : 0;

      console.log('\n📊 Cycle 5 Final Summary:');
      console.log(`   Total Responses: ${responseCount}`);
      console.log(`   Solutions Responses: ${solutionsCount}`);
      console.log(`   Media Responses: ${mediaCount}`);

      const stats = await CSATResponse.getCycleStats(cycle._id);
      console.log(`   Average CSAT: ${stats.avgCsat || 'N/A'}`);
      console.log(`   Average NPS: ${stats.avgNps || 'N/A'}`);
      console.log(`   Brands Filled: ${stats.brandsFilled || 0}`);
      console.log(`   POCs Filled: ${stats.pocsFilled || 0}`);
    }

    console.log('\n🎉 Cycle 5 seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run seed
seed();
