/**
 * Seed Script - CSAT Responses for Cycle 1 (Solutions Department Only)
 * Populates CSAT survey responses from Cycle 1 Solutions data
 *
 * KEY FEATURE: Uses History models (BrandHistory, ClientHistory, SBUHistory)
 * to get brand, client, and SBU references for historical accuracy
 *
 * Run with: node scripts/cycle1/seedCycle1CSATResponses.js
 * Run AFTER: seedCycle1BrandsAndClients.js and seedCycle1SBUs.js
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
 * Cycle 1 Solutions CSAT Responses from CSV
 * Parsed from docs/Cycle1/CSAT DB Cycle 1 Solutions.csv
 */
const CYCLE1_SOLUTIONS_RESPONSES = [
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
    timestamp: '6/19/2025, 10:44:39 AM',
    comment: 'Keep up the good work',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919619574517',
    overallSatisfaction: 0,
    likelihoodToRecommend: 0,
    northStarMetrics: 0,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 2,
    teamResponsiveness: 2,
    brandUnderstanding: 1,
    dataEffectiveness: 1,
    teamProactivity: 2,
    meetingBusinessGoals: 1,
    timestamp: '6/19/2025, 10:46:37 AM',
    comment:
      "There's no accountability or understanding the pov of the brand insight - most of the time it's just ticking off the box of your kra thats it without any creativity / brand pov. Multiple follows up are needed. No timelines are matched. Zero inputs in Live entertainment campaigns.",
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919987298210',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 2,
    timestamp: '6/19/2025, 10:46:39 AM',
    comment:
      "While we're moving in the right direction, we still have a long way to go! The team has still not cracked how best to drive engagement with recipients and get UGC. A lot of ur UGC we are getting today are from the B2B segment and not B2C",
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919321004545',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 5,
    meetingBusinessGoals: 3,
    timestamp: '6/19/2025, 10:49:16 AM',
    comment:
      'The design team and Nichelle (in BS) have been doing an excellent job. The senior team have recently started actively working on the brand, hence would need to evaluate their participation further before reviewing it. Copy is an area which seriously needs improvement, but the team is in the process of working on it.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919319602232',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '6/19/2025, 10:55:00 AM',
    comment: 'okayish',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919643623386',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 0,
    timestamp: '6/19/2025, 11:02:03 AM',
    comment:
      'We do not have direct business goals. We are their creative agency thus, we work only on creatives.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919819076500',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 4,
    timestamp: '6/19/2025, 11:02:11 AM',
    comment:
      'Good job so far. Need to focus more on first in industry award winning stuff',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919833779503',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '6/19/2025, 11:07:08 AM',
    comment: 'NA',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919831317083',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '6/19/2025, 11:17:21 AM',
    comment:
      'Ample scope to deliver on strategy and involvement of senior leadership',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919899107943',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 5,
    timestamp: '6/19/2025, 11:21:55 AM',
    comment:
      'Good support and contribution by the team. Please keep it up!! 👍',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919930734180',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '6/20/2025, 6:46:49 AM',
    comment: 'Data backed approach is required for creating content.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919594890660',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 1,
    teamResponsiveness: 3,
    brandUnderstanding: 2,
    dataEffectiveness: 0,
    teamProactivity: 1,
    meetingBusinessGoals: 2,
    timestamp: '6/20/2025, 11:08:04 AM',
    comment: '.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '918657334606',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 5,
    dataEffectiveness: 2,
    teamProactivity: 5,
    meetingBusinessGoals: 3,
    timestamp: '6/20/2025, 11:09:03 AM',
    comment:
      'We need to think a bit better, what will cathcy eyes, how we will get more likes and etx etx',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '918898191944',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 2,
    teamResponsiveness: 5,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '6/20/2025, 11:09:24 AM',
    comment: 'NA',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919819968564',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '6/20/2025, 11:14:15 AM',
    comment:
      'We were facing major issues with the team and quality of creatives , but things have improved in the last 2 months. The quality is actually much better now so I am glad the feedback was taken',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919818536586',
    overallSatisfaction: 0,
    likelihoodToRecommend: 0,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 1,
    teamResponsiveness: 0,
    brandUnderstanding: 1,
    dataEffectiveness: 1,
    teamProactivity: 1,
    meetingBusinessGoals: 1,
    timestamp: '6/20/2025, 11:53:02 AM',
    comment: 'Really need better output.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919769900469',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 2,
    timestamp: '6/20/2025, 12:06:07 PM',
    comment:
      'Good coordination but need to take initiative on their own and good at concept level but execution stil not satisfied',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919167712818',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '6/20/2025, 12:27:00 PM',
    comment: 'Team is new so will take time to get better understanding',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919974408808',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 5,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '6/20/2025, 12:31:44 PM',
    comment:
      'Solutions team overall is doing good but we need to buckle up on the creative executions for both social and media.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919619177699',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 1,
    teamResponsiveness: 2,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '6/20/2025, 1:19:10 PM',
    comment:
      'Continuous team realignment is not providing any stature to the brand and social media strategy',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '917588951823',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '6/20/2025, 1:27:36 PM',
    comment:
      "Solutions team has done fairly well in terms of timely executing the ideas and engaging with the brand.Though, the focus on data led creative optimisation needs to be a lot more than what it is currently. The team needs to be more equipped on W's and H's on this front. Also, an alignment on what metric we are chasing via socials needs to be defined more sharply. Overall, we have moved the needle via amazing collaborations & team work. And the next frontier of growth will only come via filling these voids.",
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '917045696914',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 3,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '6/20/2025, 1:56:38 PM',
    comment: '.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919819945331',
    overallSatisfaction: 2,
    likelihoodToRecommend: 0,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 2,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 1,
    teamProactivity: 1,
    meetingBusinessGoals: 2,
    timestamp: '6/21/2025, 8:54:43 AM',
    comment:
      "On Pure Glow quality is still better but on Smart And Handsome there's a struggle on BAU content",
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919870317808',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 0,
    teamResponsiveness: 0,
    brandUnderstanding: 1,
    dataEffectiveness: 0,
    teamProactivity: 0,
    meetingBusinessGoals: 0,
    timestamp: '6/21/2025, 8:57:21 AM',
    comment:
      'Team seems very unaware and unorganized with absolutely zero senior leadership involvement',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919632392223',
    overallSatisfaction: 3,
    likelihoodToRecommend: 5,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 5,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 5,
    teamProactivity: 5,
    meetingBusinessGoals: 5,
    timestamp: '6/21/2025, 9:12:15 AM',
    comment: 'All good',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919999371335',
    overallSatisfaction: 2,
    likelihoodToRecommend: 1,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 1,
    teamResponsiveness: 3,
    brandUnderstanding: 2,
    dataEffectiveness: 1,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '6/21/2025, 9:17:28 AM',
    comment: 'Situation is not satisfactory.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '917045301998',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 2,
    timestamp: '6/21/2025, 9:39:16 AM',
    comment:
      'Although there is sound understanding of brand marketing goals , the same is not reflected quantitatively either through research or analysis. Also proactiveness has reduced. Overall good.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919619516247',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '6/21/2025, 10:26:04 AM',
    comment: 'n/a',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919004082459',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '6/21/2025, 9:51:52 AM',
    comment:
      'So far it is a good journey. We still have the opprotunity to take a leap and create delight.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919831317083',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '6/21/2025, 12:13:31 PM',
    comment:
      'Need more strategic inputs, creative ideation and execution excellence',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919833345457',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 1,
    meetingBusinessGoals: 3,
    timestamp: '6/21/2025, 1:05:01 PM',
    comment: 'NA',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919582700864',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 5,
    meetingBusinessGoals: 4,
    timestamp: '6/21/2025, 2:23:02 PM',
    comment: 'Na',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '917099035215',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 4,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '6/24/2025, 7:53:48 AM',
    comment:
      'Teams can be a bit more available and understand clients requirement',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919136294424',
    overallSatisfaction: 1,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 1,
    teamResponsiveness: 5,
    brandUnderstanding: 3,
    dataEffectiveness: 1,
    teamProactivity: 1,
    meetingBusinessGoals: 0,
    timestamp: '6/24/2025, 12:07:58 PM',
    comment: 'None',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919167712818',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '6/24/2025, 12:14:39 PM',
    comment: 'NA',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919819968564',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '6/24/2025, 12:57:06 PM',
    comment:
      'Overall the team has teally stepped up and the quality of creatives and thinking has improved a lot',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919820807710',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 2,
    timestamp: '6/26/2025, 9:38:00 AM',
    comment:
      'Team need to execute the ideasthey preset well. Execution needs work',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919819661191',
    overallSatisfaction: 1,
    likelihoodToRecommend: 1,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 3,
    teamResponsiveness: 1,
    brandUnderstanding: 1,
    dataEffectiveness: 1,
    teamProactivity: 1,
    meetingBusinessGoals: 1,
    timestamp: '6/30/2025, 2:32:51 PM',
    comment:
      'Not happy with the juniors managing acconts which require involvement of senior mentorship . There is no leadership from senior members , no data analytic skills . Lacks efficiency in understanding brand briefs . Multiple feedbacks given to execute evn smaller task . Drlay in execution and lacks creative thinking . Not hqppy with design team . Lacks creative thinking and tends to present monotonus drsign options.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919588616839',
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
    timestamp: '6/30/2025, 3:30:43 PM',
    comment: 'Na',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919953895484',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '6/30/2025, 3:31:52 PM',
    comment: 'Good',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919820868444',
    overallSatisfaction: 0,
    likelihoodToRecommend: 0,
    northStarMetrics: 0,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 0,
    teamResponsiveness: 0,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 0,
    meetingBusinessGoals: 0,
    timestamp: '6/30/2025, 4:41:39 PM',
    comment: 'Not recomending anyone',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919833393092',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '6/30/2025, 6:20:26 PM',
    comment:
      'My media person Charan is excellent.i quite like working with Krishna and Rishab as well.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '919769900469',
    overallSatisfaction: 2,
    likelihoodToRecommend: 1,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 1,
    teamResponsiveness: 1,
    brandUnderstanding: 1,
    dataEffectiveness: 1,
    teamProactivity: 1,
    meetingBusinessGoals: 1,
    timestamp: '7/1/2025, 04:35:53',
    comment: 'Below expectations',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
  },
  {
    phone: '918454075098',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '7/1/2025, 04:43:36',
    comment:
      'The team was very pro-active ans responsive. However we did face certain basic errors in copy and creative copy as well. There was alck of proof reading abd vetting final post copy prior to posting which had to be piinted out by us repeatedly.',
    qualityOfDesignVideo: null,
    qualityOfIdeas: null,
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

async function getOrCreateCycle1() {
  let cycle = await Cycle.findOne({ cycleNumber: 1, year: 2025 });
  if (!cycle) {
    cycle = await Cycle.create({
      name: 'Cycle 1',
      cycleNumber: 1,
      year: 2025,
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 1, 28, 23, 59, 59, 999),
      status: 'completed',
      isActive: false,
    });
    console.log('  ✓ Created Cycle 1 (2025)');
  } else {
    console.log('  ✓ Found existing Cycle 1 (2025)');
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

async function clearCycle1Responses(cycleId, departmentId) {
  console.log(
    '\n🗑️  Clearing existing Cycle 1 CSAT responses for this department...'
  );
  const result = await CSATResponse.deleteMany({ cycleId, departmentId });
  console.log(`  ✓ Deleted ${result.deletedCount} existing responses`);
  return result.deletedCount;
}

/**
 * Find SBU from SBUHistory for a brand in Cycle 1
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
    '\n📊 Seeding Solutions Department CSAT Responses for Cycle 1...'
  );
  let created = 0,
    skipped = 0;

  for (const response of CYCLE1_SOLUTIONS_RESPONSES) {
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
 * Main seed function
 */
async function seed() {
  console.log(
    '🌱 Starting Cycle 1 CSAT Response Seeding (Solutions Only)...\n'
  );
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📅 Setting up Cycle 1...');
    const cycle = await getOrCreateCycle1();

    // Get Solutions department
    const solutionsDept = await Department.findOne({ name: 'solutions' });
    if (!solutionsDept) {
      console.error('✗ Solutions department not found!');
      process.exit(1);
    }

    // Clear existing responses for Solutions department
    await clearCycle1Responses(cycle._id, solutionsDept._id);

    // Seed Solutions responses
    const solutionsCount = await seedSolutionsResponses(cycle, solutionsDept);

    console.log('\n🎉 Cycle 1 CSAT Response seeding completed successfully!');

    // Summary
    const totalResponses = await CSATResponse.countDocuments({
      cycleId: cycle._id,
    });

    console.log('\n📊 Summary:');
    console.log(`   Total Responses for Cycle 1: ${totalResponses}`);
    console.log(`   Solutions Responses: ${solutionsCount}`);
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
