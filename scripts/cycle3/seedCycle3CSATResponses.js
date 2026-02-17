/**
 * Seed Script - CSAT Responses for Cycle 3
 * Populates CSAT survey responses from Cycle 3 Solutions data
 *
 * KEY FEATURE: Uses History models (BrandHistory, ClientHistory, SBUHistory)
 * to get brand, client, and SBU references for historical accuracy
 *
 * Run with: node scripts/cycle3/seedCycle3CSATResponses.js
 * Run AFTER: seedCycle3BrandsAndClients.js and seedCycle3SBUs.js
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
  BrandHistory,
  ClientHistory,
  SBUHistory,
} from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

/**
 * Cycle 3 Solutions CSAT Responses from CSV
 * Parsed from docs/Cycle3/CSAT DB Cycle 3 Solutions.csv
 */
const CYCLE3_SOLUTIONS_RESPONSES = [
  {
    phone: '919601986101',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 5,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 5,
    teamProactivity: 5,
    meetingBusinessGoals: 5,
    timestamp: '9/15/2025, 1:31:33 PM',
    comment: 'Great',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 4,
  },
  {
    phone: '919911983404',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 1,
    meetingBusinessGoals: 3,
    timestamp: '9/15/2025, 1:31:38 PM',
    comment: 'Timeliness and ideation is missing',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 2,
  },
  {
    phone: '918286259566',
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
    timestamp: '9/15/2025, 1:32:58 PM',
    comment: 'Good team',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '917989190494',
    overallSatisfaction: 1,
    likelihoodToRecommend: 1,
    northStarMetrics: 0,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 0,
    teamResponsiveness: 2,
    brandUnderstanding: 0,
    dataEffectiveness: 0,
    teamProactivity: 0,
    meetingBusinessGoals: 0,
    timestamp: '9/15/2025, 2:25:02 PM',
    comment: 'The team hasn\'t understood the requirement.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919014000253',
    overallSatisfaction: 0,
    likelihoodToRecommend: 0,
    northStarMetrics: 0,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 0,
    teamResponsiveness: 0,
    brandUnderstanding: 0,
    dataEffectiveness: 0,
    teamProactivity: 0,
    meetingBusinessGoals: 0,
    timestamp: '9/15/2025, 7:04:59 PM',
    comment: 'They dont know whats needed',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 1,
  },
  {
    phone: '919987564471',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/15/2025, 7:08:30 PM',
    comment: 'Frequent team changes lead to lack of brand understanding',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919705311188',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 5,
    meetingBusinessGoals: 4,
    timestamp: '9/15/2025, 7:13:29 PM',
    comment:
      'The quality of ideas could be better aligned with our brand identity.',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 3,
  },
  {
    phone: '918130370322',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '9/15/2025, 3:34:17 PM',
    comment: 'NA',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919974408808',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 5,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 5,
    timestamp: '9/15/2025, 4:02:27 PM',
    comment:
      'Reason of choosing 3 and not 4 is when the team shifts the complete download of brand gets missed',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919867750993',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '9/16/2025, 2:59:37 AM',
    comment: 'The team is on the job',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '917506366446',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '9/16/2025, 5:20:24 AM',
    comment:
      'Overall, good. Would like to see more involvement of the senior members.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919819242252',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 5,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 5,
    teamResponsiveness: 5,
    brandUnderstanding: 5,
    dataEffectiveness: 5,
    teamProactivity: 5,
    meetingBusinessGoals: 5,
    timestamp: '9/16/2025, 11:15:31 AM',
    comment: 'NA',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 5,
  },
  {
    phone: '919819037898',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 5,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 5,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 5,
    teamProactivity: 4,
    meetingBusinessGoals: 5,
    timestamp: '9/16/2025, 11:17:00 AM',
    comment: 'The first month has been good with proper measurable outputs.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919718294118',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 5,
    meetingBusinessGoals: 3,
    timestamp: '9/16/2025, 11:20:09 AM',
    comment:
      'Great team to get things done but need a bit of push for strategic thinking',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919819661191',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '9/16/2025, 12:25:09 PM',
    comment: 'Need data insights and content strategy',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919873737338',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 4,
    timestamp: '9/16/2025, 10:47:48 PM',
    comment: 'Expect a better planning and timeline based execution.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '919920697652',
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
    timestamp: '9/17/2025, 6:39:39 AM',
    comment: 'Great work',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919791052222',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 5,
    meetingBusinessGoals: 4,
    timestamp: '9/17/2025, 10:51:56 AM',
    comment: 'No additional comments',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 5,
  },
  {
    phone: '918910952405',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 3,
    teamResponsiveness: 2,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '9/17/2025, 10:52:05 AM',
    comment: 'NA',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 2,
  },
  {
    phone: '919769016631',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 1,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '9/17/2025, 10:52:25 AM',
    comment: 'The team has significantly improved as compared to last year!',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919833393092',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '9/17/2025, 10:56:42 AM',
    comment: 'August was a better month',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919769900469',
    overallSatisfaction: 2,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 2,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 2,
    timestamp: '9/17/2025, 10:56:44 AM',
    comment: 'The management is not much satisfied',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 3,
  },
  {
    phone: '918792488536',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 4,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/17/2025, 10:56:51 AM',
    comment: 'Schbang came on board with us at a very crucial time',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '919833791214',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/17/2025, 10:59:12 AM',
    comment: 'Team does not fully understand the brand',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919920140092',
    overallSatisfaction: 1,
    likelihoodToRecommend: 1,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 1,
    teamResponsiveness: 4,
    brandUnderstanding: 1,
    dataEffectiveness: 1,
    teamProactivity: 1,
    meetingBusinessGoals: 2,
    timestamp: '9/17/2025, 11:01:35 AM',
    comment: 'The expectation is much more than what is being delivered',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 1,
  },
  {
    phone: '918240069147',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 5,
    meetingBusinessGoals: 4,
    timestamp: '9/17/2025, 11:01:50 AM',
    comment: 'I feel the copy and creative output quality needs a lot of work.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919867528257',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '9/17/2025, 11:13:17 AM',
    comment: 'Good job so far.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919686188441',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 2,
    teamResponsiveness: 5,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 3,
    timestamp: '9/17/2025, 11:27:22 AM',
    comment: 'Need more digital proactive ideas',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 2,
  },
  {
    phone: '919731633299',
    overallSatisfaction: 2,
    likelihoodToRecommend: 0,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 0,
    teamResponsiveness: 3,
    brandUnderstanding: 2,
    dataEffectiveness: 0,
    teamProactivity: 4,
    meetingBusinessGoals: 2,
    timestamp: '9/17/2025, 11:40:23 AM',
    comment: 'Bad performance on delivering timelines',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 1,
  },
  {
    phone: '919967328906',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '9/17/2025, 1:17:21 PM',
    comment: 'NA',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919833779503',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/18/2025, 7:52:20 AM',
    comment: 'The design and video edits need to improve.',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 3,
  },
  {
    phone: '919748185433',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 5,
    meetingBusinessGoals: 3,
    timestamp: '9/18/2025, 12:04:26 PM',
    comment: 'Team ia good in everyday execution with a good TAT.',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 3,
  },
  {
    phone: '917211184610',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 2,
    brandUnderstanding: 2,
    dataEffectiveness: 3,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '9/18/2025, 12:30:22 PM',
    comment: 'The experience till now has been quite mixed',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919920399816',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '9/18/2025, 1:11:53 PM',
    comment: 'Its a great team to work with',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '918130778113',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/18/2025, 1:19:31 PM',
    comment: 'The turnover is high and thats makes it difficult',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '919920238249',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 1,
    timestamp: '9/18/2025, 2:17:38 PM',
    comment:
      'Media planning and performance marketing haven\'t been meeting our targets.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '917045301998',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/18/2025, 8:48:20 PM',
    comment: 'Very cooperative team',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '917904206683',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 4,
    timestamp: '9/19/2025, 4:48:59 AM',
    comment: 'Overall team schbang is doing a phenomenal job.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 5,
  },
  {
    phone: '919619516247',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '9/19/2025, 1:34:47 PM',
    comment: 'The NMACC CS team is usually on top of things',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919820428590',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 5,
    teamResponsiveness: 4,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '9/19/2025, 2:28:15 PM',
    comment: 'More innovative and out of box ideas needed.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919967717670',
    overallSatisfaction: 2,
    likelihoodToRecommend: 3,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 1,
    teamProactivity: 2,
    meetingBusinessGoals: 1,
    timestamp: '9/20/2025, 1:58:17 AM',
    comment: 'Great potential.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '919711000590',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '9/20/2025, 8:18:21 AM',
    comment: 'Creative hygiene part need to be taken care of',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '918591481423',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/20/2025, 8:27:56 AM',
    comment: 'It\'s been an exciting collaboration so far.',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 3,
  },
  {
    phone: '919321539567',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 1,
    teamProactivity: 2,
    meetingBusinessGoals: 4,
    timestamp: '9/20/2025, 8:29:10 AM',
    comment: 'Timeliness can be met better',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919769943531',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 0,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 0,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '9/20/2025, 8:32:34 AM',
    comment: 'N.A.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919769764336',
    overallSatisfaction: 2,
    likelihoodToRecommend: 0,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 1,
    teamResponsiveness: 3,
    brandUnderstanding: 1,
    dataEffectiveness: 1,
    teamProactivity: 2,
    meetingBusinessGoals: 1,
    timestamp: '9/20/2025, 12:09:48 PM',
    comment: 'The deployment of teams from the beginning',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 1,
  },
  {
    phone: '919953895484',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '9/20/2025, 5:13:06 PM',
    comment: 'Na',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919158769633',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 2,
    timestamp: '9/21/2025, 1:46:17 PM',
    comment: 'Had a detailed discussion with the leaders',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 3,
  },
  {
    phone: '919953526233',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 5,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 5,
    timestamp: '9/21/2025, 1:56:08 PM',
    comment: 'The solutions team is brilliant!',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 5,
  },
  {
    phone: '919004082459',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '9/21/2025, 2:03:39 PM',
    comment: 'Creative strategy and execution can improve',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919513686095',
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
    timestamp: '9/21/2025, 2:17:35 PM',
    comment: 'Brand facing teams are definitely hands on',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 4,
  },
  {
    phone: '919892154181',
    overallSatisfaction: 2,
    likelihoodToRecommend: 1,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '9/21/2025, 2:25:41 PM',
    comment: 'We have raised our concerns at multiple levels.',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 2,
  },
  {
    phone: '919819413522',
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
    timestamp: '9/21/2025, 3:02:01 PM',
    comment: 'The team is putting in the best of efforts.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919930499792',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 2,
    timestamp: '9/21/2025, 3:35:39 PM',
    comment: 'The quality of output has room for improvement',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '918826512124',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '9/21/2025, 5:40:41 PM',
    comment: 'It\'s too new a team to judge',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919769808077',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 1,
    teamResponsiveness: 2,
    brandUnderstanding: 3,
    dataEffectiveness: 1,
    teamProactivity: 1,
    meetingBusinessGoals: 3,
    timestamp: '9/21/2025, 6:56:51 PM',
    comment: 'We face alot of issues when it comes to timelines',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '917889811148',
    overallSatisfaction: 2,
    likelihoodToRecommend: 1,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 1,
    teamResponsiveness: 2,
    brandUnderstanding: 2,
    dataEffectiveness: 0,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '9/22/2025, 12:10:06 PM',
    comment: 'Team hasn\'t been applying themselves',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 3,
  },
  {
    phone: '919886088181',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 2,
    teamResponsiveness: 5,
    brandUnderstanding: 2,
    dataEffectiveness: 4,
    teamProactivity: 5,
    meetingBusinessGoals: 2,
    timestamp: '9/22/2025, 12:25:27 PM',
    comment: 'we can do better.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 2,
  },
  {
    phone: '919920242841',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 4,
    timestamp: '9/22/2025, 1:29:23 PM',
    comment: 'Hope to so more meaningful creative work',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 2,
  },
  {
    phone: '918879689407',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '9/22/2025, 2:59:06 PM',
    comment: 'What I want is more ideation and innovation.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919319083208',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '9/22/2025, 3:10:37 PM',
    comment: 'Pretty good work so far',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 3,
  },
  {
    phone: '919663855927',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 4,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/22/2025, 5:19:42 PM',
    comment: 'Can do better',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919130098805',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '9/23/2025, 1:58:36 AM',
    comment: 'While the team is proactive at handling key tasks',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919987024742',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 0,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '9/23/2025, 6:54:06 AM',
    comment: '-',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919748099899',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/23/2025, 10:01:42 AM',
    comment: 'Need to get more innovative ideas.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '917838981707',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 4,
    timestamp: '9/23/2025, 11:00:25 AM',
    comment: 'Page launch is due for our brand',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919588616839',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/23/2025, 11:34:38 AM',
    comment: 'Na',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919818326107',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/23/2025, 11:45:24 AM',
    comment: 'NA',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 3,
  },
  {
    phone: '916360830441',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 3,
    meetingBusinessGoals: 4,
    timestamp: '9/23/2025, 12:53:01 PM',
    comment: 'It\'s been a good run so far!',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919831199072',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/23/2025, 2:08:57 PM',
    comment: 'More senior leadership involvement is needed',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919920379383',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 2,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '9/24/2025, 12:10:48 PM',
    comment: 'The team is very responsive',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919619771168',
    overallSatisfaction: 2,
    likelihoodToRecommend: 1,
    northStarMetrics: 0,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 2,
    teamResponsiveness: 2,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '9/24/2025, 12:30:52 PM',
    comment: 'Same as last survey',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919740455788',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 5,
    meetingBusinessGoals: 3,
    timestamp: '9/25/2025, 2:08:45 PM',
    comment: 'NA',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 4,
  },
];

