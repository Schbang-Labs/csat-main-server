/**
 * Seed Script - CSAT Responses for Cycle 2 (Solutions, Media, Tech)
 * Populates CSAT survey responses from Cycle 2 data for 3 departments
 *
 * KEY FEATURE: Uses History models (BrandHistory, ClientHistory, SBUHistory)
 * to get brand, client, and SBU references for historical accuracy
 *
 * Run with: node scripts/cycle2/seedCycle2CSATResponses.js
 * Run AFTER: seedCycle2BrandsAndClients.js and seedCycle2SBUs.js
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
 * Cycle 2 Solutions CSAT Responses from CSV
 * Parsed from docs/Cycle2/CSAT DB Cycle 2 Solutions.csv
 */
const CYCLE2_SOLUTIONS_RESPONSES = [
  {
    phone: '919136294424',
    overallSatisfaction: 1,
    likelihoodToRecommend: 0,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 1,
    dataEffectiveness: 0,
    teamProactivity: 0,
    meetingBusinessGoals: 0,
    timestamp: '7/17/2025, 1:41:20 PM',
    comment: 'None',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919987292109',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 4,
    dataEffectiveness: 1,
    teamProactivity: 1,
    meetingBusinessGoals: 4,
    timestamp: '7/17/2025, 1:52:36 PM',
    comment:
      'Part of the team is exceptionally good with their job. Part of the team are not much of a value add.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '918299775274',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 2,
    teamResponsiveness: 2,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '7/17/2025, 1:54:59 PM',
    comment: 'This feedback is for Schbang Bangalore team.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '918007415155',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 2,
    meetingBusinessGoals: 4,
    timestamp: '7/18/2025, 1:44:14 AM',
    comment:
      'Extremely frequent team changes at Schbang over the past 2 years. Keeps taking the working collab to square 1 every time there is a change which also doesnt lead to efficient knowledge transfer, High training period affecting the output and TAT for the projects. Schbang team needs to find that stability very soon',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '918291016806',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '7/21/2025, 12:20:37 PM',
    comment: 'We are ok with Schbang',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919769900469',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 2,
    teamResponsiveness: 3,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 1,
    timestamp: '7/21/2025, 12:36:54 PM',
    comment: 'Team needs to take an initiative and be proactive',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '917588951823',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '7/21/2025, 12:43:17 PM',
    comment: 'NA',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919664452750',
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '7/21/2025, 1:47:45 PM',
    comment: 'Great wirk',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919833202153',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 1,
    teamResponsiveness: 1,
    brandUnderstanding: 2,
    dataEffectiveness: 1,
    teamProactivity: 0,
    meetingBusinessGoals: 2,
    timestamp: '7/21/2025, 1:57:56 PM',
    comment:
      'Need to improve quality of content and time taken to create content final outcome taking years team doing the mistake again and again despite telling them not to repeat example celio logo in Instagram post told them to remove but in next creative again added caption shared by the team no brainer ai generated no human efforts to define or describe the product sometimes there is no connection of caption with content no creativity at all',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '918130370322',
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
    timestamp: '7/21/2025, 1:59:44 PM',
    comment: 'NA',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919833779503',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '7/21/2025, 2:06:10 PM',
    comment: 'NA',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '918879949141',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 5,
    dataEffectiveness: 5,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '7/21/2025, 2:47:09 PM',
    comment: '.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
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
    timestamp: '7/21/2025, 3:25:17 PM',
    comment: 'Na',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919535102511',
    overallSatisfaction: 2,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 2,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 0,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '7/22/2025, 5:26:51 AM',
    comment: "Data effectiveness - we haven't really started on this.",
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919705311188',
    overallSatisfaction: 5,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 5,
    meetingBusinessGoals: 5,
    timestamp: '7/22/2025, 8:45:21 AM',
    comment: '.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919920697652',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 5,
    dataEffectiveness: 4,
    teamProactivity: 3,
    meetingBusinessGoals: 4,
    timestamp: '7/22/2025, 10:31:32 AM',
    comment:
      'Good and Responsive team, Big Shoutout to Tanmay, Sakshi and Rudranngshu for powering through',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
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
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '7/22/2025, 11:28:24 AM',
    comment: 'Good thought leadership',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919987298210',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '7/22/2025, 11:33:20 AM',
    comment: 'Same as last month - we need to crack B2C UGC',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919769945757',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '7/22/2025, 11:36:43 AM',
    comment: '-',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919731633299',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 5,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 2,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '7/22/2025, 11:45:32 AM',
    comment:
      "Good work done overall by Schbang. The team's are highly dynamic though, so I worry that consistency of brand is not maintained",
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
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
    timestamp: '7/22/2025, 11:52:31 AM',
    comment: 'Great',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919769171848',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 1,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 1,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '7/22/2025, 12:05:47 PM',
    comment: '.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '917045696914',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '7/22/2025, 1:00:15 PM',
    comment: '.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
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
    timestamp: '7/22/2025, 1:53:56 PM',
    comment: 'NA',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919833393092',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 2,
    teamResponsiveness: 2,
    brandUnderstanding: 1,
    dataEffectiveness: 3,
    teamProactivity: 5,
    meetingBusinessGoals: 5,
    timestamp: '7/22/2025, 1:54:13 PM',
    comment: 'The team missed out on World Ice Cream Day brief',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919663855927',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 3,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '7/22/2025, 1:55:53 PM',
    comment: 'Good',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919930734180',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '7/22/2025, 1:59:15 PM',
    comment: 'Need more data backed strategy. Day to Day work is fine.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919958782197',
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
    timestamp: '7/22/2025, 2:06:22 PM',
    comment: 'Na',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '918130778113',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 4,
    timestamp: '7/22/2025, 2:45:35 PM',
    comment: 'Na',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
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
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 4,
    timestamp: '7/22/2025, 2:47:23 PM',
    comment:
      'Special commendation for Khushi Dassani and Harshita Jaswani for the way they front the account for TCPL',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '918879972041',
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 4,
    teamResponsiveness: 5,
    brandUnderstanding: 4,
    dataEffectiveness: 2,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '7/22/2025, 6:23:54 PM',
    comment:
      "They're getting in the groove and should be able to deliver quality consistently and with higher effectiveness soon",
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919560458255',
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 1,
    teamResponsiveness: 3,
    brandUnderstanding: 2,
    dataEffectiveness: 1,
    teamProactivity: 0,
    meetingBusinessGoals: 0,
    timestamp: '7/23/2025, 4:55:02 AM',
    comment:
      'Need more business imapct generating ideas. While we have progressed over the past few months but there is huge scope of improvement',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919619771168',
    overallSatisfaction: 1,
    likelihoodToRecommend: 0,
    northStarMetrics: 0,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 0,
    teamResponsiveness: 2,
    brandUnderstanding: 2,
    dataEffectiveness: 1,
    teamProactivity: 1,
    meetingBusinessGoals: 1,
    timestamp: '7/24/2025, 4:06:35 PM',
    comment: 'Multiple connects have happened already',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919892154181',
    overallSatisfaction: 1,
    likelihoodToRecommend: 1,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 1,
    teamResponsiveness: 1,
    brandUnderstanding: 0,
    dataEffectiveness: 0,
    teamProactivity: 2,
    meetingBusinessGoals: 1,
    timestamp: '7/24/2025, 4:34:24 PM',
    comment:
      'The team is very slow and very laid back. They need minimum 2 brefing calls to understand the brief. There is no proactiveness at all. There is nonsense of responsibility or urgency of closing things on time. The team is still struggling to understand the business. We are so stuck with bau and hygiene that we have not done anything big or significant. For recent tentpole sale event its even bigger dissaster. My team eventually had to give concepts and copy to team for 5 days. They had to just deisgn it. That also is not close in time. 1 post per day they cant . There is no senior involvement.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919974408808',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 4,
    meetingBusinessGoals: 3,
    timestamp: '7/26/2025, 10:47:15 AM',
    comment:
      "Some areas where attention is needed. At time's-brand tonality for premium luxury verticals is not reflected in the output of creatives. We have also observed ocassiinal lapses in orm responses on linkedin and instagram. Additionally execution pften falls short of the reference quality shared by the solution team.",
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919818536586',
    overallSatisfaction: 0,
    likelihoodToRecommend: 0,
    northStarMetrics: 0,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 0,
    teamResponsiveness: 2,
    brandUnderstanding: 0,
    dataEffectiveness: 0,
    teamProactivity: 5,
    meetingBusinessGoals: 0,
    timestamp: '7/26/2025, 11:21:23 AM',
    comment: 'Needs improvement',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919014000253',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 1,
    seniorLeadershipInvolvement: 3,
    strategyExecution: 2,
    teamResponsiveness: 2,
    brandUnderstanding: 2,
    dataEffectiveness: 2,
    teamProactivity: 2,
    meetingBusinessGoals: 0,
    timestamp: '7/26/2025, 11:31:51 AM',
    comment:
      "We are currently not working proactively on ideas and campaigns inspite of calendars being shared much earlier. Also copywriters arenot good. I have been asking for IPs for a very very long time but haven't got even one from the team. Its our ideas only which if we dont give to the team, the team wont develop then. Its a very reactive function inspite of being with us for 5 yrs. And there is no organic growth plan. Have more but can't write all of it.",
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919619065981',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    northStarMetrics: 3,
    seniorLeadershipInvolvement: 2,
    strategyExecution: 3,
    teamResponsiveness: 2,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 2,
    meetingBusinessGoals: 3,
    timestamp: '7/26/2025, 11:56:19 AM',
    comment:
      'I think the senior strategy guys needs to be involved a lot more for the brand ro see its vision.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919594027908',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    northStarMetrics: 2,
    seniorLeadershipInvolvement: 1,
    strategyExecution: 2,
    teamResponsiveness: 4,
    brandUnderstanding: 2,
    dataEffectiveness: 3,
    teamProactivity: 2,
    meetingBusinessGoals: 3,
    timestamp: '7/26/2025, 12:03:14 PM',
    comment: '.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919811665895',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 3,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '7/26/2025, 12:13:02 PM',
    comment:
      'Account reps are too inexperienced. Need more experienced people to work on account.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919820807710',
    overallSatisfaction: 4,
    likelihoodToRecommend: 5,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 4,
    strategyExecution: 4,
    teamResponsiveness: 4,
    brandUnderstanding: 5,
    dataEffectiveness: 3,
    teamProactivity: 3,
    meetingBusinessGoals: 4,
    timestamp: '7/26/2025, 12:28:01 PM',
    comment: 'Good',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '917506075920',
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
    timestamp: '7/26/2025, 3:37:24 PM',
    comment:
      'Suggest more involvement of Senior Leadership to increase communication effectiveness and better achievement of brand and business goals.',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '916360830441',
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
    timestamp: '7/28/2025, 5:08:51 AM',
    comment:
      "The team has done a great job so far and we've been able to grow the reach and followers. Engagement as a metric is skmwtbing that we should be working on and also have better alignment with the campaigns running paralelly on other mediums.",
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '917099035215',
    overallSatisfaction: 4,
    likelihoodToRecommend: 3,
    northStarMetrics: 0,
    seniorLeadershipInvolvement: 0,
    strategyExecution: 3,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 4,
    teamProactivity: 5,
    meetingBusinessGoals: 3,
    timestamp: '7/29/2025, 4:14:45 PM',
    comment:
      "The attrition rate is too highby the time someone begins to truly understand the brand and how we operate, they're already preparing to leave. That makes it difficult to build consistency and long-term value",
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '919870317808',
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
    timestamp: '8/8/2025, 03:35:20',
    comment:
      'While the new editorial persona has been crcrafted well its still not been seamlessly integrated into our day to day content. Need to set monthly kpis which are to be worked towards together as a team',
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
  {
    phone: '9163153264',
    overallSatisfaction: 2,
    likelihoodToRecommend: 4,
    northStarMetrics: 4,
    seniorLeadershipInvolvement: 5,
    strategyExecution: 2,
    teamResponsiveness: 4,
    brandUnderstanding: 4,
    dataEffectiveness: 0,
    teamProactivity: 3,
    meetingBusinessGoals: 3,
    timestamp: '',
    comment: "Data effectiveness - we haven't really started on this",
    qualityOfDesignVideo: 0,
    qualityOfIdeas: 0,
  },
];

/**
 * Cycle 2 Media CSAT Responses from CSV
 * Parsed from docs/Cycle2/CSAT DB Cycle 2 Media.csv
 */
const CYCLE2_MEDIA_RESPONSES = [
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
    timestamp: '7/14/2025, 3:35:18 PM',
    comment: 'Keep up the great work',
  },
  {
    phone: '919004595090',
    overallSatisfaction: 2,
    likelihoodToRecommend: 2,
    strategyAlignment: 2,
    teamProactivity: 3,
    creativeRefreshment: 2,
    teamCollaboration: 1,
    optimizationEffectiveness: 2,
    timelyExecution: 3,
    teamTransparency: 2,
    feedbackResponse: 3,
    overallEffectiveness: 2,
    timestamp: '7/14/2025, 3:35:18 PM',
    comment:
      'Weve noticed some gaps and see significant room for improvement. We seek much better strategic value from this partnership.',
  },
  {
    phone: '919167712818',
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    strategyAlignment: 4,
    teamProactivity: 3,
    creativeRefreshment: 3,
    teamCollaboration: 3,
    optimizationEffectiveness: 4,
    timelyExecution: 5,
    teamTransparency: 4,
    feedbackResponse: 4,
    overallEffectiveness: 4,
    timestamp: '7/14/2025, 3:35:52 PM',
    comment: 'Na',
  },
  {
    phone: '918655077233',
    overallSatisfaction: 5,
    likelihoodToRecommend: 4,
    strategyAlignment: 5,
    teamProactivity: 4,
    creativeRefreshment: 4,
    teamCollaboration: 5,
    optimizationEffectiveness: 5,
    timelyExecution: 5,
    teamTransparency: 3,
    feedbackResponse: 5,
    overallEffectiveness: 5,
    timestamp: '7/16/2025, 8:00:00 AM',
    comment: 'Overall good',
  },
  {
    phone: '919582798405',
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
    timestamp: '7/16/2025, 1:43:52 PM',
    comment: 'Good',
  },
  {
    phone: '918511356222',
    overallSatisfaction: 3,
    likelihoodToRecommend: 2,
    strategyAlignment: 4,
    teamProactivity: 3,
    creativeRefreshment: 0,
    teamCollaboration: 0,
    optimizationEffectiveness: 3,
    timelyExecution: 3,
    teamTransparency: 3,
    feedbackResponse: 3,
    overallEffectiveness: 1,
    timestamp: '7/16/2025, 1:46:20 PM',
    comment:
      "Need to overhaul the media team, they are not in sync with what will work best for us. We get a sense that their job is only to create a media plan. They take or appear to take no interest in what asset to promote for what campaign. Either the creative doesn't know how create asset that works for performance marketing or they are not shared the right brief by the media team.",
  },
  {
    phone: '919987292109',
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
    timestamp: '7/16/2025, 1:50:54 PM',
    comment:
      "Working with Pushpak, Pratiksha and Kirk has been great. They're constantly pushing for proactive and innovative media solutions.",
  },
  {
    phone: '917350016051',
    overallSatisfaction: 5,
    likelihoodToRecommend: 3,
    strategyAlignment: 4,
    teamProactivity: 5,
    creativeRefreshment: 3,
    teamCollaboration: 5,
    optimizationEffectiveness: 5,
    timelyExecution: 4,
    teamTransparency: 5,
    feedbackResponse: 5,
    overallEffectiveness: 5,
    timestamp: '7/16/2025, 2:39:58 PM',
    comment: 'Media execution is good',
  },
];

