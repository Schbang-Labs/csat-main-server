/**
 * Seed Script - CSAT Responses for Cycle 5
 * Populates CSAT survey responses from Cycle 5 data
 *
 * Run with: node scripts/cycle5/seedCSATResponses.js
 * Run AFTER: all other seed scripts (departments, brands, clients, SBUs, cycles)
 *
 * NOTE: This is historical data migration - we store both main IDs and history IDs
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
 * Brand Solutions Department Survey Responses
 * From CSAT_DB_v2_Cycle_5_Data.md
 */
const SOLUTIONS_RESPONSES = [
  {
    brand: 'iQOO',
    pocName: 'Rashi Anthony',
    phone: '9910879402',
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
    timestamp: '12/16/2025, 11:02:00 AM',
    comment:
      'The team is totally new, they are getting to know the brand better. Available for calls. The delivery has improved. Good response from the team.',
  },
  {
    brand: 'Ample Group',
    pocName: 'Nabeel Ahmed',
    phone: '8792488536',
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
    timestamp: '12/16/2025, 11:16:00 AM',
    comment:
      'No comments. Its been a while since Schbang has been working on the Imagine account. But I feel like that we are making no progress.',
  },
  {
    brand: 'Castrol POWER1',
    pocName: 'Radhika Gokhale',
    phone: '8879689407',
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
    timestamp: '12/16/2025, 11:38:12 AM',
    comment: 'Goos',
  },
  {
    brand: 'Britannia',
    pocName: 'Shree Das',
    phone: '9718294118',
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
    timestamp: '12/16/2025, 11:44:35 AM',
    comment: '',
  },
  {
    brand: 'ITC Limited Corporate',
    pocName: 'Aurko Dasgupta',
    phone: '9831317083',
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
    timestamp: '12/17/2025, 7:01:56 AM',
    comment: 'Ample scope for improvement.',
  },
  {
    brand: 'Gyproc',
    pocName: 'Divyesh Panchal',
    phone: '9819123198',
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
    timestamp: '12/17/2025, 7:04:35 AM',
    comment: 'Na',
  },
  {
    brand: 'HDFC Life',
    pocName: 'Ria Das',
    phone: '7045301998',
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
    timestamp: '12/17/2025, 9:43:12 AM',
    comment:
      'In sync with creative goals. Ideas and thoughts Need to be corroborated with more robust insights.',
  },
  {
    brand: 'Medimix',
    pocName: 'Siddhartha',
    phone: '9953606758',
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
    timestamp: '12/17/2025, 10:24:22 AM',
    comment: 'Overall ok',
  },
  {
    brand: 'Medimix',
    pocName: 'Pooja Suchak',
    phone: '8976075027',
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
    timestamp: '12/17/2025, 10:46:44 AM',
    comment:
      "Overall, the score stands at 3.5/5. We've observed the team's eagerness to improve, learn, and take a solution-oriented approach, which is encouraging.",
  },
  {
    brand: 'Castrol POWER1',
    pocName: 'Gaurav Khatri',
    phone: '9130098805',
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
    timestamp: '12/17/2025, 12:39:19 PM',
    comment: 'Good team to work with',
  },
  {
    brand: "Kiehl's",
    pocName: 'Avanee Parulekar',
    phone: '9920242841',
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
    timestamp: '12/17/2025, 1:20:06 PM',
    comment: 'The turnaround has been so amazing!!',
  },
  {
    brand: 'HDFC Bank',
    pocName: 'Akhil',
    phone: '9987564471',
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
    timestamp: '12/17/2025, 4:09:15 PM',
    comment:
      'Team needs to be more proactive in sharing new ideas, concepts, formats. Lack of brand understanding is still there, need to work collectively to resolve this.',
  },
  {
    brand: 'IIFL',
    pocName: 'Mritunjay Bisht',
    phone: '9867528257',
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
    timestamp: '12/18/2025, 9:02:35 AM',
    comment: 'NO comments',
  },
  {
    brand: 'Riot Games - Valorant',
    pocName: 'Harsh Sinha',
    phone: '8879949141',
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
    timestamp: '12/18/2025, 9:02:47 AM',
    comment: '.',
  },
  {
    brand: 'Riot Games - Valorant',
    pocName: 'Anushka Bhatnagar',
    phone: '8959178078',
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
    timestamp: '12/18/2025, 9:03:19 AM',
    comment: '',
  },
  {
    brand: 'Flair Pens',
    pocName: 'Chirag Koli',
    phone: '9769900469',
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
    timestamp: '12/18/2025, 9:03:39 AM',
    comment: 'Need to work more on content and campaign organic than paid',
  },
  {
    brand: 'HDFC Bank',
    pocName: 'Dipti Nadkarni',
    phone: '9819661191',
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
    timestamp: '12/18/2025, 9:04:17 AM',
    comment:
      'Still lacks senior leadership, analytics and data led approach. Team is good with smaller daily task and execution work.',
  },
  {
    brand: 'Milton',
    pocName: 'Priyanka Datta',
    phone: '8130778113',
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
    timestamp: '12/18/2025, 9:06:52 AM',
    comment: 'Nq',
  },
  {
    brand: 'ITC HR',
    pocName: 'Dhrthi Bhatt',
    phone: '9444341510',
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
    timestamp: '12/18/2025, 10:29:25 AM',
    comment:
      'Improvement is visible. Reva is proactive and works well with feedback',
  },
  {
    brand: 'Metro',
    pocName: 'Harsh Shah',
    phone: '9833345457',
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
    timestamp: '12/18/2025, 11:17:37 AM',
    comment:
      'Data alignment with creatives is a miss. Decent ideas which never translate into good execution.',
  },
  {
    brand: 'Safari Genie',
    pocName: 'Shishir Kumar',
    phone: '9588616839',
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
    timestamp: '12/18/2025, 12:40:16 PM',
    comment: 'Na',
  },
  {
    brand: 'Huggies',
    pocName: 'Pratik',
    phone: '9953948545',
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
    timestamp: '12/18/2025, 2:37:15 PM',
    comment: 'Execution on influencer campaign is just beyond explanation',
  },
  {
    brand: 'Celio',
    pocName: 'Rafiq Shaikh',
    phone: '9833202153',
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
    timestamp: '12/18/2025, 5:08:42 PM',
    comment:
      'Team, all Instagram posts for Celio must be planned in advance and scheduled for 6 PM without exception.',
  },
  {
    brand: 'Celio',
    pocName: 'Rejoy Rajan',
    phone: '9686188441',
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
    timestamp: '12/19/2025, 6:48:19 AM',
    comment: 'Loads to do before we go. . .',
  },
  {
    brand: 'CRIF High Mark',
    pocName: 'Garima Singh',
    phone: '9819037898',
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
    timestamp: '12/19/2025, 7:12:52 AM',
    comment: 'Attention to detail is required',
  },
  {
    brand: 'Mahindra Rise',
    pocName: 'Shilpi Dubey Pathak',
    phone: '9004082459',
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
    timestamp: '12/19/2025, 8:19:34 AM',
    comment: 'Quality of work can improve a lot',
  },
  {
    brand: 'Mahindra Rise',
    pocName: 'Avantika',
    phone: '9833779503',
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
    timestamp: '12/19/2025, 8:20:30 AM',
    comment: '',
  },
  {
    brand: 'HDFC Bank',
    pocName: 'Alisha',
    phone: '9769171848',
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
    timestamp: '12/19/2025, 11:38:10 AM',
    comment: '.',
  },
  {
    brand: 'Greencell NueGo',
    pocName: 'Vishal Gundetty',
    phone: '9920697652',
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
    timestamp: '12/19/2025, 12:51:28 PM',
    comment:
      'Good work by Tanmay More, Manan Gala, Rudrangshu Tripathy and all the designers and creative team',
  },
  {
    brand: 'CRIF High Mark',
    pocName: 'Greeshma Nachane',
    phone: '9920959673',
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
    timestamp: '12/19/2025, 5:44:29 PM',
    comment:
      'Few new team members need to understand the brand and products well.',
  },
  {
    brand: 'Aditya Birla Novel',
    pocName: 'Delzeen Damania',
    phone: '9321539567',
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
    timestamp: '12/20/2025, 2:59:19 AM',
    comment:
      'The team struggles to adhere to timelines committed. There is lack of innovation and fresh content.',
  },
  {
    brand: 'Simpolo',
    pocName: 'Nilotpal Chakraborty',
    phone: '9974408808',
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
    timestamp: '12/20/2025, 6:08:09 AM',
    comment:
      'I feel solutions team now is not that concerns about bau social ideas.',
  },
  {
    brand: 'Gyproc',
    pocName: 'Ankur Bali',
    phone: '9833999165',
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
    timestamp: '12/22/2025, 7:03:26 AM',
    comment: '',
  },
  {
    brand: 'Dominos',
    pocName: 'Surabhi Prasoon',
    phone: '8299775274',
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
    timestamp: '12/22/2025, 10:34:38 AM',
    comment: '',
  },
  {
    brand: 'UltraTech Cement',
    pocName: 'Kanupriya Didwaniya',
    phone: '9967717670',
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
    timestamp: '12/22/2025, 1:40:02 PM',
    comment: 'We need to align better',
  },
  {
    brand: 'Cavin Kare',
    pocName: 'Akashivan Suresh',
    phone: '9791052222',
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
    timestamp: '12/22/2025, 1:50:38 PM',
    comment: 'All good',
  },
  {
    brand: 'Encore',
    pocName: 'Sachin Vishwakarma',
    phone: '9870559269',
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
    timestamp: '12/23/2025, 3:57:47 AM',
    comment: 'All the best',
  },
  {
    brand: "L'oreal Professionnel",
    pocName: 'Shreya Mohan',
    phone: '9620991342',
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
    timestamp: '12/23/2025, 4:54:36 AM',
    comment:
      'Have had a pleasant time working with the team. Would really give a shout out to Neha Bedse who has really understood what LPro Needs v quickly.',
  },
  {
    brand: "L'oreal Redken",
    pocName: 'Vidhi Dhruv',
    phone: '9619714546',
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
    timestamp: '12/23/2025, 6:26:15 AM',
    comment:
      "Happy with the teams commitment to tasks- be it big or small. More collaboration required on creative for brand- that's something we need to work on as well.",
  },
  {
    brand: 'Simpolo',
    pocName: 'Deep Aghara',
    phone: '8511356222',
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
    timestamp: '12/23/2025, 7:43:26 AM',
    comment: 'Better performance then before',
  },
  {
    brand: 'Oriana',
    pocName: 'Rajagopalan M',
    phone: '7904206683',
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
    timestamp: '12/23/2025, 9:03:04 AM',
    comment: 'Overall Good',
  },
  {
    brand: 'Kerastase',
    pocName: 'Smridhi Kapur',
    phone: '8368979592',
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
    timestamp: '12/24/2025, 4:36:56 AM',
    comment: 'Na',
  },
  {
    brand: 'Lancome',
    pocName: 'Divya Kalra',
    phone: '9711862718',
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
    timestamp: '12/24/2025, 9:03:36 AM',
    comment:
      'team is very high on responsiveness and pro active with a great positive attitude.',
  },
  {
    brand: 'Optimum Nutrition + Isopure',
    pocName: 'Amit Midha',
    phone: '9999371335',
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
    timestamp: '12/29/2025, 9:12:02 AM',
    comment:
      'Team needs to pull up their performance on creative execution. Senior resources involvement is limited. Only junior client servicing people are responsive.',
  },
  {
    brand: 'Amazon SEA',
    pocName: 'Michelle Chua',
    phone: '1111111111',
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
    timestamp: '12/17/2025, 3:52:00 PM',
    comment:
      'Deepesh has been a strong and reliable support system for our business, consistently demonstrating high ownership and accountability.',
  },
  {
    brand: 'Amazon FUSE',
    pocName: 'Alejandra Hurtado',
    phone: '2222222222',
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
    timestamp: '12/17/2025, 4:01:00 PM',
    comment: 'Na',
  },
];