/**
 * Cycle 3 Media CSAT Responses from CSV
 * Parsed from docs/Cycle3/CSAT DB Cycle 3 MEdia.csv
 */
const CYCLE3_MEDIA_RESPONSES = [
  {
    phone: '919833380003',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    strategyAlignment: 3,
    teamProactivity: 3,
    creativeRefreshment: 4,
    teamCollaboration: 4,
    optimizationEffectiveness: 3,
    timelyExecution: 3,
    teamTransparency: 4,
    feedbackResponse: 4,
    overallEffectiveness: 4,
    timestamp: '9/15/2025, 1:40:00 PM',
    comment:
      'Expect improvement in ROAS. Otherwise Satisfied with overall performance.',
  },
  {
    phone: '919974408808',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    strategyAlignment: 3,
    teamProactivity: 2,
    creativeRefreshment: 3,
    teamCollaboration: 3,
    optimizationEffectiveness: 3,
    timelyExecution: 4,
    teamTransparency: 4,
    feedbackResponse: 4,
    overallEffectiveness: 3,
    timestamp: '9/15/2025, 3:57:55 PM',
    comment: 'I have been finding mistakes in the active campaigns still',
  },
  {
    phone: '919820835273',
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
    timestamp: '9/16/2025, 11:13:45 AM',
    comment: 'Keep it up! Thanks',
  },
  {
    phone: '919819242252',
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
    timestamp: '9/16/2025, 11:14:53 AM',
    comment: 'NA',
  },
  {
    phone: '919870200545',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    strategyAlignment: 4,
    teamProactivity: 3,
    creativeRefreshment: 4,
    teamCollaboration: 4,
    optimizationEffectiveness: 4,
    timelyExecution: 4,
    teamTransparency: 4,
    feedbackResponse: 4,
    overallEffectiveness: 4,
    timestamp: '9/17/2025, 7:56:56 AM',
    comment: 'Overall good',
  },
  {
    phone: '919845108212',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    strategyAlignment: 4,
    teamProactivity: 4,
    creativeRefreshment: 2,
    teamCollaboration: 3,
    optimizationEffectiveness: 4,
    timelyExecution: 3,
    teamTransparency: 4,
    feedbackResponse: 3,
    overallEffectiveness: 3,
    timestamp: '9/17/2025, 2:20:50 PM',
    comment: 'Ok',
  },
  {
    phone: '919833779503',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    strategyAlignment: 3,
    teamProactivity: 3,
    creativeRefreshment: 3,
    teamCollaboration: 4,
    optimizationEffectiveness: 4,
    timelyExecution: 4,
    teamTransparency: 4,
    feedbackResponse: 5,
    overallEffectiveness: 3,
    timestamp: '9/18/2025, 7:28:54 AM',
    comment:
      'Media team is proactive to execute. Can improve on proactively coming to us.',
  },
  {
    phone: '919673047686',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    strategyAlignment: 3,
    teamProactivity: 1,
    creativeRefreshment: 3,
    teamCollaboration: 2,
    optimizationEffectiveness: 3,
    timelyExecution: 2,
    teamTransparency: 2,
    feedbackResponse: 3,
    overallEffectiveness: 3,
    timestamp: '9/18/2025, 3:13:33 PM',
    comment: 'Lack of accountability, requires continuous followups',
  },
  {
    phone: '919652387716',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    strategyAlignment: 4,
    teamProactivity: 3,
    creativeRefreshment: 4,
    teamCollaboration: 4,
    optimizationEffectiveness: 4,
    timelyExecution: 4,
    teamTransparency: 4,
    feedbackResponse: 3,
    overallEffectiveness: 4,
    timestamp: '9/20/2025, 8:18:56 AM',
    comment: 'Looking forward to more conversions',
  },
  {
    phone: '919987024742',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    strategyAlignment: 4,
    teamProactivity: 4,
    creativeRefreshment: 3,
    teamCollaboration: 4,
    optimizationEffectiveness: 4,
    timelyExecution: 5,
    teamTransparency: 4,
    feedbackResponse: 4,
    overallEffectiveness: 4,
    timestamp: '9/23/2025, 6:55:19 AM',
    comment: '-',
  },
  {
    phone: '919004595090',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    strategyAlignment: 3,
    teamProactivity: 3,
    creativeRefreshment: 3,
    teamCollaboration: 4,
    optimizationEffectiveness: 3,
    timelyExecution: 3,
    teamTransparency: 4,
    feedbackResponse: 3,
    overallEffectiveness: 3,
    timestamp: '9/24/2025, 10:44:42 AM',
    comment:
      'Team needs to work together with us to drive the overall efficiency',
  },
  {
    phone: '919971316899',
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
    timestamp: '9/25/2025, 12:56:54 PM',
    comment: 'This seems to be going well.',
  },
];

