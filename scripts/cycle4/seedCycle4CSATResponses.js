/**
 * Seed Script - CSAT Responses for Cycle 4
 * Populates CSAT survey responses from Cycle 4 Solutions data
 *
 * KEY FEATURE: Uses History models (BrandHistory, ClientHistory, SBUHistory)
 * to get brand, client, and SBU references for historical accuracy
 *
 * Run with: node scripts/cycle4/seedCycle4CSATResponses.js
 * Run AFTER: seedCycle4BrandsAndClients.js and seedCycle4SBUs.js
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
 * Cycle 4 Solutions CSAT Responses from CSV
 * Parsed from docs/Cycle 4/CSAT DB Cycle 4 Solutions.csv
 */
const CYCLE4_SOLUTIONS_RESPONSES = [
  {
    phone: '918013088104',
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
    timestamp: '11/3/2025, 11:27:49',
    comment: 'Love working with the team! We can do wonders together.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '918792488536',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 2,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 1,
    meetingBusinessGoals: 2,
    timestamp: '11/3/2025, 11:29:31',
    comment:
      'Turn around times for creatives needs to be better. Teams need to be more responsive',
    qualityOfDesignVideo: 1,
    qualityOfIdeas: 2,
  },
  {
    phone: '919841154231',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/3/2025, 11:30:55',
    comment: '.',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 3,
  },
  {
    phone: '919686188441',
    overallSatisfaction: 1,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 1,
    teamResponsiveness: 1,
    brandUnderstanding: 1,
    dataEffectiveness: 0,
    teamProactivity: 0,
    meetingBusinessGoals: 2,
    timestamp: '11/3/2025, 11:49:46',
    comment:
      'Off late there has been a huge lethargy. Timelines are tossed. Quality is bad. Thought process is missing.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 2,
  },
  {
    phone: '919769844075',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/3/2025, 12:15:21',
    comment:
      'While the team has been quite proactive and has been doing well, it\'s now time to scale up our efforts and ensure it supports brand\'s accelerated journey of growth.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919987564471',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/3/2025, 12:36:09',
    comment:
      'The quality of work has improved, TAT is better compared to last quarter. There\'s a room for improvement when it comes to ideas/copies etc.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '918826512124',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 2,
    teamResponsiveness: 4,
    brandUnderstanding: 2,
    dataEffectiveness: 1,
    teamProactivity: 3,
    meetingBusinessGoals: 2,
    timestamp: '11/4/2025, 07:26:16',
    comment:
      'The new team needs to pick up work and understand the brand requirements more quickly',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 2,
  },
  {
    phone: '919920959673',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/4/2025, 07:28:24',
    comment: 'Attention to detail lacks at times',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 5,
  },
  {
    phone: '919619714546',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '11/4/2025, 07:30:18',
    comment:
      'Great team, very accommodating and supportive. However strategic thinking can be strengthened for sharper ideation. Design team needs more finesse and attention to detail',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919716741127',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '11/4/2025, 08:16:05',
    comment:
      'The team is great at the planning/strategizing phase but Needs to be more proactive in the execution phase. Esp for the Influencer execution',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919769016631',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/4/2025, 08:43:21',
    comment: 'Would recommend not to change the designers so frequently',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 2,
  },
  {
    phone: '919321004545',
    overallSatisfaction: 2,
    likelihoodToRecommend: 1,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 2,
    teamResponsiveness: 4,
    brandUnderstanding: 2,
    dataEffectiveness: 1,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '11/4/2025, 08:56:46',
    comment:
      'Mostly work is reactive and not proactive. There is a lot of handholding and very laid back attitude.',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 3,
  },
  {
    phone: '919920242841',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/4/2025, 13:59:13',
    comment: 'Needs improvement!',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 2,
  },
  {
    phone: '919819413522',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 5,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 5,
    meetingBusinessGoals: 4,
    timestamp: '11/4/2025, 14:37:48',
    comment:
      'The team is highly supportive and proactive, always bringing fresh innovative ideas to the table. Their approach reflects great ownership. Thanks!',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 4,
  },
  {
    phone: '919810993747',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '11/5/2025, 02:57:13',
    comment:
      'Schbang is a fairly new agency on the brand, we would still like to see a lot more magic on the brand',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919163190908',
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
    timestamp: '11/5/2025, 04:55:22',
    comment: '-',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 5,
  },
  {
    phone: '916360830441',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 5,
    meetingBusinessGoals: 4,
    timestamp: '11/5/2025, 07:31:29',
    comment:
      'Its been going good so far with the team involvement. The team is very responsive and accommodating.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919546583838',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 5,
    teamProactivity: 5,
    meetingBusinessGoals: 4,
    timestamp: '11/5/2025, 08:52:05',
    comment: 'Can improve further on variety in ideas...otherwise going great.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919974408808',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/6/2025, 05:44:17',
    comment:
      'Creative quality still needs to bump up. Overall solutions team doing good now only from creative execution since we have already seen best work coming out we still expect that bare minimum.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919002946885',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 5,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 5,
    dataEffectiveness: 5,
    teamProactivity: 3,
    meetingBusinessGoals: 4,
    timestamp: '11/6/2025, 08:14:44',
    comment:
      'Its been great so far, will recommend the team to be proactive in terms of what the competition is doing so we can learn from them',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 4,
  },
  {
    phone: '919833779503',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/6/2025, 08:14:44',
    comment: 'NA',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '918779163934',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 3,
    timestamp: '11/6/2025, 08:16:58',
    comment: '-',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 4,
  },
  {
    phone: '919078803001',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/6/2025, 08:17:02',
    comment: 'N/A',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919588616839',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/6/2025, 08:26:34',
    comment: 'Na',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919741984655',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 2,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '11/6/2025, 08:32:35',
    comment: 'S',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919718294118',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 1,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 2,
    timestamp: '11/6/2025, 08:32:42',
    comment:
      'Due to the constantly changing teams and fresh talents, its difficult to do long term planning and build a strategic roadmap for the work done.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 2,
  },
  {
    phone: '919004082459',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 2,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '11/6/2025, 08:34:14',
    comment: 'Hoping to see an improved partnership',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 2,
  },
  {
    phone: '918126232125',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/6/2025, 09:53:06',
    comment: 'It\'s great working with the team!',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919818326107',
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
    timestamp: '11/6/2025, 09:53:23',
    comment: '-',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '918240069147',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/6/2025, 11:51:30',
    comment: '..',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919702859986',
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
    timestamp: '11/6/2025, 13:17:35',
    comment: 'NA',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 5,
  },
  {
    phone: '919705311188',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 5,
    dataEffectiveness: 4,
    teamProactivity: 5,
    meetingBusinessGoals: 5,
    timestamp: '11/6/2025, 13:44:36',
    comment:
      'There has been a significant progress in the last 2-3 months. I wish we engage in more moment marketing activities moving forward.',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 4,
  },
  {
    phone: '919870559269',
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
    timestamp: '11/6/2025, 13:57:27',
    comment: 'Charu is very cooperative and prompt in giving response',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '917350016051',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 3,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/6/2025, 15:12:48',
    comment:
      'Some areas need to be strengthened, we can see improvement in those areas, need to Fastrack it. Teams efforts and collaboration with Bridgestone team is amazing.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '918585010200',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 2,
    timestamp: '11/6/2025, 15:12:51',
    comment: 'Struggling with execution',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 2,
  },
  {
    phone: '919791052222',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 5,
    meetingBusinessGoals: 3,
    timestamp: '11/7/2025, 01:27:34',
    comment: 'No additional comments',
    qualityOfDesignVideo: 4,
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
    timestamp: '11/7/2025, 06:31:50',
    comment: 'Good work',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
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
    timestamp: '11/7/2025, 06:45:21',
    comment: 'Alignment of content with NSM of NueGo brand online channel',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 5,
  },
  {
    phone: '918879689407',
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
    timestamp: '11/7/2025, 07:11:21',
    comment:
      'Schbang brings great value to our digital and social media strategy and initiatives',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 4,
  },
  {
    phone: '918879972041',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/7/2025, 07:46:56',
    comment: 'Doing well',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919920379383',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/7/2025, 08:55:13',
    comment:
      'For the most part we are happy with the output. We appreciate the proactiveness in planning, however campaign reporting can be improved',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919130098805',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 5,
    meetingBusinessGoals: 4,
    timestamp: '11/7/2025, 10:52:51',
    comment:
      'Good enthusiastic team. Needs more strategic thinking to better align to Brand\'s goals',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919953251989',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/7/2025, 10:56:19',
    comment:
      'Overall happy with the work. Rest of the feedback is given to the team on a regular basis and team does adhered to it. Good work.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919930089911',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/7/2025, 11:05:57',
    comment:
      'The quality of the videos and creatives is strong. Currently, I\'m not seeing proactive strategic inputs from the team.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919699393165',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 5,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 5,
    meetingBusinessGoals: 4,
    timestamp: '11/7/2025, 11:36:00',
    comment:
      'Overall it has been a decent experience and the team has been supportive. More of Senior leadership involvement will be fruitful',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '918299775274',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/7/2025, 11:46:03',
    comment: 'NA',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919790939940',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/7/2025, 12:17:02',
    comment:
      'We expect more strategic ideas for taking Oriana to the next level',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '919920776008',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 5,
    dataEffectiveness: 2,
    teamProactivity: 5,
    meetingBusinessGoals: 4,
    timestamp: '11/7/2025, 13:40:42',
    comment:
      'Varsha is very passionate about building our brand and has put together a strong team in Shreesh and Isha to execute.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 5,
  },
  {
    phone: '919594890660',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '11/7/2025, 14:08:02',
    comment:
      'Ideas team shares are good but during execution the Schbang team fails:(',
    qualityOfDesignVideo: 2,
    qualityOfIdeas: 5,
  },
  {
    phone: '919910879402',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 2,
    dataEffectiveness: 0,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/7/2025, 14:12:08',
    comment:
      'I have mixed reaction for the team working. Efforts are good but since the team is in transition need to learn a lot of things.',
    qualityOfDesignVideo: 1,
    qualityOfIdeas: 1,
  },
  {
    phone: '918007415155',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 5,
    teamProactivity: 3,
    meetingBusinessGoals: 4,
    timestamp: '11/8/2025, 01:12:33',
    comment: 'NA',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919971114795',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 5,
    timestamp: '11/8/2025, 05:43:52',
    comment: 'Overall experience has been fairly good.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919820600264',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/8/2025, 06:10:21',
    comment: 'The association with the agency is shaping up well.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '919663855927',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 2,
    teamResponsiveness: 2,
    brandUnderstanding: 2,
    dataEffectiveness: 4,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/8/2025, 06:51:59',
    comment:
      'Looks like the team is not as proactive and creative as what they used to be. Lack of ownership and brand understanding as a whole. Can do better',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 2,
  },
  {
    phone: '919873737338',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 2,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '11/10/2025, 03:48:05',
    comment:
      'Hope to see more of strategic inputs and senior management involvement and proactively suggesting new ideas. Execution is good.',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 4,
  },
  {
    phone: '919833393092',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/10/2025, 12:14:12',
    comment: 'Did not have a big campaign in Oct\'25',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919601986101',
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
    timestamp: '11/10/2025, 12:53:26',
    comment: 'Very good',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 5,
  },
  {
    phone: '918356851403',
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
    timestamp: '11/11/2025, 06:33:33',
    comment:
      'Hi, these feedbacks are basis our recent journey which is very fresh and going thru a learning phase too.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919988889772',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 3,
    dataEffectiveness: 4,
    teamProactivity: 2,
    meetingBusinessGoals: 3,
    timestamp: '11/11/2025, 06:55:59',
    comment: 'None',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919711981493',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 5,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 5,
    meetingBusinessGoals: 3,
    timestamp: '11/11/2025, 08:50:50',
    comment: '.',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919867066763',
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
    timestamp: '11/11/2025, 08:59:09',
    comment: 'No complains so far',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '918511356222',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/11/2025, 08:59:09',
    comment: 'Much better then last quarters',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 5,
  },
  {
    phone: '919653295037',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 3,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '11/11/2025, 10:03:07',
    comment: 'Good Job',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '917889811148',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/11/2025, 10:11:29',
    comment:
      'There has been improvement in the last couple of months but there\'s scope to do alot more together to achieve brand awareness',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919911983404',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 1,
    teamProactivity: 2,
    meetingBusinessGoals: 2,
    timestamp: '11/11/2025, 10:28:27',
    comment:
      'From previous month we have seen improvement in design quality however data analytics and idea generation needs to improve. Also senior leadership involvement is required',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '917211184610',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 4,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/11/2025, 10:52:07',
    comment:
      'Team has shown improvement and we believe there is space to grow. Understanding of steel ecosystem still needs efforts. Creatives and ideas have been good.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919891433015',
    overallSatisfaction: 2,
    likelihoodToRecommend: 1,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 1,
    teamResponsiveness: 3,
    brandUnderstanding: 1,
    dataEffectiveness: 0,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/11/2025, 10:55:40',
    comment:
      'Team is slow in implementing the ideas aligned, giving us major challenges in execution- having multiple iterations. AI usage still remains questionable.',
    qualityOfDesignVideo: 1,
    qualityOfIdeas: 3,
  },
  {
    phone: '919953606758',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 2,
    meetingBusinessGoals: 3,
    timestamp: '11/11/2025, 11:23:21',
    comment: 'NA',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 3,
  },
  {
    phone: '919769808077',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 4,
    timestamp: '11/11/2025, 11:28:59',
    comment: 'Nothing additional to add',
    qualityOfDesignVideo: 4,
    qualityOfIdeas: 4,
  },
  {
    phone: '919319083208',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 1,
    teamProactivity: 2,
    meetingBusinessGoals: 3,
    timestamp: '11/11/2025, 12:00:27',
    comment: 'Good work on social media first trends.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919820256674',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/12/2025, 05:27:51',
    comment:
      'New team to build up understanding on the category and science of the brand',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 4,
  },
  {
    phone: '919892568511',
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
    timestamp: '11/12/2025, 08:44:04',
    comment:
      'While your team is incredibly supportive and responsive, we need to see a more significant upgrade in the strategic foundation and the resulting creative ideas to elevate our current engagement.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 2,
  },
  {
    phone: '919819076500',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '11/12/2025, 09:12:52',
    comment: 'Senior team involvement can be better and response time as well',
    qualityOfDesignVideo: 5,
    qualityOfIdeas: 4,
  },
  {
    phone: '918452005769',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '11/12/2025, 15:09:06',
    comment: 'Na',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '919321539567',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 1,
    teamProactivity: 3,
    meetingBusinessGoals: 5,
    timestamp: '11/12/2025, 16:21:00',
    comment:
      'The team is extremely responsive, they come with good ideas and final execution however we struggle with meeting deadlines and timelines committed.',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
  {
    phone: '918130778113',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 2,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '11/17/2025, 10:26:47 AM',
    comment: 'Na',
    qualityOfDesignVideo: 3,
    qualityOfIdeas: 3,
  },
];

/**
 * Cycle 4 Tech CSAT Responses from CSV
 * Parsed from docs/Cycle 4/CSAT DB Cycle 4 Tech.csv
 */
const CYCLE4_TECH_RESPONSES = [
  {
    phone: '918269027252',
    uiuxSatisfaction: 4,
    timelyExecution: 4,
    technicalSupport: 4,
    teamTransparency: 4,
    teamCollaboration: 4,
    feedbackResponse: 4,
    overallSatisfaction: 3,
    businessAlignment: 4,
    overallEffectiveness: 4,
    teamProactivity: 4,
    systemIntegration: 4,
    likelihoodToRecommend: 4,
    timestamp: '11/4/2025, 09:31:02',
    comment: 'Thank you',
  },
  {
    phone: '917760972675',
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
    timestamp: '11/6/2025, 08:38:46',
    comment: 'Happy with the services.',
  },
  {
    phone: '919833993177',
    uiuxSatisfaction: 5,
    timelyExecution: 5,
    technicalSupport: 5,
    teamTransparency: 4,
    teamCollaboration: 5,
    feedbackResponse: 4,
    overallSatisfaction: 5,
    businessAlignment: 4,
    overallEffectiveness: 4,
    teamProactivity: 4,
    systemIntegration: 5,
    likelihoodToRecommend: 5,
    timestamp: '11/6/2025, 14:58:31',
    comment:
      'The team is very responsive but can be better at giving prompt solution',
  },
  {
    phone: '919953251989',
    uiuxSatisfaction: 4,
    timelyExecution: 4,
    technicalSupport: 4,
    teamTransparency: 4,
    teamCollaboration: 4,
    feedbackResponse: 4,
    overallSatisfaction: 4,
    businessAlignment: 4,
    overallEffectiveness: 4,
    teamProactivity: 4,
    systemIntegration: 4,
    likelihoodToRecommend: 4,
    timestamp: '11/7/2025, 10:58:24',
    comment: 'Limited interaction but decent',
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
    businessAlignment: 5,
    overallEffectiveness: 5,
    teamProactivity: 5,
    systemIntegration: 5,
    likelihoodToRecommend: 5,
    timestamp: '11/10/2025, 09:15:13',
    comment: 'Quick turnaround time and response from the tech team',
  },
  {
    phone: '61432089955',
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
    timestamp: '11/12/2025, 05:52:15',
    comment:
      'Khushi has been great in coordinating the account would be great if the designer did not leave and the recruitment would have been faster',
  },
];

/**
 * Cycle 4 SEO CSAT Responses from CSV
 * Parsed from docs/Cycle 4/CSAT DB Cycle 4 SEO.csv
 */
const CYCLE4_SEO_RESPONSES = [
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
    timestamp: '11/7/2025, 06:45:53',
    comment: 'NA',
  },
  {
    phone: '919930577107',
    transparency: 3,
    timelyDelivery: 1,
    overallEffectiveness: 2,
    feedbackResponse: 1,
    businessImpact: 0,
    teamProactivity: 0,
    strategyAlignment: 2,
    seoImpact: 0,
    overallSatisfaction: 0,
    likelihoodToRecommend: 2,
    contentQuality: 2,
    timestamp: '11/7/2025, 08:36:57',
    comment: 'Thanks a lot',
  },
  {
    phone: '919953251989',
    transparency: 4,
    timelyDelivery: 4,
    overallEffectiveness: 4,
    feedbackResponse: 4,
    businessImpact: 4,
    teamProactivity: 4,
    strategyAlignment: 4,
    seoImpact: 4,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    contentQuality: 4,
    timestamp: '11/7/2025, 10:57:17',
    comment: 'Good',
  },
  {
    phone: '919900815222',
    transparency: 4,
    timelyDelivery: 4,
    overallEffectiveness: 4,
    feedbackResponse: 4,
    businessImpact: 4,
    teamProactivity: 5,
    strategyAlignment: 4,
    seoImpact: 3,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    contentQuality: 4,
    timestamp: '11/7/2025, 10:59:21',
    comment: '-',
  },
  {
    phone: '919892058033',
    transparency: 2,
    timelyDelivery: 3,
    overallEffectiveness: 3,
    feedbackResponse: 2,
    businessImpact: 3,
    teamProactivity: 3,
    strategyAlignment: 1,
    seoImpact: 3,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    contentQuality: 3,
    timestamp: '11/10/2025, 08:20:31',
    comment: 'Lacking in strategy and data analysis.',
  },
  {
    phone: '918012047626',
    transparency: 5,
    timelyDelivery: 5,
    overallEffectiveness: 5,
    feedbackResponse: 5,
    businessImpact: 4,
    teamProactivity: 5,
    strategyAlignment: 5,
    seoImpact: 5,
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    contentQuality: 5,
    timestamp: '11/10/2025, 09:14:24',
    comment:
      'Need proactive recommendation, suggestions and ideas related to the industry blogs',
  },
  {
    phone: '919819413522',
    transparency: 5,
    timelyDelivery: 5,
    overallEffectiveness: 4,
    feedbackResponse: 5,
    businessImpact: 4,
    teamProactivity: 4,
    strategyAlignment: 4,
    seoImpact: 3,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    contentQuality: 5,
    timestamp: '11/10/2025, 11:09:31',
    comment:
      'Though the team has been putting in consistent efforts, we may need to adopt a more aggressive approach to SEO to drive higher quality organic traffic to the category pages.',
  },
  {
    phone: '919967002720',
    transparency: 4,
    timelyDelivery: 3,
    overallEffectiveness: 4,
    feedbackResponse: 4,
    businessImpact: 4,
    teamProactivity: 4,
    strategyAlignment: 4,
    seoImpact: 4,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    contentQuality: 4,
    timestamp: '11/10/2025, 18:55:47',
    comment: 'Thanks',
  },
  {
    phone: '919566820805',
    transparency: 4,
    timelyDelivery: 4,
    overallEffectiveness: 3,
    feedbackResponse: 3,
    businessImpact: 4,
    teamProactivity: 5,
    strategyAlignment: 4,
    seoImpact: 4,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    contentQuality: 5,
    timestamp: '11/12/2025, 06:52:53',
    comment: 'No comments',
  },
  {
    phone: '919884076488',
    transparency: 4,
    timelyDelivery: 3,
    overallEffectiveness: 4,
    feedbackResponse: 4,
    businessImpact: 4,
    teamProactivity: 4,
    strategyAlignment: 4,
    seoImpact: 4,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    contentQuality: 3,
    timestamp: '11/17/2025, 2:02:50 PM',
    comment:
      'Broadly happy with the way SEO has been going. Only feedback would be to align better with Gen AI upgrades. Would like to see more recommendations and effort on this front. Siddhant and team are responsive and diligent.',
  },
];