/**
 * Media Department Survey Responses
 */
const MEDIA_RESPONSES = [
  {
    brand: 'ACCA',
    pocName: 'Saahil Kalvani',
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
    timestamp: '12/16/2025, 11:15:17 AM',
    comment: 'Najuka and her team are doing a fantastic job. Thanks',
  },
  {
    brand: 'Hobby Ideas',
    pocName: 'Jay Desai',
    phone: '918600801263',
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
    timestamp: '12/17/2025, 7:02:41 AM',
    comment: 'Need more proactive inputs from the team.',
  },
  {
    brand: 'Medimix',
    pocName: 'Pooja Suchak',
    phone: '918976075027',
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
    timestamp: '12/17/2025, 10:51:08 AM',
    comment:
      'There is a need for the media team to take greater ownership of their responsibilities.',
  },
  {
    brand: 'Metro',
    pocName: 'Harsh Shah',
    phone: '919833345457',
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
    timestamp: '12/18/2025, 11:18:31 AM',
    comment: 'NA',
  },
  {
    brand: 'Groviva',
    pocName: 'Anjali Pawar',
    phone: '917972446697',
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
    timestamp: '12/18/2025, 2:49:47 PM',
    comment: 'O',
  },
  {
    brand: 'Mahindra Rise',
    pocName: 'Avantika',
    phone: '919833779503',
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
    timestamp: '12/19/2025, 8:21:31 AM',
    comment: 'NA',
  },
  {
    brand: 'Simpolo',
    pocName: 'Nilotpal Chakraborty',
    phone: '919974408808',
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
    timestamp: '12/20/2025, 6:18:11 AM',
    comment:
      'Optimisation is not taken properly and I dont believe just to burn money.',
  },
  {
    brand: 'Kosmoderma',
    pocName: 'Albin',
    phone: '919980202719',
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
    timestamp: '1/7/2026, 12:29:07 PM',
    comment:
      "We are very happy with Schbang's performance marketing efforts. The team demonstrated a strong understanding of our business objectives.",
  },
];