/**
 * Cycle 3 Tech CSAT Responses from CSV
 * Parsed from docs/Cycle3/CSAT DB Cycle 3 Completed Tech.csv
 */
const CYCLE3_TECH_RESPONSES = [
  {
    phone: '919845108212',
    uiuxSatisfaction: 4,
    timelyExecution: 2,
    technicalSupport: 3,
    teamTransparency: 4,
    teamCollaboration: 4,
    feedbackResponse: 3,
    overallSatisfaction: 3,
    businessAlignment: 4,
    overallEffectiveness: 3,
    teamProactivity: 3,
    systemIntegration: 3,
    likelihoodToRecommend: 3,
    timestamp: '9/17/2025, 2:20:12 PM',
    comment: 'Ok',
  },
  {
    phone: '919930036101',
    uiuxSatisfaction: 3,
    timelyExecution: 3,
    technicalSupport: 3,
    teamTransparency: 4,
    teamCollaboration: 3,
    feedbackResponse: 4,
    overallSatisfaction: 4,
    businessAlignment: 3,
    overallEffectiveness: 4,
    teamProactivity: 4,
    systemIntegration: 4,
    likelihoodToRecommend: 4,
    timestamp: '9/18/2025, 12:37:05 PM',
    comment: 'Need more award winning ideas',
  },
  {
    phone: '917208232369',
    uiuxSatisfaction: 5,
    timelyExecution: 5,
    technicalSupport: 5,
    teamTransparency: 5,
    teamCollaboration: 5,
    feedbackResponse: 5,
    overallSatisfaction: 5,
    businessAlignment: 5,
    overallEffectiveness: 5,
    teamProactivity: 5,
    systemIntegration: 5,
    likelihoodToRecommend: 5,
    timestamp: '9/25/2025, 12:44:07 PM',
    comment: 'Good',
  },
  {
    phone: '919971316899',
    uiuxSatisfaction: 4,
    timelyExecution: 3,
    technicalSupport: 4,
    teamTransparency: 4,
    teamCollaboration: 4,
    feedbackResponse: 3,
    overallSatisfaction: 4,
    businessAlignment: 4,
    overallEffectiveness: 4,
    teamProactivity: 4,
    systemIntegration: 4,
    likelihoodToRecommend: 4,
    timestamp: '9/25/2025, 12:56:09 PM',
    comment: 'Feedback implementation and timelines improvement is required',
  },
  {
    phone: '919999513285',
    uiuxSatisfaction: 3,
    timelyExecution: 3,
    technicalSupport: 3,
    teamTransparency: 3,
    teamCollaboration: 3,
    feedbackResponse: 3,
    overallSatisfaction: 3,
    businessAlignment: 3,
    overallEffectiveness: 3,
    teamProactivity: 2,
    systemIntegration: 3,
    likelihoodToRecommend: 3,
    timestamp: '9/25/2025, 1:30:47 PM',
    comment: 'Good work',
  },
  {
    phone: '919930577107',
    uiuxSatisfaction: 2,
    timelyExecution: 3,
    technicalSupport: 3,
    teamTransparency: 3,
    teamCollaboration: 3,
    feedbackResponse: 3,
    overallSatisfaction: 3,
    businessAlignment: 2,
    overallEffectiveness: 3,
    teamProactivity: 3,
    systemIntegration: 2,
    likelihoodToRecommend: 2,
    timestamp: '9/25/2025, 4:26:33 PM',
    comment: 'Need proactive approach and execution',
  },
  {
    phone: '919987512824',
    uiuxSatisfaction: 0,
    timelyExecution: 4,
    technicalSupport: 0,
    teamTransparency: 4,
    teamCollaboration: 5,
    feedbackResponse: 4,
    overallSatisfaction: 4,
    businessAlignment: 3,
    overallEffectiveness: 4,
    teamProactivity: 3,
    systemIntegration: 0,
    likelihoodToRecommend: 4,
    timestamp: '9/26/2025, 7:33:20 AM',
    comment: '..',
  },
  {
    phone: '918012047626',
    uiuxSatisfaction: 5,
    timelyExecution: 5,
    technicalSupport: 5,
    teamTransparency: 5,
    teamCollaboration: 5,
    feedbackResponse: 5,
    overallSatisfaction: 5,
    businessAlignment: 4,
    overallEffectiveness: 5,
    teamProactivity: 5,
    systemIntegration: 5,
    likelihoodToRecommend: 5,
    timestamp: '9/26/2025, 8:41:21 AM',
    comment: 'Team is extremely supportive',
  },
];