/**
 * Cycle 2 Tech CSAT Responses from CSV
 * Parsed from docs/Cycle2/CSAT DB Cycle 2 Tech.csv
 */
const CYCLE2_TECH_RESPONSES = [
  {
    phone: '919816109765',
    uiuxSatisfaction: 3,
    timelyExecution: 0,
    technicalSupport: 0,
    teamTransparency: 0,
    teamCollaboration: 1,
    feedbackResponse: 0,
    overallSatisfaction: 0,
    businessAlignment: 0,
    overallEffectiveness: 0,
    teamProactivity: 0,
    systemIntegration: 0,
    likelihoodToRecommend: 0,
    timestamp: '7/14/2025, 3:34:55 PM',
    comment:
      'Lack of transperancy, skills, alignment to project goals. The design team is doing a good work. Project management is a mess.',
  },
  {
    phone: '917208232369',
    uiuxSatisfaction: 3,
    timelyExecution: 3,
    technicalSupport: 4,
    teamTransparency: 4,
    teamCollaboration: 4,
    feedbackResponse: 3,
    overallSatisfaction: 5,
    businessAlignment: 5,
    overallEffectiveness: 4,
    teamProactivity: 3,
    systemIntegration: 5,
    likelihoodToRecommend: 5,
    timestamp: '7/14/2025, 4:13:22 PM',
    comment: 'All good',
  },
  {
    phone: '919136569305',
    uiuxSatisfaction: 3,
    timelyExecution: 3,
    technicalSupport: 3,
    teamTransparency: 4,
    teamCollaboration: 4,
    feedbackResponse: 4,
    overallSatisfaction: 4,
    businessAlignment: 3,
    overallEffectiveness: 4,
    teamProactivity: 2,
    systemIntegration: 3,
    likelihoodToRecommend: 4,
    timestamp: '7/16/2025, 6:36:40 AM',
    comment: 'None',
  },
];

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