/**
 * Cycle 4 Media CSAT Responses from CSV
 * Parsed from docs/Cycle 4/CSAT DB Cycle 4 Media.csv
 */
const CYCLE4_MEDIA_RESPONSES = [
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
    timestamp: '11/3/2025, 11:27:49',
    comment: 'Great working with Najuka and team',
  },
  {
    phone: '919834553221',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    strategyAlignment: 3,
    teamProactivity: 2,
    creativeRefreshment: 2,
    teamCollaboration: 2,
    optimizationEffectiveness: 2,
    timelyExecution: 2,
    teamTransparency: 4,
    feedbackResponse: 3,
    overallEffectiveness: 3,
    timestamp: '11/3/2025, 11:27:49',
    comment:
      'No initiative is taken to update what\'s the progress on the task assigned. No update if the timeline is missed. Unless and until I ask again, I don\'t get an update on the deliverables',
  },
  {
    phone: '917977395820',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    strategyAlignment: 4,
    teamProactivity: 5,
    creativeRefreshment: 4,
    teamCollaboration: 5,
    optimizationEffectiveness: 4,
    timelyExecution: 4,
    teamTransparency: 5,
    feedbackResponse: 5,
    overallEffectiveness: 5,
    timestamp: '11/5/2025, 10:52:37',
    comment: 'Na',
  },
  {
    phone: '919974408808',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    strategyAlignment: 3,
    teamProactivity: 3,
    creativeRefreshment: 3,
    teamCollaboration: 4,
    optimizationEffectiveness: 3,
    timelyExecution: 4,
    teamTransparency: 4,
    feedbackResponse: 3,
    overallEffectiveness: 3,
    timestamp: '11/6/2025, 05:56:58',
    comment:
      'Team lacks on data based campaign optimisation we have done two rounds of meeting already where we shown that results from campaign are not upto the mark the quality is going down in leads generated in performance campaigns. Still we are going with same plan',
  },
  {
    phone: '919445057968',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    strategyAlignment: 4,
    teamProactivity: 4,
    creativeRefreshment: 4,
    teamCollaboration: 5,
    optimizationEffectiveness: 4,
    timelyExecution: 5,
    teamTransparency: 5,
    feedbackResponse: 4,
    overallEffectiveness: 4,
    timestamp: '11/6/2025, 08:14:58',
    comment: 'Team is quite proactive and responsive.',
  },
  {
    phone: '919833779503',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    strategyAlignment: 2,
    teamProactivity: 2,
    creativeRefreshment: 2,
    teamCollaboration: 2,
    optimizationEffectiveness: 2,
    timelyExecution: 3,
    teamTransparency: 3,
    feedbackResponse: 3,
    overallEffectiveness: 3,
    timestamp: '11/6/2025, 08:15:23',
    comment: 'NA',
  },
  {
    phone: '917350016051',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    strategyAlignment: 5,
    teamProactivity: 4,
    creativeRefreshment: 4,
    teamCollaboration: 4,
    optimizationEffectiveness: 5,
    timelyExecution: 4,
    teamTransparency: 4,
    feedbackResponse: 5,
    overallEffectiveness: 4,
    timestamp: '11/6/2025, 15:16:47',
    comment:
      'Digital media performance is good. When it comes to traditional media activation team need to acquire more expertise / capabilities.',
  },
  {
    phone: '919953251989',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    strategyAlignment: 5,
    teamProactivity: 5,
    creativeRefreshment: 5,
    teamCollaboration: 5,
    optimizationEffectiveness: 4,
    timelyExecution: 4,
    teamTransparency: 4,
    feedbackResponse: 4,
    overallEffectiveness: 5,
    timestamp: '11/10/2025, 12:13:46',
    comment: 'Happy with the Media team, Viskakha is a great asset.',
  },
  {
    phone: '919601986101',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    strategyAlignment: 5,
    teamProactivity: 5,
    creativeRefreshment: 4,
    teamCollaboration: 5,
    optimizationEffectiveness: 5,
    timelyExecution: 5,
    teamTransparency: 5,
    feedbackResponse: 5,
    overallEffectiveness: 5,
    timestamp: '11/10/2025, 12:53:52',
    comment: 'Very good',
  },
  {
    phone: '919652387716',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    strategyAlignment: 4,
    teamProactivity: 4,
    creativeRefreshment: 4,
    teamCollaboration: 5,
    optimizationEffectiveness: 4,
    timelyExecution: 4,
    teamTransparency: 4,
    feedbackResponse: 5,
    overallEffectiveness: 4,
    timestamp: '11/10/2025, 13:05:43',
    comment: 'Good response, we were satisfied with the results',
  },
  {
    phone: '917972446697',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    strategyAlignment: 4,
    teamProactivity: 5,
    creativeRefreshment: 4,
    teamCollaboration: 5,
    optimizationEffectiveness: 4,
    timelyExecution: 4,
    teamTransparency: 4,
    feedbackResponse: 4,
    overallEffectiveness: 4,
    timestamp: '11/10/2025, 13:53:26',
    comment: 'T',
  },
  {
    phone: '919833380003',
    overallSatisfaction: 5,
    likelihoodToRecommend: 4,
    strategyAlignment: 4,
    teamProactivity: 5,
    creativeRefreshment: 5,
    teamCollaboration: 4,
    optimizationEffectiveness: 4,
    timelyExecution: 4,
    teamTransparency: 4,
    feedbackResponse: 4,
    overallEffectiveness: 4,
    timestamp: '11/11/2025, 11:45:10',
    comment: 'Overall Team performance was Satisfactory.',
  },
  {
    phone: '918655077233',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    strategyAlignment: 5,
    teamProactivity: 5,
    creativeRefreshment: 5,
    teamCollaboration: 4,
    optimizationEffectiveness: 4,
    timelyExecution: 5,
    teamTransparency: 4,
    feedbackResponse: 5,
    overallEffectiveness: 5,
    timestamp: '11/11/2025, 11:46:15',
    comment: 'Overall good',
  },
  {
    phone: '919566820805',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    strategyAlignment: 2,
    teamProactivity: 3,
    creativeRefreshment: 0,
    teamCollaboration: 3,
    optimizationEffectiveness: 4,
    timelyExecution: 4,
    teamTransparency: 4,
    feedbackResponse: 3,
    overallEffectiveness: 2,
    timestamp: '11/12/2025, 06:53:50',
    comment: 'No comments',
  },
];