/**
 * Cycle 3 SEO CSAT Responses from CSV
 * Parsed from docs/Cycle3/CSAT DB Cycle 3 SEO.csv
 */
const CYCLE3_SEO_RESPONSES = [
  {
    phone: '917060199291',
    transparency: 3,
    timelyDelivery: 0,
    overallEffectiveness: 2,
    feedbackResponse: 3,
    businessImpact: 3,
    teamProactivity: 1,
    strategyAlignment: 2,
    seoImpact: 2,
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    contentQuality: 3,
    timestamp: '9/15/2025, 1:43:59 PM',
    comment: '.',
  },
  {
    phone: '919819242252',
    transparency: 5,
    timelyDelivery: 5,
    overallEffectiveness: 5,
    feedbackResponse: 5,
    businessImpact: 5,
    teamProactivity: 5,
    strategyAlignment: 5,
    seoImpact: 5,
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    contentQuality: 5,
    timestamp: '9/16/2025, 11:14:15 AM',
    comment: 'NA',
  },
  {
    phone: '919891433015',
    transparency: 3,
    timelyDelivery: 2,
    overallEffectiveness: 2,
    feedbackResponse: 3,
    businessImpact: 2,
    teamProactivity: 0,
    strategyAlignment: 2,
    seoImpact: 0,
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    contentQuality: 2,
    timestamp: '9/17/2025, 1:01:44 PM',
    comment:
      'While we do not work on seo, but the content approach needs to be aligned with our business objectives.',
  },
  {
    phone: '919845108212',
    transparency: 4,
    timelyDelivery: 3,
    overallEffectiveness: 4,
    feedbackResponse: 4,
    businessImpact: 4,
    teamProactivity: 3,
    strategyAlignment: 4,
    seoImpact: 4,
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    contentQuality: 3,
    timestamp: '9/17/2025, 2:19:30 PM',
    comment: 'Good n happy',
  },
  {
    phone: '918591481423',
    transparency: 4,
    timelyDelivery: 4,
    overallEffectiveness: 4,
    feedbackResponse: 4,
    businessImpact: 3,
    teamProactivity: 5,
    strategyAlignment: 4,
    seoImpact: 3,
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    contentQuality: 4,
    timestamp: '9/20/2025, 8:31:23 AM',
    comment:
      'Working with the team on our Emailers/Blogs/WhatsApp has been quite smooth.',
  },
  {
    phone: '918898420058',
    transparency: 3,
    timelyDelivery: 1,
    overallEffectiveness: 4,
    feedbackResponse: 4,
    businessImpact: 5,
    teamProactivity: 3,
    strategyAlignment: 4,
    seoImpact: 4,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    contentQuality: 2,
    timestamp: '9/24/2025, 12:11:49 PM',
    comment: 'NA',
  },
  {
    phone: '919971316899',
    transparency: 4,
    timelyDelivery: 3,
    overallEffectiveness: 3,
    feedbackResponse: 4,
    businessImpact: 3,
    teamProactivity: 4,
    strategyAlignment: 4,
    seoImpact: 4,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    contentQuality: 4,
    timestamp: '9/25/2025, 12:55:07 PM',
    comment:
      'With changes coming to SEO industry, would like to see team working proactively to adapt.',
  },
  {
    phone: '919930577107',
    transparency: 3,
    timelyDelivery: 3,
    overallEffectiveness: 3,
    feedbackResponse: 3,
    businessImpact: 2,
    teamProactivity: 2,
    strategyAlignment: 3,
    seoImpact: 2,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    contentQuality: 3,
    timestamp: '9/25/2025, 4:24:26 PM',
    comment: 'Need better accountable partners to drive our business goals.',
  },
  {
    phone: '918012047626',
    transparency: 5,
    timelyDelivery: 5,
    overallEffectiveness: 4,
    feedbackResponse: 5,
    businessImpact: 3,
    teamProactivity: 5,
    strategyAlignment: 4,
    seoImpact: 4,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    contentQuality: 5,
    timestamp: '9/26/2025, 8:31:36 AM',
    comment: 'Brilliant execution and support from the team',
  },
];

/**
 * Cycle 3 MarTech CSAT Responses from CSV
 * Parsed from docs/Cycle3/CSAT DB Cycle 3 Completed Mart-Tech.csv
 */
const CYCLE3_MARTECH_RESPONSES = [
  {
    phone: '919930036101',
    trainingHandover: 3,
    responsiveness: 4,
    roi: 4,
    overallEffectiveness: 4,
    integration: 3,
    dataAccuracy: 3,
    teamProactivity: 3,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    innovation: 4,
    implementationQuality: 3,
    goalAlignment: 3,
    timestamp: '9/18/2025, 12:36:15 PM',
    comment: 'Need proactive ideas for performance marketing',
  },
  {
    phone: '919711834224',
    trainingHandover: 3,
    responsiveness: 4,
    roi: 4,
    overallEffectiveness: 4,
    integration: 3,
    dataAccuracy: 5,
    teamProactivity: 4,
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    innovation: 4,
    implementationQuality: 5,
    goalAlignment: 4,
    timestamp: '9/18/2025, 1:13:11 PM',
    comment: '.',
  },
  {
    phone: '919136569305',
    trainingHandover: 3,
    responsiveness: 3,
    roi: 3,
    overallEffectiveness: 3,
    integration: 3,
    dataAccuracy: 3,
    teamProactivity: 3,
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    innovation: 3,
    implementationQuality: 3,
    goalAlignment: 3,
    timestamp: '9/18/2025, 4:36:09 PM',
    comment: 'Nome',
  },
  {
    phone: '918591481423',
    trainingHandover: 3,
    responsiveness: 3,
    roi: 3,
    overallEffectiveness: 3,
    integration: 3,
    dataAccuracy: 3,
    teamProactivity: 3,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    innovation: 3,
    implementationQuality: 3,
    goalAlignment: 3,
    timestamp: '9/20/2025, 8:32:42 AM',
    comment: 'Average rating as this function at the moment is not utilised',
  },
  {
    phone: '918356094977',
    trainingHandover: 4,
    responsiveness: 4,
    roi: 4,
    overallEffectiveness: 4,
    integration: 4,
    dataAccuracy: 4,
    teamProactivity: 4,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    innovation: 4,
    implementationQuality: 4,
    goalAlignment: 4,
    timestamp: '9/21/2025, 1:44:31 PM',
    comment: 'Great job guys!',
  },
  {
    phone: '919953526233',
    trainingHandover: 2,
    responsiveness: 2,
    roi: 2,
    overallEffectiveness: 2,
    integration: 2,
    dataAccuracy: 2,
    teamProactivity: 1,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    innovation: 2,
    implementationQuality: 3,
    goalAlignment: 3,
    timestamp: '9/21/2025, 1:57:48 PM',
    comment: 'Extremely weak team that lacks effectiveness and proactiveness',
  },
  {
    phone: '917208232369',
    trainingHandover: 5,
    responsiveness: 5,
    roi: 5,
    overallEffectiveness: 5,
    integration: 5,
    dataAccuracy: 5,
    teamProactivity: 5,
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    innovation: 5,
    implementationQuality: 5,
    goalAlignment: 5,
    timestamp: '9/25/2025, 12:44:29 PM',
    comment: 'Good',
  },
  {
    phone: '919987512824',
    trainingHandover: 0,
    responsiveness: 0,
    roi: 0,
    overallEffectiveness: 4,
    integration: 0,
    dataAccuracy: 0,
    teamProactivity: 4,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    innovation: 2,
    implementationQuality: 0,
    goalAlignment: 4,
    timestamp: '9/26/2025, 7:34:16 AM',
    comment: 'L..',
  },
];