async function getOrCreateCycle2() {
  let cycle = await Cycle.findOne({ cycleNumber: 2, year: 2025 });
  if (!cycle) {
    cycle = await Cycle.create({
      name: 'Cycle 2',
      cycleNumber: 2,
      year: 2025,
      startDate: new Date(2025, 2, 1),
      endDate: new Date(2025, 4, 31, 23, 59, 59, 999),
      status: 'completed',
      isActive: false,
    });
    console.log('  ✓ Created Cycle 2 (2025)');
  } else {
    console.log('  ✓ Found existing Cycle 2 (2025)');
  }
  return cycle;
}

/**
 * Find client from ClientHistory by phone number
 * KEY: Uses ClientHistory to get the associated brandId for historical accuracy
 */
async function findClientFromHistory(phone, cycleId) {
  const normalizedPhone = normalizePhone(phone);

  // Method 1: Search ClientHistory directly
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

  // Method 2: Fallback to Client model
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

async function clearCycle2Responses(cycleId, departmentId) {
  console.log(
    '\n🗑️  Clearing existing Cycle 2 CSAT responses for department...'
  );
  const result = await CSATResponse.deleteMany({ cycleId, departmentId });
  console.log(`  ✓ Deleted ${result.deletedCount} existing responses`);
  return result.deletedCount;
}

/**
 * Find SBU from SBUHistory for a brand in Cycle 2
 * KEY: Uses SBUHistory instead of SBU for historical accuracy
 * IMPROVED: Filters by departmentId to ensure correct department-specific SBU lookup
 */
async function findSBUFromHistory(brandId, cycleId, departmentId) {
  const brand = await Brand.findById(brandId);
  const brandName = brand?.name || '';
  const department = await Department.findById(departmentId);
  const deptName = department?.name || '';

  // Method 1: Check SBUHistory.brands array
  const sbuHistoryWithBrand = await SBUHistory.findOne({
    cycleId,
    departmentId,
    brands: brandId,
  });

  if (sbuHistoryWithBrand) {
    return {
      sbuId: sbuHistoryWithBrand.sbuId,
      sbuHistoryId: sbuHistoryWithBrand._id,
    };
  }

  // Method 2: Check BrandHistory for service mapping
  const brandHistory = await BrandHistory.findOne({ brandId, cycleId });

  if (brandHistory && brandHistory.services) {
    const deptService = brandHistory.services.find(
      s => s.department === deptName && s.sbuId
    );

    if (deptService && deptService.sbuId) {
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

  // Method 3: Check current SBU model
  const sbuWithBrand = await SBU.findOne({
    departmentId,
    brands: brandId,
    isActive: true,
  });

  if (sbuWithBrand) {
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

  // Method 4: Fuzzy match by brand name
  if (brandName) {
    const normalizedBrandName = brandName.toLowerCase().trim();
    const allSbuHistories = await SBUHistory.find({
      cycleId,
      departmentId,
    }).populate('sbuId');

    for (const sbuHistory of allSbuHistories) {
      if (sbuHistory.brands && sbuHistory.brands.length > 0) {
        const sbuBrands = await Brand.find({ _id: { $in: sbuHistory.brands } });

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

  return { sbuId: null, sbuHistoryId: null };
}

/**
 * Seed CSAT Responses for Solutions Department - Cycle 2
 */
async function seedSolutionsResponses(cycle, solutionsDept) {
  console.log(
    '\n📊 Seeding Solutions Department CSAT Responses for Cycle 2...'
  );
  let created = 0,
    skipped = 0;

  for (const response of CYCLE2_SOLUTIONS_RESPONSES) {
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
 * Seed CSAT Responses for Media Department - Cycle 2
 */
async function seedMediaResponses(cycle, mediaDept) {
  console.log('\n📊 Seeding Media Department CSAT Responses for Cycle 2...');
  let created = 0,
    skipped = 0;

  for (const response of CYCLE2_MEDIA_RESPONSES) {
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
 * Seed CSAT Responses for Tech Department - Cycle 2
 */
async function seedTechResponses(cycle, techDept) {
  console.log('\n📊 Seeding Tech Department CSAT Responses for Cycle 2...');
  let created = 0,
    skipped = 0;

  for (const response of CYCLE2_TECH_RESPONSES) {
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

async function seed() {
  console.log(
    '🌱 Starting Cycle 2 CSAT Response Seeding (Solutions, Media, Tech)...\n'
  );
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📅 Setting up Cycle 2...');
    const cycle = await getOrCreateCycle2();

    // Get all departments
    const solutionsDept = await Department.findOne({ name: 'solutions' });
    const mediaDept = await Department.findOne({ name: 'media' });
    const techDept = await Department.findOne({ name: 'tech' });

    if (!solutionsDept) {
      console.error('✗ Solutions department not found!');
      process.exit(1);
    }

    // Clear existing responses for each department
    await clearCycle2Responses(cycle._id, solutionsDept._id);
    if (mediaDept) await clearCycle2Responses(cycle._id, mediaDept._id);
    if (techDept) await clearCycle2Responses(cycle._id, techDept._id);

    // Seed Solutions responses
    const solutionsCount = await seedSolutionsResponses(cycle, solutionsDept);

    // Seed Media responses
    let mediaCount = 0;
    if (mediaDept) {
      mediaCount = await seedMediaResponses(cycle, mediaDept);
    } else {
      console.log('\n⚠ Media department not found - skipping');
    }

    // Seed Tech responses
    let techCount = 0;
    if (techDept) {
      techCount = await seedTechResponses(cycle, techDept);
    } else {
      console.log('\n⚠ Tech department not found - skipping');
    }

    console.log('\n🎉 Cycle 2 CSAT Response seeding completed successfully!');

    // Summary
    const totalResponses = await CSATResponse.countDocuments({
      cycleId: cycle._id,
    });

    console.log('\n📊 Summary:');
    console.log(`   Total Responses for Cycle 2: ${totalResponses}`);
    console.log(`   Solutions Responses: ${solutionsCount}`);
    console.log(`   Media Responses: ${mediaCount}`);
    console.log(`   Tech Responses: ${techCount}`);
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