/**
 * Tech Department Survey Responses
 */
const TECH_RESPONSES = [
  {
    brand: 'Sriram Life Insurance',
    phone: '919930577107',
    uiuxSatisfaction: 2,
    timelyExecution: 2,
    technicalSupport: 3,
    teamTransparency: 3,
    teamCollaboration: 3,
    feedbackResponse: 3,
    overallSatisfaction: 3,
    businessAlignment: 3,
    overallEffectiveness: 3,
    teamProactivity: 3,
    systemIntegration: 3,
    likelihoodToRecommend: 3,
    timestamp: '12/17/2025, 11:29:05 PM',
    comment: 'Need solutioning approach to our needs for better CX',
  },
  {
    brand: 'Brookfield',
    phone: '919833993177',
    uiuxSatisfaction: 4,
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
    timestamp: '12/26/2025, 8:14:26 AM',
    comment: 'Schbang team is great at their work',
  },
];

/**
 * SEO Department Survey Responses
 */
const SEO_RESPONSES = [
  {
    brand: 'Jockey',
    phone: '919980222061',
    transparency: 1,
    timelyDelivery: 1,
    overallEffectiveness: 1,
    feedbackResponse: 1,
    businessImpact: 1,
    teamProactivity: 1,
    strategyAlignment: 3,
    seoImpact: 0,
    overallSatisfaction: 1,
    likelihoodToRecommend: 1,
    contentQuality: 1,
    timestamp: '12/16/2025, 11:01:53 AM',
    comment: 'There are lot of gaps',
  },
  {
    brand: 'Sriram Life Insurance',
    phone: '919930577107',
    transparency: 4,
    timelyDelivery: 4,
    overallEffectiveness: 3,
    feedbackResponse: 4,
    businessImpact: 4,
    teamProactivity: 4,
    strategyAlignment: 4,
    seoImpact: 4,
    overallSatisfaction: 4,
    likelihoodToRecommend: 4,
    contentQuality: 4,
    timestamp: '12/17/2025, 10:16:51 PM',
    comment:
      'Last month the team has shown good traction in driving organic growth. The team needs to stay focused to sustain this growth ahead. CRO needs to start delivering.',
  },
  {
    brand: '5 Paisa',
    phone: '919892058033',
    transparency: 4,
    timelyDelivery: 2,
    overallEffectiveness: 3,
    feedbackResponse: 3,
    businessImpact: 2,
    teamProactivity: 4,
    strategyAlignment: 2,
    seoImpact: 2,
    overallSatisfaction: 3,
    likelihoodToRecommend: 3,
    contentQuality: 3,
    timestamp: '12/18/2025, 9:08:14 AM',
    comment:
      'Need to work on strategy and planning. Lack of involvement from seniors.',
  },
  {
    brand: 'Bridgestone Tyres',
    phone: '919967002720',
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
    timestamp: '12/26/2025, 7:37:39 AM',
    comment: 'N/A',
  },
];