/**
 * Cycle 3 SMP CSAT Responses from CSV
 * Parsed from docs/Cycle3/CSAT DB Cycle 3 SMPcsv
 */
const CYCLE3_SMP_RESPONSES = [
  {
    phone: '919920816185',
    workAgainLikelihood: 1,
    timelineDelivery: 3,
    recommendationLikelihood: 1,
    productionExperience: 1,
    postProductionProcess: 1,
    ppmQuality: 2,
    finalAssetQuality: 2,
    budgetValue: 2,
    teamShoutout: '',
    productionType: 'a',
    feedbackResponsiveness: 3,
    communicationRating: 3,
    briefUnderstanding: 2,
    timestamp: '9/15/2025, 1:33:17 PM',
    overallSatisfaction: 1,
    comment:
      'I know what SMP is capable of, but the team looking into this project was inexperienced.',
  },
  {
    phone: '919601986101',
    workAgainLikelihood: 5,
    timelineDelivery: 5,
    recommendationLikelihood: 5,
    productionExperience: 5,
    postProductionProcess: 5,
    ppmQuality: 5,
    finalAssetQuality: 5,
    budgetValue: 5,
    teamShoutout:
      'Batul, Mohmaad, Vaibhav, Aman, Ahaana, Isha, Kashyap, Sanket',
    productionType: 'a',
    feedbackResponsiveness: 5,
    communicationRating: 5,
    briefUnderstanding: 5,
    timestamp: '9/15/2025, 1:33:45 PM',
    overallSatisfaction: 5,
    comment: 'Great experience',
  },
  {
    phone: '919819808468',
    workAgainLikelihood: 3,
    timelineDelivery: 3,
    recommendationLikelihood: 3,
    productionExperience: 2,
    postProductionProcess: 2,
    ppmQuality: 3,
    finalAssetQuality: 3,
    budgetValue: 4,
    teamShoutout: '',
    productionType: 'a',
    feedbackResponsiveness: 4,
    communicationRating: 2,
    briefUnderstanding: 2,
    timestamp: '9/16/2025, 11:14:00 AM',
    overallSatisfaction: 3,
    comment: 'None',
  },
  {
    phone: '919920321398',
    workAgainLikelihood: 3,
    timelineDelivery: 3,
    recommendationLikelihood: 3,
    productionExperience: 4,
    postProductionProcess: 4,
    ppmQuality: 3,
    finalAssetQuality: 2,
    budgetValue: 3,
    teamShoutout: '',
    productionType: 'a',
    feedbackResponsiveness: 4,
    communicationRating: 4,
    briefUnderstanding: 4,
    timestamp: '9/21/2025, 1:45:46 PM',
    overallSatisfaction: 3,
    comment: 'Poor understanding of the beauty category.',
  },
  {
    phone: '919910372045',
    workAgainLikelihood: 3,
    timelineDelivery: 3,
    recommendationLikelihood: 2,
    productionExperience: 2,
    postProductionProcess: 2,
    ppmQuality: 3,
    finalAssetQuality: 3,
    budgetValue: 3,
    teamShoutout: '',
    productionType: 'c',
    feedbackResponsiveness: 4,
    communicationRating: 3,
    briefUnderstanding: 4,
    timestamp: '9/21/2025, 1:50:33 PM',
    overallSatisfaction: 3,
    comment: 'Na',
  },
  {
    phone: '918196818634',
    workAgainLikelihood: 4,
    timelineDelivery: 4,
    recommendationLikelihood: 4,
    productionExperience: 4,
    postProductionProcess: 4,
    ppmQuality: 4,
    finalAssetQuality: 4,
    budgetValue: 4,
    teamShoutout: 'Valentina, Pranav, Hamad and Jai',
    productionType: 'a',
    feedbackResponsiveness: 4,
    communicationRating: 4,
    briefUnderstanding: 5,
    timestamp: '9/26/2025, 12:02:10 PM',
    overallSatisfaction: 4,
    comment:
      'The expectation for turn around time is higher. The quality of assets delivered are good.',
  },
];

/**
 * Cycle 3 Fluence CSAT Responses from CSV
 * Parsed from docs/Cycle3/CSAT DB Cycle 3 Completed Fluence.csv
 */
const CYCLE3_FLUENCE_RESPONSES = [
  {
    phone: '919825085451',
    timelineAdherence: 5,
    responsiveness: 5,
    reportingQuality: 5,
    roi: 4,
    outcomeEffectiveness: 5,
    communication: 5,
    teamProactivity: 5,
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    creatorFit: 4,
    campaignExecution: 4,
    briefUnderstanding: 4,
    timestamp: '9/15/2025, 1:46:52 PM',
    comment:
      'Katha Jain has done an outstand job with practically every single campaign we have done.',
  },
  {
    phone: '917718815765',
    timelineAdherence: 4,
    responsiveness: 4,
    reportingQuality: 2,
    roi: 3,
    outcomeEffectiveness: 4,
    communication: 5,
    teamProactivity: 3,
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    creatorFit: 5,
    campaignExecution: 4,
    briefUnderstanding: 5,
    timestamp: '9/15/2025, 2:25:02 PM',
    comment: 'Did influencer campaign for onam overall good',
  },
  {
    phone: '919974408808',
    timelineAdherence: 3,
    responsiveness: 4,
    reportingQuality: 2,
    roi: 3,
    outcomeEffectiveness: 3,
    communication: 4,
    teamProactivity: 3,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    creatorFit: 4,
    campaignExecution: 4,
    briefUnderstanding: 4,
    timestamp: '9/15/2025, 2:57:22 PM',
    comment:
      'We never got any influencer dedicated report and i suggest we should keep all three departments kpi focused only',
  },
  {
    phone: '919873747230',
    timelineAdherence: 3,
    responsiveness: 2,
    reportingQuality: 2,
    roi: 3,
    outcomeEffectiveness: 3,
    communication: 3,
    teamProactivity: 2,
    overallSatisfaction: 1,
    likelihoodToRecommend: 1,
    creatorFit: 3,
    campaignExecution: 3,
    briefUnderstanding: 3,
    timestamp: '9/16/2025, 4:30:31 AM',
    comment:
      'Long way to go!! Need lot of improvement in influencer management piece.',
  },
  {
    phone: '919920697652',
    timelineAdherence: 4,
    responsiveness: 4,
    reportingQuality: 4,
    roi: 3,
    outcomeEffectiveness: 4,
    communication: 4,
    teamProactivity: 4,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    creatorFit: 3,
    campaignExecution: 4,
    briefUnderstanding: 4,
    timestamp: '9/17/2025, 6:26:48 AM',
    comment:
      'Good work, special kudos to Tanmay More, Sakshi Gupta and Rudrangshu Tripathy for good performance.',
  },
  {
    phone: '919891433015',
    timelineAdherence: 3,
    responsiveness: 3,
    reportingQuality: 1,
    roi: 2,
    outcomeEffectiveness: 3,
    communication: 3,
    teamProactivity: 1,
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    creatorFit: 3,
    campaignExecution: 2,
    briefUnderstanding: 2,
    timestamp: '9/17/2025, 1:03:28 PM',
    comment:
      'No ROI tracking done by fluence team. Big challenges in execution.',
  },
  {
    phone: '919513686095',
    timelineAdherence: 2,
    responsiveness: 3,
    reportingQuality: 3,
    roi: 2,
    outcomeEffectiveness: 3,
    communication: 3,
    teamProactivity: 3,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    creatorFit: 3,
    campaignExecution: 2,
    briefUnderstanding: 3,
    timestamp: '9/21/2025, 2:35:23 PM',
    comment:
      'Overall, the experience wasn\'t very great. The quality of influencers and content was concerning.',
  },
];