/**
 * Cycle 4 Fluence CSAT Responses from CSV
 * Parsed from docs/Cycle 4/CSAT DB Cycle 4 Fluence.csv
 */
const CYCLE4_FLUENCE_RESPONSES = [
  {
    phone: '919820835273',
    timelineAdherence: 5,
    responsiveness: 5,
    reportingQuality: 5,
    roi: 4,
    outcomeEffectiveness: 4,
    communication: 5,
    teamProactivity: 5,
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    creatorFit: 5,
    campaignExecution: 5,
    briefUnderstanding: 5,
    timestamp: '11/4/2025, 06:59:35',
    comment: 'The team did a good job',
  },
  {
    phone: '918283883170',
    timelineAdherence: 4,
    responsiveness: 3,
    reportingQuality: 0,
    roi: 0,
    outcomeEffectiveness: 0,
    communication: 3,
    teamProactivity: 2,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    creatorFit: 3,
    campaignExecution: 4,
    briefUnderstanding: 3,
    timestamp: '11/4/2025, 07:04:58',
    comment:
      'I still have not received the performance report, therefore I have not rated the team on those questions.',
  },
  {
    phone: '919825085451',
    timelineAdherence: 5,
    responsiveness: 5,
    reportingQuality: 4,
    roi: 4,
    outcomeEffectiveness: 4,
    communication: 4,
    teamProactivity: 5,
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    creatorFit: 4,
    campaignExecution: 5,
    briefUnderstanding: 4,
    timestamp: '11/5/2025, 10:34:40',
    comment: 'Great work so far',
  },
  {
    phone: '917718815765',
    timelineAdherence: 1,
    responsiveness: 4,
    reportingQuality: 3,
    roi: 3,
    outcomeEffectiveness: 3,
    communication: 4,
    teamProactivity: 3,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    creatorFit: 4,
    campaignExecution: 4,
    briefUnderstanding: 4,
    timestamp: '11/5/2025, 14:37:09',
    comment: 'Influencer campaign for pose your way and festive executed well',
  },
  {
    phone: '919974408808',
    timelineAdherence: 4,
    responsiveness: 4,
    reportingQuality: 3,
    roi: 3,
    outcomeEffectiveness: 3,
    communication: 4,
    teamProactivity: 3,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    creatorFit: 3,
    campaignExecution: 4,
    briefUnderstanding: 4,
    timestamp: '11/6/2025, 05:48:20',
    comment:
      'We are looking this team to be focused and driven now kpi centric and not just creator focused',
  },
  {
    phone: '919920697652',
    timelineAdherence: 4,
    responsiveness: 4,
    reportingQuality: 4,
    roi: 4,
    outcomeEffectiveness: 4,
    communication: 4,
    teamProactivity: 4,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    creatorFit: 4,
    campaignExecution: 4,
    briefUnderstanding: 4,
    timestamp: '11/7/2025, 06:32:17',
    comment: 'Good work',
  },
  {
    phone: '919130098805',
    timelineAdherence: 4,
    responsiveness: 4,
    reportingQuality: 3,
    roi: 3,
    outcomeEffectiveness: 3,
    communication: 3,
    teamProactivity: 2,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    creatorFit: 3,
    campaignExecution: 3,
    briefUnderstanding: 2,
    timestamp: '11/7/2025, 10:53:47',
    comment: 'The creativity in execution needs to be way better.',
  },
  {
    phone: '916290407143',
    timelineAdherence: 2,
    responsiveness: 3,
    reportingQuality: 4,
    roi: 3,
    outcomeEffectiveness: 3,
    communication: 3,
    teamProactivity: 2,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    creatorFit: 3,
    campaignExecution: 3,
    briefUnderstanding: 4,
    timestamp: '11/10/2025, 11:57:50',
    comment: '.',
  },
  {
    phone: '919953251989',
    timelineAdherence: 3,
    responsiveness: 3,
    reportingQuality: 3,
    roi: 3,
    outcomeEffectiveness: 3,
    communication: 3,
    teamProactivity: 3,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    creatorFit: 2,
    campaignExecution: 2,
    briefUnderstanding: 3,
    timestamp: '11/10/2025, 12:19:25',
    comment:
      'Needs senior involvement - lacking currently. Also overall of expectations with a bit of proactiveness.',
  },
  {
    phone: '917838552269',
    timelineAdherence: 3,
    responsiveness: 3,
    reportingQuality: 2,
    roi: 2,
    outcomeEffectiveness: 2,
    communication: 3,
    teamProactivity: 3,
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    creatorFit: 2,
    campaignExecution: 3,
    briefUnderstanding: 3,
    timestamp: '11/10/2025, 12:29:03',
    comment: 'No',
  },
  {
    phone: '919004388299',
    timelineAdherence: 2,
    responsiveness: 4,
    reportingQuality: 3,
    roi: 3,
    outcomeEffectiveness: 3,
    communication: 2,
    teamProactivity: 4,
    overallSatisfaction: 2,
    likelihoodToRecommend: 3,
    creatorFit: 2,
    campaignExecution: 3,
    briefUnderstanding: 3,
    timestamp: '11/10/2025, 12:31:33',
    comment: 'None.',
  },
  {
    phone: '918109127012',
    timelineAdherence: 4,
    responsiveness: 4,
    reportingQuality: 4,
    roi: 4,
    outcomeEffectiveness: 4,
    communication: 4,
    teamProactivity: 4,
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    creatorFit: 5,
    campaignExecution: 5,
    briefUnderstanding: 4,
    timestamp: '11/11/2025, 07:24:48',
    comment: 'Appreciate quick turnaround from the team.',
  },
  {
    phone: '919953948545',
    timelineAdherence: 3,
    responsiveness: 3,
    reportingQuality: 2,
    roi: 3,
    outcomeEffectiveness: 2,
    communication: 2,
    teamProactivity: 4,
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    creatorFit: 4,
    campaignExecution: 2,
    briefUnderstanding: 3,
    timestamp: '11/11/2025, 07:34:37',
    comment:
      'Haven\'t completed execution so can\'t really measure the outcome in totality',
  },
  {
    phone: '919769808077',
    timelineAdherence: 3,
    responsiveness: 4,
    reportingQuality: 2,
    roi: 3,
    outcomeEffectiveness: 4,
    communication: 4,
    teamProactivity: 4,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    creatorFit: 4,
    campaignExecution: 4,
    briefUnderstanding: 4,
    timestamp: '11/11/2025, 11:29:54',
    comment: 'NA',
  },
];