/**
 * Martech Department Survey Responses
 */
const MARTECH_RESPONSES = [
  {
    brand: 'Kotak811',
    phone: '919987512824',
    feedbackResponse: 4,
    overallEffectiveness: 3,
    teamTransparency: 4,
    timelyExecution: 4,
    teamProactivity: 3,
    overallSatisfaction: 3,
    likelihoodToRecommend: 4,
    teamCollaboration: 4,
    technicalSupport: 4,
    businessAlignment: 3,
    timestamp: '12/26/2025, 2:40:20 PM',
    comment:
      'Creatives are still not up to the standards we have set for ourselves.',
  },
];

/**
 * Fluence Department Survey Responses
 */
const FLUENCE_RESPONSES = [
  {
    brand: 'ACCA',
    phone: '919820835273',
    timelineAdherence: 5,
    responsiveness: 5,
    reportingQuality: 5,
    roi: 4,
    outcomeEffectiveness: 5,
    communication: 4,
    teamProactivity: 4,
    overallSatisfaction: 5,
    likelihoodToRecommend: 5,
    creatorFit: 5,
    campaignExecution: 5,
    briefUnderstanding: 5,
    timestamp: '12/17/2025, 1:19:25 PM',
    comment: 'Was an effective campaign',
  },
];

/**
 * SMP Department Survey Responses
 */
const SMP_RESPONSES = [
  {
    brand: 'Celio',
    phone: '919004935011',
    workAgainLikelihood: 3,
    timelineDelivery: 2,
    recommendationLikelihood: 3,
    productionExperience: 3,
    postProductionProcess: 2,
    ppmQuality: 3,
    finalAssetQuality: 3,
    budgetValue: 3,
    teamShoutout: 'N/A',
    productionType: 'Full Film Production',
    feedbackResponsiveness: 2,
    communicationRating: 3,
    briefUnderstanding: 2,
    overallSatisfaction: 3,
    timestamp: '12/19/2025, 6:49:44 AM',
    comment: 'N/A',
  },
];

/**
 * Parse timestamp string to Date object
 */
function parseTimestamp(timestampStr) {
  // Handle formats like "12/16/2025, 11:02:00 AM" or "1/7/2026, 12:29:07"
  try {
    const parts = timestampStr.split(', ');
    const datePart = parts[0];
    const timePart = parts[1] || '12:00:00 PM';

    const [month, day, year] = datePart.split('/').map(Number);

    const timeParts = timePart.split(' ');
    const time = timeParts[0];
    const period = timeParts[1] || 'AM';

    const timeComponents = time.split(':').map(Number);
    let hours = timeComponents[0];
    const minutes = timeComponents[1];
    const seconds = timeComponents[2] || 0;

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return new Date(year, month - 1, day, hours, minutes, seconds);
  } catch (e) {
    console.error(`Failed to parse timestamp: ${timestampStr}`, e);
    return new Date();
  }
}

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
 * Normalize phone number (remove country code prefix if present)
 */
const normalizePhone = phone => {
  if (!phone) return '';
  let normalized = phone.replace(/\D/g, '');
  // Remove leading 91 if present and phone is > 10 digits
  if (normalized.length > 10 && normalized.startsWith('91')) {
    normalized = normalized.substring(2);
  }
  return normalized;
};

/**
 * Find or create BrandHistory for this cycle
 */
async function findOrCreateBrandHistory(brand, cycleId) {
  // Check if history already exists
  let brandHistory = await BrandHistory.findOne({
    brandId: brand._id,
    cycleId,
  });

  if (!brandHistory) {
    // Create history snapshot
    brandHistory = await BrandHistory.create({
      brandId: brand._id,
      cycleId,
      name: brand.name,
      slug: brand.slug,
      services: brand.services || [],
      snapshotReason: 'cycle_start',
    });
  }

  return brandHistory;
}

/**
 * Find or create ClientHistory for this cycle
 */