// Helper functions
const normalizePhone = phone => {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('91') && normalized.length > 10) {
    normalized = normalized.substring(2);
  }
  return normalized;
};

const parseTimestamp = timestamp => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return new Date();
    return date;
  } catch {
    return new Date();
  }
};

async function getOrCreateCycle3() {
  let cycle = await Cycle.findOne({ cycleNumber: 3, year: 2025 });
  if (!cycle) {
    cycle = await Cycle.create({
      name: 'Cycle 3',
      cycleNumber: 3,
      year: 2025,
      startDate: new Date(2025, 5, 1),
      endDate: new Date(2025, 7, 31, 23, 59, 59, 999),
      status: 'completed',
      isActive: false,
    });
    console.log('  ✓ Created Cycle 3 (2025)');
  } else {
    console.log('  ✓ Found existing Cycle 3 (2025)');
  }
  return cycle;
}

async function findClientFromHistory(phone, cycleId) {
  const normalizedPhone = normalizePhone(phone);
  const clientHistory = await ClientHistory.findOne({
    cycleId,
    $or: [
      { phone },
      { phone: normalizedPhone },
      { phone: { $regex: new RegExp(normalizedPhone + '$') } },
    ],
  })
    .populate('clientId')
    .populate('brandId');

  if (clientHistory) {
    const brandHistory = await BrandHistory.findOne({
      brandId: clientHistory.brandId._id,
      cycleId,
    });
    return {
      clientId: clientHistory.clientId._id,
      brandId: clientHistory.brandId._id,
      clientHistoryId: clientHistory._id,
      brandHistoryId: brandHistory?._id || null,
      clientName: clientHistory.name,
      brandName: clientHistory.brandId?.name,
    };
  }

  const client = await Client.findOne({
    $or: [
      { phone },
      { phone: normalizedPhone },
      { phone: { $regex: new RegExp(normalizedPhone + '$') } },
    ],
  }).populate('brandId');

  if (client) {
    const clientHist = await ClientHistory.findOne({
      clientId: client._id,
      cycleId,
    });
    const brandHist = await BrandHistory.findOne({
      brandId: client.brandId?._id || client.brandId,
      cycleId,
    });
    return {
      clientId: client._id,
      brandId: client.brandId?._id || client.brandId,
      clientHistoryId: clientHist?._id || null,
      brandHistoryId: brandHist?._id || null,
      clientName: client.name,
      brandName: client.brandId?.name || null,
    };
  }
  return null;
}

async function clearCycle3Responses(cycleId) {
  console.log('\n🗑️  Clearing existing Cycle 3 CSAT responses...');
  const result = await CSATResponse.deleteMany({ cycleId });
  console.log(
    `  ✓ Deleted ${result.deletedCount} existing responses for Cycle 3`
  );
  return result.deletedCount;
}

/**
 * Find SBU from SBUHistory for a brand in Cycle 3
 * KEY: Uses SBUHistory instead of SBU for historical accuracy
 * IMPROVED: Filters by departmentId to ensure correct department-specific SBU lookup
 * RETURNS: Both sbuId and sbuHistoryId for complete tracking
 */
async function findSBUFromHistory(brandId, cycleId, departmentId) {
  // Get the brand name and department info for logging
  const brand = await Brand.findById(brandId);
  const brandName = brand?.name || '';
  const department = await Department.findById(departmentId);
  const deptName = department?.name || '';

  // Method 1: Check SBUHistory.brands array - find SBU that has this brand for THIS DEPARTMENT
  const sbuHistoryWithBrand = await SBUHistory.findOne({
    cycleId,
    departmentId, // Filter by department
    brands: brandId,
  });

  if (sbuHistoryWithBrand) {
    return {
      sbuId: sbuHistoryWithBrand.sbuId,
      sbuHistoryId: sbuHistoryWithBrand._id,
    };
  }

  // Method 2: Check BrandHistory for service mapping with sbuId for this department
  const brandHistory = await BrandHistory.findOne({
    brandId,
    cycleId,
  });

  if (brandHistory && brandHistory.services) {
    const deptService = brandHistory.services.find(
      s => s.department === deptName && s.sbuId
    );

    if (deptService && deptService.sbuId) {
      // Find the corresponding SBUHistory
      const sbuHist = await SBUHistory.findOne({
        sbuId: deptService.sbuId,
        cycleId,
        departmentId,
      });

      return {
        sbuId: deptService.sbuId,
        sbuHistoryId: sbuHist?._id || null,
      };
    }
  }

  // Method 3: Check current SBU model brands array for this department
  const sbuWithBrand = await SBU.findOne({
    departmentId, // Filter by department
    brands: brandId,
    isActive: true,
  });

  if (sbuWithBrand) {
    // Find the corresponding SBUHistory
    const sbuHist = await SBUHistory.findOne({
      sbuId: sbuWithBrand._id,
      cycleId,
      departmentId,
    });

    return {
      sbuId: sbuWithBrand._id,
      sbuHistoryId: sbuHist?._id || null,
    };
  }

  // Method 4: Fuzzy match - find SBU in THIS DEPARTMENT where brand name matches
  if (brandName) {
    const normalizedBrandName = brandName.toLowerCase().trim();

    // Get all SBU Histories for this cycle AND department
    const allSbuHistories = await SBUHistory.find({
      cycleId,
      departmentId, // Filter by department
    }).populate('sbuId');

    for (const sbuHistory of allSbuHistories) {
      if (sbuHistory.brands && sbuHistory.brands.length > 0) {
        // Get brand names for these IDs
        const sbuBrands = await Brand.find({
          _id: { $in: sbuHistory.brands },
        });

        // Check if any brand name matches
        const hasMatch = sbuBrands.some(b => {
          const sbuBrandName = b.name.toLowerCase().trim();
          return (
            sbuBrandName === normalizedBrandName ||
            sbuBrandName.includes(normalizedBrandName) ||
            normalizedBrandName.includes(sbuBrandName)
          );
        });

        if (hasMatch) {
          return {
            sbuId: sbuHistory.sbuId,
            sbuHistoryId: sbuHistory._id,
          };
        }
      }
    }
  }

  // Method 5: Return null - no SBU found for this brand in this department
  return { sbuId: null, sbuHistoryId: null };
}