/**
 * Cycle 4 SMP CSAT Responses from CSV
 * Parsed from docs/Cycle 4/CSAT DB Cycle 4 SMP.csv
 */
const CYCLE4_SMP_RESPONSES = [
  {
    phone: '919444555351',
    workAgainLikelihood: 5,
    timelineDelivery: 5,
    recommendationLikelihood: 5,
    productionExperience: 5,
    postProductionProcess: 5,
    ppmQuality: 5,
    finalAssetQuality: 5,
    budgetValue: 5,
    teamShoutout: '',
    productionType: 'a',
    feedbackResponsiveness: 5,
    communicationRating: 5,
    briefUnderstanding: 5,
    timestamp: '11/5/2025, 07:42:46',
    overallSatisfaction: 5,
    comment: 'Nik',
  },
  {
    phone: '919833779503',
    workAgainLikelihood: 1,
    timelineDelivery: 1,
    recommendationLikelihood: 1,
    productionExperience: 1,
    postProductionProcess: 1,
    ppmQuality: 2,
    finalAssetQuality: 1,
    budgetValue: 2,
    teamShoutout: '',
    productionType: 'a',
    feedbackResponsiveness: 2,
    communicationRating: 2,
    briefUnderstanding: 3,
    timestamp: '11/6/2025, 08:16:34',
    overallSatisfaction: 1,
    comment: 'Detailed feedback on Founders\' Day campaign is given.',
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
      'All the team members: Ahaana, Isha, Batul, Mohmaad bhai, Vaibhav, Kasyap, Sanket…may have missed out but everyone did a great job and launched the film on time',
    productionType: 'c',
    feedbackResponsiveness: 5,
    communicationRating: 5,
    briefUnderstanding: 5,
    timestamp: '11/10/2025, 12:55:43',
    overallSatisfaction: 5,
    comment: 'GREAT',
  },
];