async function findOrCreateClientHistory(client, brandId, cycleId) {
  // Check if history already exists
  let clientHistory = await ClientHistory.findOne({
    clientId: client._id,
    cycleId,
  });

  if (!clientHistory) {
    // Create history snapshot
    clientHistory = await ClientHistory.create({
      clientId: client._id,
      cycleId,
      brandId,
      name: client.name,
      phone: client.phone,
      email: client.email,
      services: client.services || [],
      snapshotReason: 'cycle_start',
    });
  }

  return clientHistory;
}

/**
 * Find SBUHistory for a brand in this cycle for a specific department
 * Returns { sbuId, sbuHistoryId }
 */
async function findSBUFromHistory(brandId, cycleId, departmentId) {
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

  // Method 2: Check current SBU model brands array
  const sbuWithBrand = await SBU.findOne({
    departmentId,
    brands: brandId,
    isActive: true,
  });

  if (sbuWithBrand) {
    // Try to find corresponding history
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

  // Method 3: Check brand's services for SBU
  const brand = await Brand.findById(brandId);
  if (brand?.services) {
    const dept = await Department.findById(departmentId);
    const deptName = dept?.name || '';
    const deptService = brand.services.find(
      s => s.department === deptName && s.sbuId
    );

    if (deptService?.sbuId) {
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

  // No SBU found
  return { sbuId: null, sbuHistoryId: null };
}

/**
 * Seed CSAT Responses for Solutions Department
 */
async function seedSolutionsResponses(cycle, solutionsDept) {
  console.log('\n📊 Seeding Solutions Department CSAT Responses...');

  let created = 0;
  let skipped = 0;

  for (const response of SOLUTIONS_RESPONSES) {
    try {
      // Find brand
      const brandSlug = generateSlug(response.brand);
      let brand = await Brand.findOne({ slug: brandSlug });

      if (!brand) {
        // Try finding by exact name
        brand = await Brand.findOne({
          name: { $regex: new RegExp(`^${response.brand}$`, 'i') },
        });
      }

      if (!brand) {
        console.log(`  ⚠ Brand not found: ${response.brand}`);
        skipped++;
        continue;
      }

      // Find client by phone number
      const normalizedPhone = normalizePhone(response.phone);
      let client = await Client.findOne({
        $or: [
          { phone: response.phone },
          { phone: normalizedPhone },
          { phone: { $regex: new RegExp(normalizedPhone + '$') } },
        ],
      });

      if (!client) {
        // Create the client if not found
        client = await Client.create({
          name: response.pocName,
          phone: normalizedPhone,
          brandIds: [brand._id],
          services: [{ department: 'solutions', isActive: true }],
          isActive: true,
        });
        console.log(`  ✓ Created client: ${response.pocName}`);
      }

      // Create/find history records for historical tracking
      const brandHistory = await findOrCreateBrandHistory(brand, cycle._id);
      const clientHistory = await findOrCreateClientHistory(
        client,
        brand._id,
        cycle._id
      );

      // Find SBU from history (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        brand._id,
        cycle._id,
        solutionsDept._id
      );

      // Build CSAT data
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

      // Create CSAT response with history IDs for historical tracking
      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycle._id,
        departmentId: solutionsDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: brandHistory._id,
        clientHistoryId: clientHistory._id,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${response.brand} - ${response.pocName}`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.brand}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`✅ Solutions responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for Media Department
 */
async function seedMediaResponses(cycle, mediaDept) {
  console.log('\n📊 Seeding Media Department CSAT Responses...');

  let created = 0;
  let skipped = 0;

  for (const response of MEDIA_RESPONSES) {
    try {
      // Find brand
      const brandSlug = generateSlug(response.brand);
      let brand = await Brand.findOne({ slug: brandSlug });

      if (!brand) {
        brand = await Brand.findOne({
          name: { $regex: new RegExp(`^${response.brand}$`, 'i') },
        });
      }

      if (!brand) {
        console.log(`  ⚠ Brand not found: ${response.brand}`);
        skipped++;
        continue;
      }

      // Find client by phone number
      const normalizedPhone = normalizePhone(response.phone);
      let client = await Client.findOne({
        $or: [
          { phone: response.phone },
          { phone: normalizedPhone },
          { phone: { $regex: new RegExp(normalizedPhone + '$') } },
        ],
      });

      if (!client) {
        // Create the client if not found
        client = await Client.create({
          name: response.pocName,
          phone: normalizedPhone,
          brandIds: [brand._id],
          services: [{ department: 'media', isActive: true }],
          isActive: true,
        });
        console.log(`  ✓ Created client: ${response.pocName}`);
      }

      // Create/find history records for historical tracking
      const brandHistory = await findOrCreateBrandHistory(brand, cycle._id);
      const clientHistory = await findOrCreateClientHistory(
        client,
        brand._id,
        cycle._id
      );

      // Find SBU from history (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        brand._id,
        cycle._id,
        mediaDept._id
      );

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
          teamCollaboration: response.teamCollaboration,
        },
        deliveryMetrics: {
          creativeRefreshment: response.creativeRefreshment,
          optimizationEffectiveness: response.optimizationEffectiveness,
          timelyExecution: response.timelyExecution,
          teamTransparency: response.teamTransparency,
          feedbackResponse: response.feedbackResponse,
          overallEffectiveness: response.overallEffectiveness,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp),
      };

      // Create CSAT response with history IDs for historical tracking
      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycle._id,
        departmentId: mediaDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: brandHistory._id,
        clientHistoryId: clientHistory._id,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${response.brand} - ${response.pocName}`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.brand}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`✅ Media responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for Tech Department
 */
async function seedTechResponses(cycle, techDept) {
  console.log('\n📊 Seeding Tech Department CSAT Responses...');

  let created = 0;
  let skipped = 0;

  for (const response of TECH_RESPONSES) {
    try {
      // Find brand
      const brandSlug = generateSlug(response.brand);
      let brand = await Brand.findOne({ slug: brandSlug });

      if (!brand) {
        brand = await Brand.findOne({
          name: { $regex: new RegExp(`^${response.brand}$`, 'i') },
        });
      }

      if (!brand) {
        console.log(`  ⚠ Brand not found: ${response.brand}`);
        skipped++;
        continue;
      }

      // Find client by phone number
      const normalizedPhone = normalizePhone(response.phone);
      let client = await Client.findOne({
        $or: [
          { phone: response.phone },
          { phone: normalizedPhone },
          { phone: { $regex: new RegExp(normalizedPhone + '$') } },
        ],
      });

      if (!client) {
        // Create the client if not found
        client = await Client.create({
          name: `Tech Client ${normalizedPhone}`,
          phone: normalizedPhone,
          brandIds: [brand._id],
          services: [{ department: 'tech', isActive: true }],
          isActive: true,
        });
        console.log(`  ✓ Created client for phone: ${normalizedPhone}`);
      }

      // Create/find history records for historical tracking
      const brandHistory = await findOrCreateBrandHistory(brand, cycle._id);
      const clientHistory = await findOrCreateClientHistory(
        client,
        brand._id,
        cycle._id
      );

      // Find SBU from history (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        brand._id,
        cycle._id,
        techDept._id
      );

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
          technicalSupport: response.technicalSupport,
          teamTransparency: response.teamTransparency,
          teamCollaboration: response.teamCollaboration,
        },
        deliveryMetrics: {
          timelyExecution: response.timelyExecution,
          feedbackResponse: response.feedbackResponse,
          businessAlignment: response.businessAlignment,
          overallEffectiveness: response.overallEffectiveness,
          teamProactivity: response.teamProactivity,
          systemIntegration: response.systemIntegration,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp),
      };

      // Create CSAT response with history IDs for historical tracking
      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycle._id,
        departmentId: techDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: brandHistory._id,
        clientHistoryId: clientHistory._id,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${response.brand} - ${normalizedPhone}`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.brand}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`✅ Tech responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for SEO Department
 */
async function seedSeoResponses(cycle, seoDept) {
  console.log('\n📊 Seeding SEO Department CSAT Responses...');

  let created = 0;
  let skipped = 0;

  for (const response of SEO_RESPONSES) {
    try {
      // Find brand
      const brandSlug = generateSlug(response.brand);
      let brand = await Brand.findOne({ slug: brandSlug });

      if (!brand) {
        brand = await Brand.findOne({
          name: { $regex: new RegExp(`^${response.brand}$`, 'i') },
        });
      }

      if (!brand) {
        console.log(`  ⚠ Brand not found: ${response.brand}`);
        skipped++;
        continue;
      }

      // Find client by phone number
      const normalizedPhone = normalizePhone(response.phone);
      let client = await Client.findOne({
        $or: [
          { phone: response.phone },
          { phone: normalizedPhone },
          { phone: { $regex: new RegExp(normalizedPhone + '$') } },
        ],
      });

      if (!client) {
        // Create the client if not found
        client = await Client.create({
          name: `SEO Client ${normalizedPhone}`,
          phone: normalizedPhone,
          brandIds: [brand._id],
          services: [{ department: 'seo', isActive: true }],
          isActive: true,
        });
        console.log(`  ✓ Created client for phone: ${normalizedPhone}`);
      }

      // Create/find history records for historical tracking
      const brandHistory = await findOrCreateBrandHistory(brand, cycle._id);
      const clientHistory = await findOrCreateClientHistory(
        client,
        brand._id,
        cycle._id
      );

      // Find SBU from history (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        brand._id,
        cycle._id,
        seoDept._id
      );

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
          strategyAlignment: response.strategyAlignment,
          contentQuality: response.contentQuality,
        },
        deliveryMetrics: {
          timelyDelivery: response.timelyDelivery,
          overallEffectiveness: response.overallEffectiveness,
          feedbackResponse: response.feedbackResponse,
          businessImpact: response.businessImpact,
          teamProactivity: response.teamProactivity,
          seoImpact: response.seoImpact,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp),
      };

      // Create CSAT response with history IDs for historical tracking
      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycle._id,
        departmentId: seoDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: brandHistory._id,
        clientHistoryId: clientHistory._id,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${response.brand} - ${normalizedPhone}`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.brand}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`✅ SEO responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for Martech Department
 */
async function seedMartechResponses(cycle, martechDept) {
  console.log('\n📊 Seeding Martech Department CSAT Responses...');

  let created = 0;
  let skipped = 0;

  for (const response of MARTECH_RESPONSES) {
    try {
      // Find brand
      const brandSlug = generateSlug(response.brand);
      let brand = await Brand.findOne({ slug: brandSlug });

      if (!brand) {
        brand = await Brand.findOne({
          name: { $regex: new RegExp(`^${response.brand}$`, 'i') },
        });
      }

      if (!brand) {
        console.log(`  ⚠ Brand not found: ${response.brand}`);
        skipped++;
        continue;
      }

      // Find client by phone number
      const normalizedPhone = normalizePhone(response.phone);
      let client = await Client.findOne({
        $or: [
          { phone: response.phone },
          { phone: normalizedPhone },
          { phone: { $regex: new RegExp(normalizedPhone + '$') } },
        ],
      });

      if (!client) {
        client = await Client.create({
          name: `Martech Client ${normalizedPhone}`,
          phone: normalizedPhone,
          brandIds: [brand._id],
          services: [{ department: 'martech', isActive: true }],
          isActive: true,
        });
        console.log(`  ✓ Created client for phone: ${normalizedPhone}`);
      }

      // Create/find history records for historical tracking
      const brandHistory = await findOrCreateBrandHistory(brand, cycle._id);
      const clientHistory = await findOrCreateClientHistory(
        client,
        brand._id,
        cycle._id
      );

      // Find SBU from history (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        brand._id,
        cycle._id,
        martechDept._id
      );

      // Build CSAT data (Martech format)
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
          teamTransparency: response.teamTransparency,
          teamCollaboration: response.teamCollaboration,
          technicalSupport: response.technicalSupport,
        },
        deliveryMetrics: {
          feedbackResponse: response.feedbackResponse,
          overallEffectiveness: response.overallEffectiveness,
          timelyExecution: response.timelyExecution,
          teamProactivity: response.teamProactivity,
          businessAlignment: response.businessAlignment,
        },
        formVersion: 'v1',
        filledAt: parseTimestamp(response.timestamp),
      };

      // Create CSAT response with history IDs for historical tracking
      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycle._id,
        departmentId: martechDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: brandHistory._id,
        clientHistoryId: clientHistory._id,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${response.brand} - ${normalizedPhone}`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.brand}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`✅ Martech responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for Fluence Department
 */
async function seedFluenceResponses(cycle, fluenceDept) {
  console.log('\n📊 Seeding Fluence Department CSAT Responses...');

  let created = 0;
  let skipped = 0;

  for (const response of FLUENCE_RESPONSES) {
    try {
      // Find brand
      const brandSlug = generateSlug(response.brand);
      let brand = await Brand.findOne({ slug: brandSlug });

      if (!brand) {
        brand = await Brand.findOne({
          name: { $regex: new RegExp(`^${response.brand}$`, 'i') },
        });
      }

      if (!brand) {
        console.log(`  ⚠ Brand not found: ${response.brand}`);
        skipped++;
        continue;
      }

      // Find client by phone number
      const normalizedPhone = normalizePhone(response.phone);
      let client = await Client.findOne({
        $or: [
          { phone: response.phone },
          { phone: normalizedPhone },
          { phone: { $regex: new RegExp(normalizedPhone + '$') } },
        ],
      });

      if (!client) {
        client = await Client.create({
          name: `Fluence Client ${normalizedPhone}`,
          phone: normalizedPhone,
          brandIds: [brand._id],
          services: [{ department: 'fluence', isActive: true }],
          isActive: true,
        });
        console.log(`  ✓ Created client for phone: ${normalizedPhone}`);
      }

      // Create/find history records for historical tracking
      const brandHistory = await findOrCreateBrandHistory(brand, cycle._id);
      const clientHistory = await findOrCreateClientHistory(
        client,
        brand._id,
        cycle._id
      );

      // Find SBU from history (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        brand._id,
        cycle._id,
        fluenceDept._id
      );

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

      // Create CSAT response with history IDs for historical tracking
      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycle._id,
        departmentId: fluenceDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: brandHistory._id,
        clientHistoryId: clientHistory._id,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${response.brand} - ${normalizedPhone}`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.brand}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`✅ Fluence responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Seed CSAT Responses for SMP Department
 */
async function seedSmpResponses(cycle, smpDept) {
  console.log('\n📊 Seeding SMP Department CSAT Responses...');

  let created = 0;
  let skipped = 0;

  for (const response of SMP_RESPONSES) {
    try {
      // Find brand
      const brandSlug = generateSlug(response.brand);
      let brand = await Brand.findOne({ slug: brandSlug });

      if (!brand) {
        brand = await Brand.findOne({
          name: { $regex: new RegExp(`^${response.brand}$`, 'i') },
        });
      }

      if (!brand) {
        console.log(`  ⚠ Brand not found: ${response.brand}`);
        skipped++;
        continue;
      }

      // Find client by phone number
      const normalizedPhone = normalizePhone(response.phone);
      let client = await Client.findOne({
        $or: [
          { phone: response.phone },
          { phone: normalizedPhone },
          { phone: { $regex: new RegExp(normalizedPhone + '$') } },
        ],
      });

      if (!client) {
        client = await Client.create({
          name: `SMP Client ${normalizedPhone}`,
          phone: normalizedPhone,
          brandIds: [brand._id],
          services: [{ department: 'smp', isActive: true }],
          isActive: true,
        });
        console.log(`  ✓ Created client for phone: ${normalizedPhone}`);
      }

      // Create/find history records for historical tracking
      const brandHistory = await findOrCreateBrandHistory(brand, cycle._id);
      const clientHistory = await findOrCreateClientHistory(
        client,
        brand._id,
        cycle._id
      );

      // Find SBU from history (returns { sbuId, sbuHistoryId })
      const sbuData = await findSBUFromHistory(
        brand._id,
        cycle._id,
        smpDept._id
      );

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

      // Create CSAT response with history IDs for historical tracking
      await CSATResponse.create({
        // Main IDs (for live/current reference)
        brandId: brand._id,
        clientId: client._id,
        cycleId: cycle._id,
        departmentId: smpDept._id,
        sbuId: sbuData.sbuId,
        // History IDs (for historical snapshots)
        brandHistoryId: brandHistory._id,
        clientHistoryId: clientHistory._id,
        sbuHistoryId: sbuData.sbuHistoryId,
        // Response data
        submittedAt: parseTimestamp(response.timestamp),
        data: csatData,
        comment: response.comment,
        isValid: true,
      });

      created++;
      console.log(
        `  ✓ Created response: ${response.brand} - ${normalizedPhone}`
      );
    } catch (error) {
      console.error(
        `  ✗ Failed to seed response for ${response.brand}:`,
        error.message
      );
      skipped++;
    }
  }

  console.log(`✅ SMP responses: ${created} created, ${skipped} skipped`);
  return created;
}

/**
 * Main Seed Function
 */
async function seed() {
  console.log('🌱 Starting CSAT Response Seeding...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get or create Cycle 5 for 2025
    let cycle = await Cycle.findOne({ year: 2025, cycleNumber: 5 });
    if (!cycle) {
      console.log('📅 Creating Cycle 5 for 2025...');
      const cycles = await Cycle.createYearCycles(2025);
      cycle = cycles.find(c => c.cycleNumber === 5);
    }
    console.log(`📅 Using cycle: ${cycle.name} (${cycle.year})`);

    // Get all departments
    const solutionsDept = await Department.findOne({ name: 'solutions' });
    const mediaDept = await Department.findOne({ name: 'media' });
    const techDept = await Department.findOne({ name: 'tech' });
    const seoDept = await Department.findOne({ name: 'seo' });
    const martechDept = await Department.findOne({ name: 'martech' });
    const fluenceDept = await Department.findOne({ name: 'fluence' });
    const smpDept = await Department.findOne({ name: 'smp' });

    if (!solutionsDept || !mediaDept) {
      console.error('✗ Required departments (solutions, media) not found!');
      console.error('  Run: node scripts/seedDatabase.js first');
      process.exit(1);
    }

    // Clear existing responses for this cycle (optional)
    const existingCount = await CSATResponse.countDocuments({
      cycleId: cycle._id,
    });
    if (existingCount > 0) {
      console.log(`🗑️  Clearing ${existingCount} existing responses...`);
      await CSATResponse.deleteMany({ cycleId: cycle._id });
    }

    // Seed responses for each department
    const solutionsCount = await seedSolutionsResponses(cycle, solutionsDept);
    const mediaCount = await seedMediaResponses(cycle, mediaDept);

    // Seed Tech responses if department exists
    let techCount = 0;
    if (techDept) {
      techCount = await seedTechResponses(cycle, techDept);
    } else {
      console.log('\n⚠ Tech department not found - skipping Tech responses');
    }

    // Seed SEO responses if department exists
    let seoCount = 0;
    if (seoDept) {
      seoCount = await seedSeoResponses(cycle, seoDept);
    } else {
      console.log('\n⚠ SEO department not found - skipping SEO responses');
    }

    // Seed Martech responses if department exists
    let martechCount = 0;
    if (martechDept) {
      martechCount = await seedMartechResponses(cycle, martechDept);
    } else {
      console.log(
        '\n⚠ Martech department not found - skipping Martech responses'
      );
    }

    // Seed Fluence responses if department exists
    let fluenceCount = 0;
    if (fluenceDept) {
      fluenceCount = await seedFluenceResponses(cycle, fluenceDept);
    } else {
      console.log(
        '\n⚠ Fluence department not found - skipping Fluence responses'
      );
    }

    // Seed SMP responses if department exists
    let smpCount = 0;
    if (smpDept) {
      smpCount = await seedSmpResponses(cycle, smpDept);
    } else {
      console.log('\n⚠ SMP department not found - skipping SMP responses');
    }

    console.log('\n🎉 CSAT Response seeding completed successfully!');

    // Summary
    const totalResponses = await CSATResponse.countDocuments({
      cycleId: cycle._id,
    });
    const stats = await CSATResponse.getCycleStats(cycle._id);

    console.log('\n📊 Summary:');
    console.log(`   Total Responses: ${totalResponses}`);
    console.log(`   Solutions Responses: ${solutionsCount}`);
    console.log(`   Media Responses: ${mediaCount}`);
    console.log(`   Tech Responses: ${techCount}`);
    console.log(`   SEO Responses: ${seoCount}`);
    console.log(`   Martech Responses: ${martechCount}`);
    console.log(`   Fluence Responses: ${fluenceCount}`);
    console.log(`   SMP Responses: ${smpCount}`);
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