async function seedSolutionsResponses(cycle, solutionsDept) {
  console.log(
    '\n📊 Seeding Solutions Department CSAT Responses for Cycle 3...'
  );
  let created = 0,
    skipped = 0;

  for (const response of CYCLE3_SOLUTIONS_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);
      if (!clientData) {
        console.log(`  ⚠ Client not found: ${response.phone}`);
        skipped++;
        continue;
      }

      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        solutionsDept._id
      );

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
          overallSatisfaction: response.overallSatisfaction,
          likelihoodToRecommend: response.likelihoodToRecommend,
          northStarMetrics: response.northStarMetrics,
          seniorLeadershipInvolvement: response.seniorLeadershipInvolvement,
          strategyExecution: response.strategyExecution,
          teamResponsiveness: response.teamResponsiveness,
          brandUnderstanding: response.brandUnderstanding,
        },
        deliveryMetrics: {
          dataEffectiveness: response.dataEffectiveness,
          teamProactivity: response.teamProactivity,
          meetingBusinessGoals: response.meetingBusinessGoals,
        },
        qualityEvaluation: {
          qualityOfDesignVideo: response.qualityOfDesignVideo,
          qualityOfIdeas: response.qualityOfIdeas,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp),
      };

      const existingResponse = await CSATResponse.findOne({
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: solutionsDept._id,
      });
      if (existingResponse) {
        console.log(
          `  ○ Already exists: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      await CSATResponse.create({
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: solutionsDept._id,
        sbuId: sbuData.sbuId,
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(`  ✗ Failed: ${response.phone}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n✅ Solutions: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for Media Department - Cycle 3
 */
async function seedMediaResponses(cycle, mediaDept) {
  console.log('\n📊 Seeding Media Department CSAT Responses for Cycle 3...');
  let created = 0,
    skipped = 0;

  for (const response of CYCLE3_MEDIA_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);
      if (!clientData) {
        console.log(`  ⚠ Client not found: ${response.phone}`);
        skipped++;
        continue;
      }

      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        mediaDept._id
      );

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
          overallSatisfaction: response.overallSatisfaction,
          likelihoodToRecommend: response.likelihoodToRecommend,
          strategyAlignment: response.strategyAlignment,
          teamProactivity: response.teamProactivity,
          creativeRefreshment: response.creativeRefreshment,
          teamCollaboration: response.teamCollaboration,
        },
        deliveryMetrics: {
          optimizationEffectiveness: response.optimizationEffectiveness,
          timelyExecution: response.timelyExecution,
          teamTransparency: response.teamTransparency,
          feedbackResponse: response.feedbackResponse,
          overallEffectiveness: response.overallEffectiveness,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp),
      };

      const existingResponse = await CSATResponse.findOne({
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: mediaDept._id,
      });
      if (existingResponse) {
        console.log(
          `  ○ Already exists: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      await CSATResponse.create({
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: mediaDept._id,
        sbuId: sbuData.sbuId,
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(`  ✗ Failed: ${response.phone}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n✅ Media: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for Tech Department - Cycle 3
 */
async function seedTechResponses(cycle, techDept) {
  console.log('\n📊 Seeding Tech Department CSAT Responses for Cycle 3...');
  let created = 0,
    skipped = 0;

  for (const response of CYCLE3_TECH_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);
      if (!clientData) {
        console.log(`  ⚠ Client not found: ${response.phone}`);
        skipped++;
        continue;
      }

      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        techDept._id
      );

      const csatData = {
        servicesCovered: {
          solutions: false,
          media: false,
          tech: true,
          seo: false,
          martech: false,
          fluence: false,
          smp: false,
        },
        coreMetrics: {
          overallSatisfaction: response.overallSatisfaction,
          likelihoodToRecommend: response.likelihoodToRecommend,
          uiuxSatisfaction: response.uiuxSatisfaction,
          timelyExecution: response.timelyExecution,
          technicalSupport: response.technicalSupport,
          teamTransparency: response.teamTransparency,
          teamCollaboration: response.teamCollaboration,
        },
        deliveryMetrics: {
          feedbackResponse: response.feedbackResponse,
          businessAlignment: response.businessAlignment,
          overallEffectiveness: response.overallEffectiveness,
          teamProactivity: response.teamProactivity,
          systemIntegration: response.systemIntegration,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp),
      };

      const existingResponse = await CSATResponse.findOne({
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: techDept._id,
      });
      if (existingResponse) {
        console.log(
          `  ○ Already exists: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      await CSATResponse.create({
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: techDept._id,
        sbuId: sbuData.sbuId,
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(`  ✗ Failed: ${response.phone}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n✅ Tech: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for SEO Department - Cycle 3
 */
async function seedSeoResponses(cycle, seoDept) {
  console.log('\n📊 Seeding SEO Department CSAT Responses for Cycle 3...');
  let created = 0,
    skipped = 0;

  for (const response of CYCLE3_SEO_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);
      if (!clientData) {
        console.log(`  ⚠ Client not found: ${response.phone}`);
        skipped++;
        continue;
      }

      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        seoDept._id
      );

      const csatData = {
        servicesCovered: {
          solutions: false,
          media: false,
          tech: false,
          seo: true,
          martech: false,
          fluence: false,
          smp: false,
        },
        coreMetrics: {
          overallSatisfaction: response.overallSatisfaction,
          likelihoodToRecommend: response.likelihoodToRecommend,
          transparency: response.transparency,
          timelyDelivery: response.timelyDelivery,
          overallEffectiveness: response.overallEffectiveness,
          feedbackResponse: response.feedbackResponse,
          businessImpact: response.businessImpact,
        },
        deliveryMetrics: {
          teamProactivity: response.teamProactivity,
          strategyAlignment: response.strategyAlignment,
          seoImpact: response.seoImpact,
          contentQuality: response.contentQuality,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp),
      };

      const existingResponse = await CSATResponse.findOne({
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: seoDept._id,
      });
      if (existingResponse) {
        console.log(
          `  ○ Already exists: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      await CSATResponse.create({
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: seoDept._id,
        sbuId: sbuData.sbuId,
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(`  ✗ Failed: ${response.phone}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n✅ SEO: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for MarTech Department - Cycle 3
 */
async function seedMartechResponses(cycle, martechDept) {
  console.log('\n📊 Seeding MarTech Department CSAT Responses for Cycle 3...');
  let created = 0,
    skipped = 0;

  for (const response of CYCLE3_MARTECH_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);
      if (!clientData) {
        console.log(`  ⚠ Client not found: ${response.phone}`);
        skipped++;
        continue;
      }

      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        martechDept._id
      );

      const csatData = {
        servicesCovered: {
          solutions: false,
          media: false,
          tech: false,
          seo: false,
          martech: true,
          fluence: false,
          smp: false,
        },
        coreMetrics: {
          overallSatisfaction: response.overallSatisfaction,
          likelihoodToRecommend: response.likelihoodToRecommend,
          responsiveness: response.responsiveness,
          innovation: response.innovation,
          goalAlignment: response.goalAlignment,
        },
        deliveryMetrics: {
          trainingHandover: response.trainingHandover,
          roi: response.roi,
          overallEffectiveness: response.overallEffectiveness,
          integration: response.integration,
          dataAccuracy: response.dataAccuracy,
          teamProactivity: response.teamProactivity,
          implementationQuality: response.implementationQuality,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp),
      };

      const existingResponse = await CSATResponse.findOne({
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: martechDept._id,
      });
      if (existingResponse) {
        console.log(
          `  ○ Already exists: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      await CSATResponse.create({
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: martechDept._id,
        sbuId: sbuData.sbuId,
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(`  ✗ Failed: ${response.phone}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n✅ MarTech: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for SMP Department - Cycle 3
 */
async function seedSmpResponses(cycle, smpDept) {
  console.log('\n📊 Seeding SMP Department CSAT Responses for Cycle 3...');
  let created = 0,
    skipped = 0;

  for (const response of CYCLE3_SMP_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);
      if (!clientData) {
        console.log(`  ⚠ Client not found: ${response.phone}`);
        skipped++;
        continue;
      }

      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        smpDept._id
      );

      const csatData = {
        servicesCovered: {
          solutions: false,
          media: false,
          tech: false,
          seo: false,
          martech: false,
          fluence: false,
          smp: true,
        },
        coreMetrics: {
          overallSatisfaction: response.overallSatisfaction,
          workAgainLikelihood: response.workAgainLikelihood,
          recommendationLikelihood: response.recommendationLikelihood,
          communicationRating: response.communicationRating,
          briefUnderstanding: response.briefUnderstanding,
        },
        deliveryMetrics: {
          timelineDelivery: response.timelineDelivery,
          productionExperience: response.productionExperience,
          postProductionProcess: response.postProductionProcess,
          ppmQuality: response.ppmQuality,
          finalAssetQuality: response.finalAssetQuality,
          budgetValue: response.budgetValue,
          feedbackResponsiveness: response.feedbackResponsiveness,
        },
        productionDetails: {
          productionType: response.productionType,
          teamShoutout: response.teamShoutout,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp),
      };

      const existingResponse = await CSATResponse.findOne({
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: smpDept._id,
      });
      if (existingResponse) {
        console.log(
          `  ○ Already exists: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      await CSATResponse.create({
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: smpDept._id,
        sbuId: sbuData.sbuId,
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(`  ✗ Failed: ${response.phone}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n✅ SMP: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for Fluence Department - Cycle 3
 */
async function seedFluenceResponses(cycle, fluenceDept) {
  console.log('\n📊 Seeding Fluence Department CSAT Responses for Cycle 3...');
  let created = 0,
    skipped = 0;

  for (const response of CYCLE3_FLUENCE_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);
      if (!clientData) {
        console.log(`  ⚠ Client not found: ${response.phone}`);
        skipped++;
        continue;
      }

      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        fluenceDept._id
      );

      const csatData = {
        servicesCovered: {
          solutions: false,
          media: false,
          tech: false,
          seo: false,
          martech: false,
          fluence: true,
          smp: false,
        },
        coreMetrics: {
          overallSatisfaction: response.overallSatisfaction,
          likelihoodToRecommend: response.likelihoodToRecommend,
          timelineAdherence: response.timelineAdherence,
          responsiveness: response.responsiveness,
          communication: response.communication,
          briefUnderstanding: response.briefUnderstanding,
        },
        deliveryMetrics: {
          reportingQuality: response.reportingQuality,
          roi: response.roi,
          outcomeEffectiveness: response.outcomeEffectiveness,
          teamProactivity: response.teamProactivity,
          creatorFit: response.creatorFit,
          campaignExecution: response.campaignExecution,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp),
      };

      const existingResponse = await CSATResponse.findOne({
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: fluenceDept._id,
      });
      if (existingResponse) {
        console.log(
          `  ○ Already exists: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      await CSATResponse.create({
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: fluenceDept._id,
        sbuId: sbuData.sbuId,
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(`  ✗ Failed: ${response.phone}:`, error.message);
      skipped++;
    }
  }

  console.log(`\n✅ Fluence: ${created} created, ${skipped} skipped`);
  return created;
}

async function seed() {
  console.log(
    '🌱 Starting Cycle 3 CSAT Response Seeding (All 7 Departments)...\n'
  );
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📅 Setting up Cycle 3...');
    const cycle = await getOrCreateCycle3();

    // Get all departments
    const solutionsDept = await Department.findOne({ name: 'solutions' });
    const mediaDept = await Department.findOne({ name: 'media' });
    const techDept = await Department.findOne({ name: 'tech' });
    const seoDept = await Department.findOne({ name: 'seo' });
    const martechDept = await Department.findOne({ name: 'martech' });
    const smpDept = await Department.findOne({ name: 'smp' });
    const fluenceDept = await Department.findOne({ name: 'fluence' });

    if (!solutionsDept) {
      console.error('✗ Solutions department not found!');
      process.exit(1);
    }

    // Clear existing responses
    await clearCycle3Responses(cycle._id);

    // Seed Solutions
    const solutionsCount = await seedSolutionsResponses(cycle, solutionsDept);

    // Seed Media
    let mediaCount = 0;
    if (mediaDept) {
      mediaCount = await seedMediaResponses(cycle, mediaDept);
    } else {
      console.log('\n⚠ Media department not found - skipping');
    }

    // Seed Tech
    let techCount = 0;
    if (techDept) {
      techCount = await seedTechResponses(cycle, techDept);
    } else {
      console.log('\n⚠ Tech department not found - skipping');
    }

    // Seed SEO
    let seoCount = 0;
    if (seoDept) {
      seoCount = await seedSeoResponses(cycle, seoDept);
    } else {
      console.log('\n⚠ SEO department not found - skipping');
    }

    // Seed MarTech
    let martechCount = 0;
    if (martechDept) {
      martechCount = await seedMartechResponses(cycle, martechDept);
    } else {
      console.log('\n⚠ MarTech department not found - skipping');
    }

    // Seed SMP
    let smpCount = 0;
    if (smpDept) {
      smpCount = await seedSmpResponses(cycle, smpDept);
    } else {
      console.log('\n⚠ SMP department not found - skipping');
    }

    // Seed Fluence
    let fluenceCount = 0;
    if (fluenceDept) {
      fluenceCount = await seedFluenceResponses(cycle, fluenceDept);
    } else {
      console.log('\n⚠ Fluence department not found - skipping');
    }

    // Summary
    const totalResponses = await CSATResponse.countDocuments({
      cycleId: cycle._id,
    });

    console.log('\n🎉 Cycle 3 CSAT Response seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`   Solutions Responses: ${solutionsCount}`);
    console.log(`   Media Responses: ${mediaCount}`);
    console.log(`   Tech Responses: ${techCount}`);
    console.log(`   SEO Responses: ${seoCount}`);
    console.log(`   MarTech Responses: ${martechCount}`);
    console.log(`   SMP Responses: ${smpCount}`);
    console.log(`   Fluence Responses: ${fluenceCount}`);
    console.log(`   Total Responses (Cycle 3): ${totalResponses}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

seed();