/**
 * Cycle 4 MarTech CSAT Responses from CSV
 * Parsed from docs/Cycle 4/CSAT DB Cycle 4 Mart-tech.csv
 */
const CYCLE4_MARTECH_RESPONSES = [
  {
    phone: '918830700617',
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
    timestamp: '11/6/2025, 16:40:04',
    comment: 'Good',
  },
  {
    phone: '919953251989',
    trainingHandover: 4,
    responsiveness: 4,
    roi: 3,
    overallEffectiveness: 3,
    integration: 4,
    dataAccuracy: 4,
    teamProactivity: 4,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    innovation: 4,
    implementationQuality: 4,
    goalAlignment: 4,
    timestamp: '11/10/2025, 12:12:03',
    comment: 'Ok',
  },
];

/**
 * Normalize phone number (remove 91 prefix if needed, handle different formats)
 */
const normalizePhone = phone => {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('91') && normalized.length > 10) {
    normalized = normalized.substring(2);
  }
  return normalized;
};

/**
 * Parse timestamp string to Date
 */
const parseTimestamp = timestamp => {
  try {
    // Handle various formats: "11/3/2025, 11:27:49" or "11/17/2025, 10:26:47 AM"
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  } catch {
    return new Date();
  }
};

/**
 * Get or create Cycle 4
 */
async function getOrCreateCycle4() {
  let cycle = await Cycle.findOne({ cycleNumber: 4, year: 2025 });

  if (!cycle) {
    cycle = await Cycle.create({
      name: 'Cycle 4',
      cycleNumber: 4,
      year: 2025,
      startDate: new Date(2025, 8, 1),
      endDate: new Date(2025, 9, 31, 23, 59, 59, 999),
      status: 'active',
      isActive: true,
    });
    console.log('  ✓ Created Cycle 4 (2025)');
  } else {
    console.log('  ✓ Found existing Cycle 4 (2025)');
  }

  return cycle;
}

/**
 * Find client from ClientHistory by phone for Cycle 4
 * KEY: Uses ClientHistory instead of Client for historical accuracy
 * RETURNS: Both main IDs and history IDs for complete tracking
 */
async function findClientFromHistory(phone, cycleId) {
  const normalizedPhone = normalizePhone(phone);

  // First try to find from ClientHistory for this cycle
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
    // Also find BrandHistory for this brand and cycle
    const brandHistory = await BrandHistory.findOne({
      brandId: clientHistory.brandId._id,
      cycleId,
    });

    return {
      // Main IDs (for live/current reference)
      clientId: clientHistory.clientId._id,
      brandId: clientHistory.brandId._id,
      // History IDs (for historical snapshots)
      clientHistoryId: clientHistory._id,
      brandHistoryId: brandHistory?._id || null,
      // Display data
      clientName: clientHistory.name,
      brandName: clientHistory.brandId?.name,
    };
  }

  // Fallback to Client model (for cases where history doesn't exist yet)
  const client = await Client.findOne({
    $or: [
      { phone },
      { phone: normalizedPhone },
      { phone: { $regex: new RegExp(normalizedPhone + '$') } },
    ],
  }).populate('brandId');

  if (client) {
    // Try to find history records even if using fallback
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

/**
 * Clear all CSAT responses for Cycle 4 before re-seeding
 */
async function clearCycle4Responses(cycleId) {
  console.log('\n🗑️  Clearing existing Cycle 4 CSAT responses...');

  const result = await CSATResponse.deleteMany({ cycleId });

  console.log(
    `  ✓ Deleted ${result.deletedCount} existing responses for Cycle 4`
  );
  return result.deletedCount;
}

/**
 * Find SBU from SBUHistory for a brand in Cycle 4
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

/**
 * Seed CSAT Responses for Solutions Department - Cycle 4
 */
async function seedSolutionsResponses(cycle, solutionsDept) {
  console.log(
    '\n📊 Seeding Solutions Department CSAT Responses for Cycle 4...'
  );

  let created = 0;
  let skipped = 0;

  for (const response of CYCLE4_SOLUTIONS_RESPONSES) {
    try {
      // Find client and brand from History models (returns both main IDs and history IDs)
      const clientData = await findClientFromHistory(response.phone, cycle._id);

      if (!clientData) {
        console.log(`  ⚠ Client not found for phone: ${response.phone}`);
        skipped++;
        continue;
      }

      // Find SBU from History models (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        solutionsDept._id
      );

      // Build CSAT data (Solutions format)
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

      // Check if response already exists
      const existingResponse = await CSATResponse.findOne({
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: solutionsDept._id,
      });

      if (existingResponse) {
        console.log(
          `  ○ Response already exists for: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: solutionsDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.phone}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(
    `\n✅ Solutions responses: ${created} created, ${skipped} skipped`
  );
  return created;
}

/**
 * Seed CSAT Responses for Tech Department - Cycle 4
 */
async function seedTechResponses(cycle, techDept) {
  console.log('\n📊 Seeding Tech Department CSAT Responses for Cycle 4...');

  let created = 0;
  let skipped = 0;

  for (const response of CYCLE4_TECH_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);

      if (!clientData) {
        console.log(`  ⚠ Client not found for phone: ${response.phone}`);
        skipped++;
        continue;
      }

      // Build CSAT data (Tech format)
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

      // Check if response already exists
      const existingResponse = await CSATResponse.findOne({
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: techDept._id,
      });

      if (existingResponse) {
        console.log(
          `  ○ Response already exists for: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      // Find SBU from History models (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        techDept._id
      );

      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: techDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.phone}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`\n✅ Tech responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for SEO Department - Cycle 4
 */
async function seedSeoResponses(cycle, seoDept) {
  console.log('\n📊 Seeding SEO Department CSAT Responses for Cycle 4...');

  let created = 0;
  let skipped = 0;

  for (const response of CYCLE4_SEO_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);

      if (!clientData) {
        console.log(`  ⚠ Client not found for phone: ${response.phone}`);
        skipped++;
        continue;
      }

      // Build CSAT data (SEO format)
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

      // Check if response already exists
      const existingResponse = await CSATResponse.findOne({
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: seoDept._id,
      });

      if (existingResponse) {
        console.log(
          `  ○ Response already exists for: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      // Find SBU from History models (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        seoDept._id
      );

      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: seoDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.phone}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`\n✅ SEO responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for Media Department - Cycle 4
 */
async function seedMediaResponses(cycle, mediaDept) {
  console.log('\n📊 Seeding Media Department CSAT Responses for Cycle 4...');

  let created = 0;
  let skipped = 0;

  for (const response of CYCLE4_MEDIA_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);

      if (!clientData) {
        console.log(`  ⚠ Client not found for phone: ${response.phone}`);
        skipped++;
        continue;
      }

      // Build CSAT data (Media format)
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

      // Check if response already exists
      const existingResponse = await CSATResponse.findOne({
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: mediaDept._id,
      });

      if (existingResponse) {
        console.log(
          `  ○ Response already exists for: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      // Find SBU from History models (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        mediaDept._id
      );

      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: mediaDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.phone}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`\n✅ Media responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for Fluence Department - Cycle 4
 */
async function seedFluenceResponses(cycle, fluenceDept) {
  console.log('\n📊 Seeding Fluence Department CSAT Responses for Cycle 4...');

  let created = 0;
  let skipped = 0;

  for (const response of CYCLE4_FLUENCE_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);

      if (!clientData) {
        console.log(`  ⚠ Client not found for phone: ${response.phone}`);
        skipped++;
        continue;
      }

      // Build CSAT data (Fluence format)
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
          responsiveness: response.responsiveness,
          communication: response.communication,
          briefUnderstanding: response.briefUnderstanding,
          creatorFit: response.creatorFit,
        },
        deliveryMetrics: {
          timelineAdherence: response.timelineAdherence,
          reportingQuality: response.reportingQuality,
          roi: response.roi,
          outcomeEffectiveness: response.outcomeEffectiveness,
          teamProactivity: response.teamProactivity,
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
          `  ○ Response already exists for: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      // Find SBU from History models (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        fluenceDept._id
      );

      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: fluenceDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.phone}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`\n✅ Fluence responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for SMP Department - Cycle 4
 */
async function seedSmpResponses(cycle, smpDept) {
  console.log('\n📊 Seeding SMP Department CSAT Responses for Cycle 4...');

  let created = 0;
  let skipped = 0;

  for (const response of CYCLE4_SMP_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);

      if (!clientData) {
        console.log(`  ⚠ Client not found for phone: ${response.phone}`);
        skipped++;
        continue;
      }

      // Build CSAT data (SMP format)
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
          `  ○ Response already exists for: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      // Find SBU from History models (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        smpDept._id
      );

      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: smpDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.phone}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`\n✅ SMP responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for MarTech Department - Cycle 4
 */
async function seedMartechResponses(cycle, martechDept) {
  console.log('\n📊 Seeding MarTech Department CSAT Responses for Cycle 4...');

  let created = 0;
  let skipped = 0;

  for (const response of CYCLE4_MARTECH_RESPONSES) {
    try {
      const clientData = await findClientFromHistory(response.phone, cycle._id);

      if (!clientData) {
        console.log(`  ⚠ Client not found for phone: ${response.phone}`);
        skipped++;
        continue;
      }

      // Build CSAT data (MarTech format)
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
          `  ○ Response already exists for: ${clientData.clientName || response.phone}`
        );
        skipped++;
        continue;
      }

      // Find SBU from History models (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        clientData.brandId,
        cycle._id,
        martechDept._id
      );

      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: clientData.brandId,
        clientId: clientData.clientId,
        cycleId: cycle._id,
        departmentId: martechDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: clientData.brandHistoryId,
        clientHistoryId: clientData.clientHistoryId,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${clientData.clientName || 'Unknown'} (${normalizePhone(response.phone)})`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.phone}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`\n✅ MarTech responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Main Seed Function
 */
async function seed() {
  console.log('🌱 Starting Cycle 4 CSAT Response Seeding...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get or create Cycle 4
    console.log('📅 Setting up Cycle 4...');
    const cycle = await getOrCreateCycle4();
    console.log(`📅 Using cycle: ${cycle.name} (${cycle.year})`);

    // Get all departments
    const solutionsDept = await Department.findOne({ name: 'solutions' });
    const techDept = await Department.findOne({ name: 'tech' });
    const seoDept = await Department.findOne({ name: 'seo' });
    const mediaDept = await Department.findOne({ name: 'media' });
    const fluenceDept = await Department.findOne({ name: 'fluence' });
    const smpDept = await Department.findOne({ name: 'smp' });
    const martechDept = await Department.findOne({ name: 'martech' });

    if (!solutionsDept) {
      console.error('✗ Solutions department not found!');
      console.error('  Run: node scripts/seedDatabase.js first');
      process.exit(1);
    }

    // Clear existing Cycle 4 responses before re-seeding
    await clearCycle4Responses(cycle._id);

    // Seed Solutions responses
    const solutionsCount = await seedSolutionsResponses(cycle, solutionsDept);

    // Seed Tech responses
    let techCount = 0;
    if (techDept) {
      techCount = await seedTechResponses(cycle, techDept);
    } else {
      console.log('\n⚠ Tech department not found - skipping Tech responses');
    }

    // Seed SEO responses
    let seoCount = 0;
    if (seoDept) {
      seoCount = await seedSeoResponses(cycle, seoDept);
    } else {
      console.log('\n⚠ SEO department not found - skipping SEO responses');
    }

    // Seed Media responses
    let mediaCount = 0;
    if (mediaDept) {
      mediaCount = await seedMediaResponses(cycle, mediaDept);
    } else {
      console.log('\n⚠ Media department not found - skipping Media responses');
    }

    // Seed Fluence responses
    let fluenceCount = 0;
    if (fluenceDept) {
      fluenceCount = await seedFluenceResponses(cycle, fluenceDept);
    } else {
      console.log(
        '\n⚠ Fluence department not found - skipping Fluence responses'
      );
    }

    // Seed SMP responses
    let smpCount = 0;
    if (smpDept) {
      smpCount = await seedSmpResponses(cycle, smpDept);
    } else {
      console.log('\n⚠ SMP department not found - skipping SMP responses');
    }

    // Seed MarTech responses
    let martechCount = 0;
    if (martechDept) {
      martechCount = await seedMartechResponses(cycle, martechDept);
    } else {
      console.log(
        '\n⚠ MarTech department not found - skipping MarTech responses'
      );
    }

    console.log('\n🎉 Cycle 4 CSAT Response seeding completed successfully!');

    // Summary
    const totalResponses = await CSATResponse.countDocuments({
      cycleId: cycle._id,
    });
    const stats = await CSATResponse.getCycleStats(cycle._id);

    console.log('\n📊 Summary:');
    console.log(`   Total Responses (Cycle 4): ${totalResponses}`);
    console.log(`   Solutions Responses: ${solutionsCount}`);
    console.log(`   Tech Responses: ${techCount}`);
    console.log(`   SEO Responses: ${seoCount}`);
    console.log(`   Media Responses: ${mediaCount}`);
    console.log(`   Fluence Responses: ${fluenceCount}`);
    console.log(`   SMP Responses: ${smpCount}`);
    console.log(`   MarTech Responses: ${martechCount}`);
    console.log(`   Average CSAT: ${stats.avgCsat}`);
    console.log(`   Average NPS: ${stats.avgNps}`);
    console.log(`   Brands Covered: ${stats.brandsFilled}`);
    console.log(`   POCs Responded: ${stats.pocsFilled}`);
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
