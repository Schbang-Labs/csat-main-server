/**
 * Update Clients Script - Cycle 6
 * 
 * This script processes all cycle_6_brand_*.md files and:
 * 1. Finds existing clients by phone number
 * 2. If client exists: updates brandId and serviceMapping
 * 3. If client doesn't exist: creates a new client with brandId and serviceMapping from the brand
 * 
 * Run: node scripts/cycle6/updateClients.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import Brand from '../../src/models/brand.model.js';
import Client from '../../src/models/client.model.js';

/**
 * ============================================================
 * POC DATA FROM ALL DEPARTMENTS
 * Extracted from cycle_6_brand_*.md files
 * Format: { brandName, pocName, phone, department }
 * ============================================================
 */

const SOLUTIONS_POCS = [
  // Chirag - SBU Global India
  { brandName: 'Glow & Lovely', pocName: 'Rahul Mittal', phone: '9971114795' },
  { brandName: 'Glow & Lovely', pocName: 'Suraj Shukla', phone: '9702859986' },
  { brandName: 'Bajaj Almond', pocName: 'Sonal Singh', phone: '9711981493' },
  { brandName: 'Bridgestone Tyres', pocName: 'Sumedha Sharma', phone: '9953251989' },
  { brandName: 'Bridgestone Tyres', pocName: 'Pradeep', phone: '7350016051' },
  { brandName: 'Bookmyshow', pocName: 'Akansha Singh', phone: '9870317808' },
  { brandName: 'Bookmyshow', pocName: 'Niyati Shah', phone: '9619574517' },
  { brandName: 'Sanofi Allergy', pocName: 'Bhavna Kewalramani', phone: '9820256674' },
  { brandName: 'Sanofi Allergy', pocName: 'Roohani Nayyar', phone: '9654848305' },
  { brandName: 'Medimix', pocName: 'Pooja Suchak', phone: '8976075027' },
  { brandName: 'Medimix', pocName: 'Siddhartha', phone: '9953606758' },
  { brandName: 'Medimix', pocName: 'Rupa Murudkar', phone: '9073927966' },
  { brandName: 'Huggies', pocName: 'Shantanu', phone: '7045305490' },
  { brandName: 'Huggies', pocName: 'Pratik', phone: '9953948545' },
  { brandName: 'Huggies', pocName: 'Iti Bhadani', phone: '9953895484' },
  { brandName: 'Huggies', pocName: 'Shweta Vig', phone: '9743775021' },
  { brandName: 'Gyproc', pocName: 'Ankur Bali', phone: '9833999165' },
  { brandName: 'Gyproc', pocName: 'Divyesh Panchal', phone: '9819123198' },
  // Amazon SEA and FUSE have NA phone numbers - skip

  // Samarth - SBU Next Wave
  { brandName: 'Marvel + Disney', pocName: 'Bhavya Chopra', phone: '9867066763' },
  { brandName: 'Marvel + Disney', pocName: 'Aditi Singh', phone: '9769936558' },
  { brandName: 'London Dairy', pocName: 'Vipul Yadav', phone: '9833393092' },
  { brandName: 'London Dairy', pocName: 'Sayantan Bose', phone: '7506075920' },
  { brandName: 'Allegro', pocName: 'Vipul Yadav', phone: '9833393092' },
  { brandName: 'Allegro', pocName: 'Sayantan Bose', phone: '7506075920' },
  { brandName: 'Riot Games - Valorant', pocName: 'Harsh Sinha', phone: '8879949141' },
  { brandName: 'Riot Games - Valorant', pocName: 'Anushka Bhatnagar', phone: '8959178078' },
  { brandName: 'Riot Games - League Of Legends', pocName: 'Harsh Sinha', phone: '8879949141' },
  { brandName: 'Riot Games - League Of Legends', pocName: 'Anushka Bhatnagar', phone: '8959178078' },
  { brandName: 'Dominos', pocName: 'Surabhi Prasoon', phone: '8299775274' },
  { brandName: 'Celio', pocName: 'Vaibhav Jaiswal', phone: '9867300306' },
  { brandName: 'Eureka Forbes', pocName: 'Shreya Naithani', phone: '7838552269' },
  { brandName: 'Eureka Forbes', pocName: 'Arth Patel', phone: '8000759596' },
  { brandName: 'Britannia', pocName: 'Vinay Subramanyam', phone: '8970110111' },
  { brandName: 'Crompton', pocName: 'Aishwarya Jain', phone: '9867655553' },
  { brandName: 'Crompton', pocName: 'Vaibhav Joshi', phone: '9699393165' },
  { brandName: 'Fair and Handsome', pocName: 'J Shaji', phone: '9884127706' },
  { brandName: 'Fair and Handsome', pocName: 'Siva Prasanna', phone: '6381063011' },
  { brandName: 'Exotica / Pure Glow', pocName: 'Pooja Pasi', phone: '8767555512' },
  { brandName: 'Voltas', pocName: 'Barkha G', phone: '9920979679' },

  // Shreya - SBU For the Craft
  { brandName: 'ITC Hotels', pocName: 'Sweta Vaish', phone: '9867552566' },
  { brandName: 'Wok and Roll', pocName: 'Aayushi Raheja', phone: '9920909899' },

  // Sumesh - Bangalore
  { brandName: 'Himalaya PartySmart', pocName: 'Janhvi Mehrotra', phone: '9900024802' },
  { brandName: 'Himalaya PartySmart', pocName: 'Abby S', phone: '9036093536' },
  { brandName: 'Pot and Bloom', pocName: 'Harpreet Kaur', phone: '9008325588' },
  { brandName: 'Pot and Bloom', pocName: 'Anand', phone: '9740455788' },
  { brandName: 'Krafton', pocName: 'Vaibhav Lakshmi', phone: '8123474400' },
  { brandName: 'Krafton', pocName: 'Kartikey Srivastava', phone: '9354012018' },
  { brandName: 'ITC Limited Corporate', pocName: 'Sananda Majumdar', phone: '8240116006' },
  { brandName: 'ITC Limited Corporate', pocName: 'Aditi Roy Choudhury', phone: '9739959759' },
  { brandName: 'ITC HR', pocName: 'Rimpi Sharma', phone: '8100330903' },
  { brandName: 'ITC HR', pocName: 'Debasish Parida', phone: '9840927866' },

  // Vrinda - SBU Corporate India
  { brandName: 'Jockey', pocName: 'Rekha Nahar', phone: '9980222061' },
  { brandName: 'Jockey', pocName: 'Ritika Sharma', phone: '8591481423' },
  { brandName: 'Jockey', pocName: 'Sourav Das', phone: '7829546760' },
  { brandName: 'Jockey', pocName: 'Divya Mishra', phone: '9739949967' },
  { brandName: 'Oriana', pocName: 'Rajagopalan', phone: '7904206683' },
  { brandName: 'Oriana', pocName: 'Punith Agarwal', phone: '8310188811' },
  { brandName: 'Ample Group', pocName: 'Yashvi Gadhia', phone: '9081061006' },
  { brandName: 'Ample Group', pocName: 'Bhranti Tali', phone: '9662082818' },

  // Dhruv + Malka - SBU Impact India
  { brandName: 'Philips', pocName: 'Jaivik Shah', phone: '9930477729' },
  { brandName: 'Philips', pocName: 'Sandeep Havildar', phone: '9892406199' },
  { brandName: 'iQOO', pocName: 'Amanpreet Kaur', phone: '8882525820' },
  { brandName: 'iQOO', pocName: 'Abishek Kumar', phone: '8210476987' },
  { brandName: 'Cavin Kare', pocName: 'J Shaji', phone: '9884127706' },
  { brandName: 'Cavin Kare', pocName: 'Siva Prasanna', phone: '6381063011' },
  { brandName: 'Max Protein', pocName: 'Shaurya Singhal', phone: '9953515915' },
  { brandName: 'Max Protein', pocName: 'Shivam Tyagi', phone: '9990021131' },
  { brandName: 'IIFL', pocName: 'Neelima Puranik', phone: '8976047720' },
  { brandName: 'IIFL', pocName: 'Naishal Mehta', phone: '9167555597' },
  { brandName: 'IIFL', pocName: 'Rohit Bhavsar', phone: '8879252507' },
  { brandName: 'Optimum Nutrition + Isopure', pocName: 'Shaurya Singhal', phone: '9953515915' },
  { brandName: 'Optimum Nutrition + Isopure', pocName: 'Shivam Tyagi', phone: '9990021131' },
  { brandName: 'Dabur Hajmola', pocName: 'Siddharth Ratan', phone: '8447779269' },
  { brandName: 'Dabur Hajmola', pocName: 'Mohit Sharma', phone: '8287900055' },

  // Dhruv + Aniket - SBU India Rising 1
  { brandName: 'Fevicol', pocName: 'Shruti Bhardwaj', phone: '9899912155' },
  { brandName: 'Fevicol', pocName: 'Tejaswi Chandegra', phone: '9099946088' },
  { brandName: 'Fiama', pocName: 'Amit Bhansali', phone: '9833108008' },
  { brandName: 'Fiama', pocName: 'Rishika Rajpal', phone: '9971717556' },
  { brandName: 'Kotak 811 + Kotak 811 (Fin For All)', pocName: 'Shankar Ramamurthy', phone: '9930036101' },
  { brandName: 'Kotak 811 + Kotak 811 (Fin For All)', pocName: 'Sagar Shah', phone: '9987512824' },
  { brandName: 'Kotak 811 + Kotak 811 (Fin For All)', pocName: 'Suhail Shaikh', phone: '7208232369' },
  { brandName: 'Hobby Ideas', pocName: 'Ashwin Lobo', phone: '9820124020' },
  { brandName: 'Hobby Ideas', pocName: 'Jay Desai', phone: '8600801263' },
  { brandName: 'Charmis + Dermafique', pocName: 'Neetha Devir', phone: '9819466770' },
  { brandName: 'Charmis + Dermafique', pocName: 'Amit Bhansali', phone: '9833108008' },
  { brandName: 'Vivel', pocName: 'Amit Bhansali', phone: '9833108008' },
  { brandName: 'Vivel', pocName: 'Rishika Rajpal', phone: '9971717556' },
  { brandName: 'Engage', pocName: 'Amit Bhansali', phone: '9833108008' },
  { brandName: 'Engage', pocName: 'Rishika Rajpal', phone: '9971717556' },
  { brandName: 'Visa', pocName: 'Bhairavi Kulkarni', phone: '9867556844' },
  { brandName: 'Visa', pocName: 'Ayushi Jain', phone: '9769900500' },

  // Dhruv + Ria - SBU India Rising 2
  { brandName: 'HDFC Bank', pocName: 'Vishnu Alagarsamy', phone: '9790827721' },
  { brandName: 'HDFC Bank', pocName: 'Rashih Kamal', phone: '9979800009' },
  { brandName: 'Phoenix Marketcity', pocName: 'Anvesha Yadav', phone: '9893900005' },
  { brandName: 'Phoenix Marketcity', pocName: 'Chantal Nadar', phone: '9833316369' },
  { brandName: 'Britannia Cakes', pocName: 'Surbhi Kathpalia', phone: '9845028003' },
  { brandName: 'Britannia Cakes', pocName: 'Falguni Kalia', phone: '9742188089' },
  { brandName: 'Britannia Breads', pocName: 'Surbhi Kathpalia', phone: '9845028003' },
  { brandName: 'Britannia Breads', pocName: 'Falguni Kalia', phone: '9742188089' },
  { brandName: 'Britannia Croissant', pocName: 'Surbhi Kathpalia', phone: '9845028003' },
  { brandName: 'Britannia Croissant', pocName: 'Falguni Kalia', phone: '9742188089' },
  { brandName: 'Britannia Rusk', pocName: 'Surbhi Kathpalia', phone: '9845028003' },
  { brandName: 'Britannia Rusk', pocName: 'Falguni Kalia', phone: '9742188089' },
  { brandName: 'Britannia Cheese', pocName: 'Chandana Devi', phone: '9611155553' },
  { brandName: 'Britannia Cheese', pocName: 'Sailesh Shivashankar', phone: '9108310033' },
  { brandName: 'Britannia Winkin Cow and Come Alive', pocName: 'Chandana Devi', phone: '9611155553' },
  { brandName: 'Britannia Winkin Cow and Come Alive', pocName: 'Sailesh Shivashankar', phone: '9108310033' },
  { brandName: 'Dr. Reddy\'s Laboratories', pocName: 'Harshith Chandra', phone: '7989190494' },
  { brandName: 'Dr. Reddy\'s Laboratories', pocName: 'Anuj Mathur', phone: '9866225511' },

  // Dhruv + Jainik - SBU India Rising 3
  { brandName: 'Apollo Hospitals', pocName: 'Anantha Kumar', phone: '9666621315' },

  // Rohan + Batul + Reuben - SBU India on the Move 1
  { brandName: 'HDFC Life', pocName: 'Nilesh Ruparel', phone: '9920044966' },
  { brandName: 'HDFC Life', pocName: 'Ashay Boricha', phone: '7208826000' },
  { brandName: 'Skybags Luggage', pocName: 'Kinjal Shah', phone: '9619912211' },
  { brandName: 'Skybags Backpack', pocName: 'Kinjal Shah', phone: '9619912211' },
  { brandName: 'Episoft', pocName: 'Anuj Mathur', phone: '9866225511' },
  { brandName: 'Bonito Design', pocName: 'Shailin Mehta', phone: '9327177177' },
  { brandName: 'HDFC Ergo', pocName: 'Vaibhav Patel', phone: '9029099002' },
  { brandName: 'HDFC Ergo', pocName: 'Vaibhav Marolia', phone: '9137330000' },
  { brandName: 'HDFC Ergo', pocName: 'Shwetha Ganesh', phone: '9967336677' },
  { brandName: 'Flair pens', pocName: 'Devvrat Jyoti', phone: '9619011114' },
  { brandName: 'Flair pens', pocName: 'Siddharth Arora', phone: '8390987001' },
  { brandName: 'Pierre Cardin', pocName: 'Devvrat Jyoti', phone: '9619011114' },
  { brandName: 'Pierre Cardin', pocName: 'Siddharth Arora', phone: '8390987001' },
  { brandName: 'Meraki Habitat', pocName: 'Apurva Panchal', phone: '7567992008' },
  { brandName: 'Torrent Electricals', pocName: 'Aakriti Singh', phone: '9825050301' },
  { brandName: 'Torrent Electricals', pocName: 'Anjali', phone: '9601986101' },
  { brandName: 'Hauser Germany', pocName: 'Devvrat Jyoti', phone: '9619011114' },
  { brandName: 'Hauser Germany', pocName: 'Siddharth Arora', phone: '8390987001' },

  // Rohan + Yohann - SBU India on the Move 2
  { brandName: 'Castrol POWER1', pocName: 'Rhea Vyas', phone: '8879972041' },
  { brandName: 'Castrol POWER1', pocName: 'Shweta Pawar', phone: '9820394737' },
  { brandName: 'Castrol Magnatec/ Cars', pocName: 'Ayush Garg', phone: '9654170396' },
  { brandName: 'Castrol Magnatec/ Cars', pocName: 'Gaurav Khatri', phone: '9130098805' },
  { brandName: 'Greencell NueGo', pocName: 'Deepti Sharma', phone: '9654264642' },
  { brandName: 'Mahindra Rise', pocName: 'Avantika Chitlangia', phone: '9833779503' },
  { brandName: 'Mahindra Rise', pocName: 'Brendon Fernandes', phone: '9930591739' },
  { brandName: 'Aditya Birla Paints', pocName: 'Aastha Narula', phone: '9999513285' },
  { brandName: 'CRIF High Mark', pocName: 'Subhadeep Roy Casper', phone: '9830057010' },
  { brandName: 'AM/NS', pocName: 'Bhawna Singh', phone: '9326606363' },
  { brandName: 'UltraTech Cement', pocName: 'Avadhoot Dawankar', phone: '9619177699' },
  { brandName: 'Safari Genie', pocName: 'Kinjal Shah', phone: '9619912211' },

  // Afshaad - SBU Luxe
  { brandName: 'Kerastase', pocName: 'Tanya Jain', phone: '9910393779' },
  { brandName: 'Kiehl\'s', pocName: 'Bhavika Singh', phone: '9711090066' },
  { brandName: 'Lancome', pocName: 'Jui Joshi', phone: '9870777333' },
  { brandName: 'L\'oreal Redken', pocName: 'Tanya Jain', phone: '9910393779' },
  { brandName: 'ICA Pidilite', pocName: 'Viraj Kekre', phone: '9820150015' },
  { brandName: 'ICA Pidilite', pocName: 'Tejaswi Chandegra', phone: '9099946088' },
  { brandName: 'Simpolo', pocName: 'Nilotpal Chakraborthy', phone: '9974408808' },
  { brandName: 'L\'oreal Professionnel', pocName: 'Tanya Jain', phone: '9910393779' },
  { brandName: 'Kumari Jewels', pocName: 'Ashish Sharma', phone: '9819413522' },
  { brandName: 'Kumari Jewels', pocName: 'Rahul Kumar', phone: '7900186687' },
  { brandName: 'Louis Philippe', pocName: 'Akshita Kalia', phone: '9818155222' },
  { brandName: 'Louis Philippe', pocName: 'Vaibhav Jaiswal', phone: '9867300306' },
  { brandName: 'Cerave', pocName: 'Bhavika Singh', phone: '9711090066' },
  { brandName: 'Nerolac', pocName: 'Anand Sinha', phone: '9920085544' },
  { brandName: 'Specta Surfaces', pocName: 'Abhishek Agarwal', phone: '7982498162' },
  { brandName: 'Metro', pocName: 'Harsh Shah', phone: '9833345457' },
  { brandName: 'Metro', pocName: 'Aastha Mantri', phone: '9987292109' },
  { brandName: 'Mochi', pocName: 'Harsh Shah', phone: '9833345457' },
  { brandName: 'Mochi', pocName: 'Aastha Mantri', phone: '9987292109' },
  { brandName: 'Tata Cliq Lifestyle', pocName: 'Sneha Deshpande', phone: '9167700700' },
  { brandName: 'TATA Cliq Palette', pocName: 'Sneha Deshpande', phone: '9167700700' },
  { brandName: 'GAIN by Galderma', pocName: 'Keshav Lulla', phone: '9819855988' },
  { brandName: 'Biluma Galderma', pocName: 'Keshav Lulla', phone: '9819855988' },

  // Afshaad + Eric - SBU For the Arts
  { brandName: 'Nita Mukesh Ambani Cultural Centre (NMACC)', pocName: 'Pallavi Joshi', phone: '9821019887' },
  { brandName: 'Nita Mukesh Ambani Cultural Centre (NMACC)', pocName: 'Triya Shrivastava', phone: '9870029660' },
  { brandName: 'Encore', pocName: 'Pallavi Joshi', phone: '9821019887' },
  { brandName: 'Jio World Convention Centre (JWCC)', pocName: 'Pallavi Joshi', phone: '9821019887' },
  { brandName: 'Vantara', pocName: 'Adwitia Patnaik', phone: '9004554432' },
  { brandName: 'Vantara', pocName: 'Triya Shrivastava', phone: '9870029660' },
  { brandName: 'Vantara Niwas', pocName: 'Adwitia Patnaik', phone: '9004554432' },
  { brandName: 'Vantara Niwas', pocName: 'Triya Shrivastava', phone: '9870029660' },
  { brandName: 'Reliance Jio', pocName: 'Kartik Raturi', phone: '9599025580' },
  { brandName: 'Reliance Jio', pocName: 'Anil Nair', phone: '9900006133' },

  // Rohan + Varsha - SBU GenHer
  { brandName: 'Mukul Madhav Foundation', pocName: 'Shikha Gera', phone: '9619990099' },
  { brandName: 'Reliance Foundation', pocName: 'Kamini Khanna', phone: '9820128810' },
  { brandName: 'Shiv Nadar Foundation', pocName: 'Ritu Verma', phone: '9818805833' },
  { brandName: 'Godrej Design Labs', pocName: 'Pooja Biswas', phone: '9825499908' },
  { brandName: 'Cochlear', pocName: 'Samantha Mendonsa', phone: '9920238249' },
  { brandName: 'INTABCPA', pocName: 'Mayoori Ghosh', phone: '9830017701' },
  { brandName: 'Aditya Birla Novel', pocName: 'Garima Mathur', phone: '9599069006' },
  { brandName: 'Her Circle', pocName: 'Kamini Khanna', phone: '9820128810' },
  { brandName: 'Her Circle', pocName: 'Palak Munjal', phone: '9167601066' },
  { brandName: 'Nanhi Kali', pocName: 'Priyanka Bhanushali', phone: '8452005769' },
  { brandName: 'Kaabil', pocName: 'Kamakshi Shaligram', phone: '7738076449' },
  { brandName: 'Indriya', pocName: 'Rakshana Srikanth', phone: '9445057968' },
  { brandName: 'Indriya', pocName: 'Simran Talwar', phone: '9769808077' },
  { brandName: 'Milton', pocName: 'Dhruv Parekh', phone: '9820488007' },
  { brandName: 'Treo', pocName: 'Dhruv Parekh', phone: '9820488007' },
  { brandName: 'Procook', pocName: 'Dhruv Parekh', phone: '9820488007' },
];

const SMP_POCS = [
  { brandName: 'McCain', pocName: 'Srishti Mahopatra', phone: '8598931475' },
  { brandName: 'Celio', pocName: 'Vibhuti Arte', phone: '9004935011' },
  { brandName: 'Dabur Hajmola', pocName: 'Mohit Sharma', phone: '8447779269' },
  { brandName: 'Britannia', pocName: 'Sayali Thakur', phone: '9930222455' },
  { brandName: 'Britannia', pocName: 'Arjun Visvanathan', phone: '9820463215' },
  { brandName: 'Britannia', pocName: 'Pournami Unnikrishnan', phone: '9870005717' },
  { brandName: 'ITC Limited Corporate', pocName: 'Kamna Srivastav', phone: '9810320728' },
  { brandName: 'Ample Group', pocName: 'Sandhya Gurung', phone: '9513686095' },
  { brandName: 'Louis Philippe', pocName: 'Akshita Kalia', phone: '9818155222' },
  { brandName: 'Tata Capital', pocName: 'Nikita Gupta', phone: '9768815548' },
  { brandName: 'Dr. Reddy\'s Laboratories', pocName: 'Harshith Chandra', phone: '7989190494' },
];

const MEDIA_POCS = [
  { brandName: 'Papa Don\'t Preach', pocName: 'Viraj Anam', phone: '8767344972' },
  { brandName: 'Metro', pocName: 'Harsh Shah', phone: '9833345457' },
  { brandName: 'Metro', pocName: 'Aastha Mantri', phone: '9987292109' },
  { brandName: 'Hobby Ideas', pocName: 'Jay Desai', phone: '8600801263' },
  { brandName: 'Fevicreate', pocName: 'Jay Desai', phone: '8600801263' },
  { brandName: 'Specta Surfaces', pocName: 'Abhishek Agarwal', phone: '7982498162' },
  { brandName: 'NueGo', pocName: 'Deepti Sharma', phone: '9654264642' },
  { brandName: 'Cochlear', pocName: 'Samantha Mendonsa', phone: '9920238249' },
  { brandName: 'JLL', pocName: 'Omprakash Singh', phone: '9004595090' },
  { brandName: 'JLL', pocName: 'Sahil Suhag', phone: '9582798405' },
  { brandName: 'Level Supermind', pocName: 'Pranali Kadu', phone: '9834553221' },
  { brandName: 'Mahindra Rise', pocName: 'Avantika Chitlangia', phone: '9833779503' },
  { brandName: 'Armaf', pocName: 'Sufyaan Moosani', phone: '8655077233' },
  { brandName: 'Armaf', pocName: 'Zahid Khan', phone: '9833380003' },
  { brandName: 'Bodycraft Salon', pocName: 'Riddhi Sharma', phone: '9724320003' },
  { brandName: 'Bodycraft Clinic', pocName: 'Riddhi Sharma', phone: '9724320003' },
  { brandName: 'Tata Comm', pocName: 'Isha Chhaya', phone: '8511123564' },
  { brandName: 'Tata Comm', pocName: 'Parag Girotra', phone: '7827067637' },
  { brandName: 'Tata Comm', pocName: 'Nidhi Chauhan', phone: '9971446373' },
  { brandName: 'Tata Comm', pocName: 'Alokita Sharma', phone: '7289986430' },
  { brandName: 'ACCA', pocName: 'Saahil Kalvani', phone: '9820835273' },
  { brandName: 'Kumari Fine Jewellery', pocName: 'Ashish Sharma', phone: '9819413522' },
  { brandName: 'Bridgestone', pocName: 'Sumedha Sharma', phone: '9953251989' },
  { brandName: 'Bridgestone', pocName: 'Pradeep Alex', phone: '7350016051' },
  { brandName: 'Simpolo', pocName: 'Nilotpal Chakraborthy', phone: '9974408808' },
  { brandName: 'Oriana', pocName: 'Rajagopalan', phone: '7904206683' },
  { brandName: 'Groviva', pocName: 'Anjali Pawar', phone: '7972446697' },
  { brandName: 'Mochi', pocName: 'Harsh Shah', phone: '9833345457' },
  { brandName: 'Mochi', pocName: 'Aastha Mantri', phone: '9987292109' },
  { brandName: 'Medimix', pocName: 'Pooja Shuchak', phone: '8976075027' },
  { brandName: 'Indriya', pocName: 'Rakshana Srikanth', phone: '9445057968' },
  { brandName: 'Torrent Electricals', pocName: 'Anjali', phone: '9601986101' },
  { brandName: 'Dr. Reddy\'s Laboratories', pocName: 'Harshith Chandra', phone: '7989190494' },
  { brandName: 'Lakeshore', pocName: 'Prithvi Hardasani', phone: '7977395820' },
  { brandName: 'Lakeshore', pocName: 'Seema Bansal', phone: '7045367084' },
  { brandName: 'Lakeshore', pocName: 'Janai Khan', phone: '9833285430' },
  { brandName: 'Nikon', pocName: 'Kshitij Arora', phone: '8826144777' },
  { brandName: 'Nikon', pocName: 'Arpana Kant', phone: '9873071496' },
  { brandName: 'London Dairy', pocName: 'Vipul Yadav', phone: '9833393092' },
  { brandName: 'Nanhi Kali', pocName: 'Priyanka Bhanushali', phone: '8452005769' },
  { brandName: 'Kaabil', pocName: 'Kamakshi Shaligram', phone: '7738076449' },
  { brandName: 'Kosmoderma', pocName: 'Albin', phone: '9980202719' },
];

const FLUENCE_POCS = [
  { brandName: 'Huggies', pocName: 'Pratik Jain', phone: '9953948545' },
  { brandName: 'Huggies', pocName: 'Iti Bhandani', phone: '9953895484' },
  { brandName: 'Eureka Forbes', pocName: 'Shreya Naithani', phone: '7838552269' },
  { brandName: 'Eureka Forbes', pocName: 'Arth Patel', phone: '8000759596' },
  { brandName: 'Eureka Forbes', pocName: 'Manisha Fudani', phone: '9662970080' },
  { brandName: 'Bridgestone', pocName: 'Sumedha', phone: '9953251989' },
  { brandName: 'Adani Realty', pocName: 'Sakshi', phone: '9825085451' },
  { brandName: 'Castrol', pocName: 'Rhea', phone: '8879972041' },
  { brandName: 'Castrol', pocName: 'Shweta Pawar', phone: '9820394737' },
  { brandName: 'Castrol', pocName: 'Ayush Garg', phone: '9654170396' },
  { brandName: 'Castrol', pocName: 'Gaurav Khatri', phone: '9130098805' },
  { brandName: 'Dr. Reddy\'s Laboratories', pocName: 'Harshith Chandra', phone: '7989190494' },
  { brandName: 'Jockey', pocName: 'Sourav Das', phone: '7829546760' },
  { brandName: 'Zespri', pocName: 'Akshay Pai', phone: '9901929760' },
  { brandName: 'Fevicreate', pocName: 'Jay Desai', phone: '8600801263' },
  { brandName: 'Simpolo', pocName: 'Nilotpal', phone: '9974408808' },
  { brandName: 'Fevicryl', pocName: 'Isha Amin', phone: '9987024742' },
  { brandName: 'Indriya', pocName: 'Simran Talwar', phone: '9769808077' },
  { brandName: 'Glow & Lovely', pocName: 'Suraj', phone: '9702859986' },
  { brandName: 'Boheco', pocName: 'Tejas Wani', phone: '8779074002' },
  { brandName: 'Milton Appliances', pocName: 'Ayush Sharma', phone: '9039380557' },
  { brandName: 'Motorola', pocName: 'Himalay', phone: '9873676622' },
];

const SEO_POCS = [
  { brandName: 'Bridgestone', pocName: 'Sumedha Sharma', phone: '9953251989' },
  { brandName: 'Bridgestone', pocName: 'Paritosh Koppikar', phone: '9967002720' },
  { brandName: 'Britannia CheeseitUp', pocName: 'Nandita Kamath', phone: '9900815222' },
  { brandName: 'Britannia Corporate', pocName: 'Prabakaran K', phone: '9986416717' },
  { brandName: 'Ecolink', pocName: 'Kanishka Garbyal', phone: '9891433015' },
  { brandName: 'Sriram Life Insurance', pocName: 'Rahul Adaniya', phone: '9930577107' },
  { brandName: 'Sriram Life Insurance', pocName: 'Sravan Kumar', phone: '9704191860' },
  { brandName: 'Lakme', pocName: 'Krithikha Udayakumar', phone: '9943019003' },
  { brandName: 'Britannia AEO-GEO', pocName: 'Meeta Chandrasekhar', phone: '9940059613' },
  { brandName: 'Birla Opus', pocName: 'Aastha Narula', phone: '9999513285' },
  // Ramandeep has no phone number - skip
  { brandName: 'HCCB', pocName: 'Chiththarthann', phone: '8012047626' },
  { brandName: 'Jindal Steel', pocName: 'Isha Sahni', phone: '9599698449' },
  { brandName: 'NueGo', pocName: 'Deepti Sharma', phone: '9654264642' },
  { brandName: 'UltraTech', pocName: 'Avadhoot Dawankar', phone: '9619177699' },
  { brandName: 'Bodycraft', pocName: 'Riddhi Sharma', phone: '9724320003' },
  { brandName: 'Bodycraft', pocName: 'Roshni Khatri', phone: '9884076488' },
  { brandName: 'Bodycraft', pocName: 'Lakshmi Sunil Ranganathan', phone: '9845108212' },
  // Fevicol - Disha Rayen has NA - skip
  { brandName: 'Everest', pocName: 'Salman Merchant', phone: '8898420058' },
  { brandName: 'Everest', pocName: 'Dhruvi Jamda', phone: '8097591987' },
  { brandName: 'Everest', pocName: 'Shivani Shrivastava', phone: '9326260922' },
  { brandName: 'Kumari', pocName: 'Ashish Sharma', phone: '9819413522' },
  { brandName: 'Kumari', pocName: 'Rahul Kumar', phone: '7900186687' },
  { brandName: 'Jockey', pocName: 'Rekha Nahar', phone: '9980222061' },
  { brandName: 'Jockey', pocName: 'Ritika Sharma', phone: '8591481423' },
  { brandName: 'Mahindra Rise', pocName: 'Brendon Fernandes', phone: '9930591739' },
  { brandName: '5 Paisa', pocName: 'Parag Kubal', phone: '9892058033' },
  { brandName: '5 Paisa', pocName: 'Sushant Oberoi', phone: '9167584485' },
];

const TECH_POCS = [
  { brandName: 'Bridgestone', pocName: 'Sumedha Sharma', phone: '9953251989' },
  { brandName: 'Bridgestone', pocName: 'Paritosh Koppikar', phone: '9967002720' },
  { brandName: 'DHP Heavy', pocName: 'Bhavesh Goel', phone: '8879694015' },
  { brandName: 'Britannia Corporate', pocName: 'Prabakaran K', phone: '9986416717' },
  { brandName: 'Sriram Life Insurance', pocName: 'Rahul Adaniya', phone: '9930577107' },
  { brandName: 'Sriram Life Insurance', pocName: 'Sravan Kumar', phone: '9704191860' },
  { brandName: 'Birla Opus', pocName: 'Aastha Narula', phone: '9999513285' },
  { brandName: 'HCCB', pocName: 'Chiththarthann', phone: '8012047626' },
  { brandName: 'Jindal Steel', pocName: 'Isha Sahni', phone: '9599698449' },
  { brandName: 'Pot and Bloom', pocName: 'Harpreet Kaur', phone: '9008325588' },
  { brandName: 'Pot and Bloom', pocName: 'Anand T R', phone: '9740455788' },
  { brandName: 'Bodycraft', pocName: 'Roshni Khatri', phone: '9884076488' },
  { brandName: 'Ring (NZ)', pocName: 'Varun Khanna', phone: '+61432089955' },
  { brandName: 'Ring (NZ)', pocName: 'Corrine Cheng', phone: '+61405236602' },
  { brandName: 'NRB bearings', pocName: 'Kanishk Kansal', phone: '7045754285' },
  { brandName: 'NRB bearings', pocName: 'Yohan Baria', phone: '971509700525' },
  { brandName: 'Brookfield', pocName: 'Salil Phatak', phone: '7709403778' },
  { brandName: 'Brookfield', pocName: 'Karthik Pillai', phone: '9833993177' },
  { brandName: 'Himatsingka', pocName: 'Rohith Narayan', phone: '7760972675' },
  { brandName: 'Himatsingka', pocName: 'Rithika Gandhi', phone: '9110201796' },
  { brandName: 'Mahindra Rise', pocName: 'Brendon Fernandes', phone: '9930591739' },
];

const MARTECH_POCS = [
  { brandName: 'Audi', pocName: 'Moupriya Das', phone: '9175066983' },
  { brandName: 'Crompton', pocName: 'Vaibhav Joshi', phone: '9699393165' },
  { brandName: 'Bridgestone', pocName: 'Sumedha Sharma', phone: '9953251989' },
  { brandName: 'Jio Hotstar', pocName: 'Manali Kukreja', phone: '9987486522' },
  { brandName: 'Jio Hotstar', pocName: 'Shaun Fernandes', phone: '9819280020' },
  { brandName: 'Pot and Bloom', pocName: 'Harpreet Kaur', phone: '9008325588' },
  { brandName: 'Pot and Bloom', pocName: 'Anand', phone: '9740455788' },
  { brandName: 'McCain', pocName: 'Sumati Kapur', phone: '9953526233' },
  { brandName: 'ICICI prudential', pocName: 'Pranjal Gunjal', phone: '9967955926' },
  // ICICI prudential - Harsh Shah, Riya Pathak, Mamata Sawant have no phone - skip
  // Bayer - Mayukh Chakraborty has no phone - skip
  { brandName: 'JL Morison', pocName: 'Sabhayata Singh', phone: '7506361427' },
  { brandName: 'Hamilton', pocName: 'Umangi Desai', phone: '8600720959' },
  { brandName: 'Hamilton', pocName: 'Shreyash', phone: '8356094977' },
  { brandName: 'Hamilton', pocName: 'Priyanka Datta', phone: '8130778113' },
  { brandName: 'Kotak811', pocName: 'Sagar Shah', phone: '9987512824' },
  { brandName: 'Kotak811', pocName: 'Shankar', phone: '9930036101' },
  { brandName: 'Kotak811', pocName: 'Suhail Shaikh', phone: '7208232369' },
  { brandName: 'Jockey', pocName: 'Rekha Nahar', phone: '9980222061' },
  { brandName: 'Jockey', pocName: 'Ritika Sharma', phone: '8591481423' },
  { brandName: 'Jockey', pocName: 'Divya Mishra', phone: '9739949967' },
  { brandName: 'Nivea', pocName: 'Prateek Gulati', phone: '9711834224' },
  { brandName: 'Mahindra Rise', pocName: 'Brendon Fernandes', phone: '9930591739' },
  { brandName: 'Eureka Forbes', pocName: 'Manisha Kode', phone: '9662970080' },
  { brandName: 'Eureka Forbes', pocName: 'Harshal Patil', phone: '8830700617' },
  { brandName: 'Eureka Forbes', pocName: 'Krupa Jhaveri', phone: '9833232385' },
];

/**
 * Brand name variations mapping
 */
const BRAND_NAME_VARIATIONS = {
  'Pot & Bloom': 'Pot and Bloom',
  'Bridgestone Tyres': 'Bridgestone',
  'Greencell NueGo': 'NueGo',
  'Metro Shoes': 'Metro',
  'Specta': 'Specta Surfaces',
  'Hajmola': 'Dabur Hajmola',
  'ITC': 'ITC Limited Corporate',
  'Ample': 'Ample Group',
  'Dr Reddys Lab': 'Dr. Reddy\'s Laboratories',
  'Dr. Reddys': 'Dr. Reddy\'s Laboratories',
  'Dr. Reddy': 'Dr. Reddy\'s Laboratories',
  'Glow & Lovely': 'Glow & Lovely',
};

/**
 * Generate slug from name
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Escape regex special characters
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Find brand by name (case-insensitive, tries multiple variations)
 */
const findBrandByName = async (brandName) => {
  const normalizedName = BRAND_NAME_VARIATIONS[brandName] || brandName;

  // Try exact match first
  let brand = await Brand.findOne({ name: normalizedName });
  if (brand) return brand;

  // Try original name
  brand = await Brand.findOne({ name: brandName });
  if (brand) return brand;

  // Try case-insensitive match
  brand = await Brand.findOne({ name: { $regex: new RegExp(`^${escapeRegex(normalizedName)}$`, 'i') } });
  if (brand) return brand;

  // Try slug match
  const slug = generateSlug(normalizedName);
  brand = await Brand.findOne({ slug });
  if (brand) return brand;

  return null;
};

/**
 * Normalize phone number (remove special chars, keep numbers only)
 */
const normalizePhone = (phone) => {
  if (!phone || phone === 'NA' || phone === '-') return null;
  // Keep only numbers and + for international numbers
  return phone.replace(/[^0-9+]/g, '');
};

/**
 * Update or create client for a POC
 */
const updateOrCreateClient = async (pocData, departmentCode) => {
  const { brandName, pocName, phone } = pocData;

  // Skip if no valid phone
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return { status: 'skipped', reason: 'No valid phone number' };
  }

  // Find the brand
  const brand = await findBrandByName(brandName);
  if (!brand) {
    return { status: 'brand_not_found', brandName };
  }

  // Check if client exists by brandId + phone (unique constraint)
  let client = await Client.findOne({ brandId: brand._id, phone: normalizedPhone });

  if (client) {
    // Client exists - update serviceMapping if department not already present
    const hasService = client.serviceMapping.some(s => s.department === departmentCode);
    if (!hasService) {
      client.serviceMapping.push({
        department: departmentCode,
        isActive: true,
      });
      await client.save();
      return { status: 'updated', clientName: client.name, action: 'added_service' };
    }
    return { status: 'unchanged', clientName: client.name };
  }

  // Client doesn't exist - create new client
  // Copy serviceMapping from brand's services for this department
  const serviceMapping = [{
    department: departmentCode,
    isActive: true,
  }];

  client = new Client({
    brandId: brand._id,
    name: pocName,
    phone: normalizedPhone,
    serviceMapping,
    isActive: true,
  });

  await client.save();
  return { status: 'created', clientName: pocName };
};

/**
 * Process all POCs for a department
 */
const processDepartmentPOCs = async (pocs, departmentCode, departmentName) => {
  console.log(`\n📦 Processing ${departmentName} Department POCs...`);

  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let skipped = 0;
  const brandsNotFound = [];

  for (const poc of pocs) {
    const result = await updateOrCreateClient(poc, departmentCode);

    switch (result.status) {
      case 'created':
        created++;
        console.log(`  ✨ Created client: ${result.clientName} for ${poc.brandName}`);
        break;
      case 'updated':
        updated++;
        console.log(`  📝 Updated client: ${result.clientName} - added ${departmentCode} service`);
        break;
      case 'unchanged':
        unchanged++;
        break;
      case 'skipped':
        skipped++;
        break;
      case 'brand_not_found':
        if (!brandsNotFound.includes(result.brandName)) {
          brandsNotFound.push(result.brandName);
        }
        break;
    }
  }

  console.log(`  ✅ ${departmentName}: ${created} created, ${updated} updated, ${unchanged} unchanged, ${skipped} skipped`);
  if (brandsNotFound.length > 0) {
    console.log(`  ⚠️  Brands not found: ${brandsNotFound.join(', ')}`);
  }

  return { created, updated, unchanged, skipped, brandsNotFound };
};

/**
 * Main function
 */
const main = async () => {
  console.log('🚀 Starting Client Update Script (Cycle 6)');
  console.log('================================================\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Process all departments
    const results = {};

    results.solutions = await processDepartmentPOCs(SOLUTIONS_POCS, 'solutions', 'SOLUTIONS');
    results.smp = await processDepartmentPOCs(SMP_POCS, 'smp', 'SMP');
    results.media = await processDepartmentPOCs(MEDIA_POCS, 'media', 'MEDIA');
    results.fluence = await processDepartmentPOCs(FLUENCE_POCS, 'fluence', 'FLUENCE');
    results.seo = await processDepartmentPOCs(SEO_POCS, 'seo', 'SEO');
    results.tech = await processDepartmentPOCs(TECH_POCS, 'tech', 'TECH');
    results.martech = await processDepartmentPOCs(MARTECH_POCS, 'martech', 'MARTECH');

    // Summary
    console.log('\n================================================');
    console.log('✅ Client Update Complete!');
    console.log('================================================\n');

    let totalCreated = 0;
    let totalUpdated = 0;
    const allBrandsNotFound = new Set();

    for (const [result] of Object.entries(results)) {
      totalCreated += result.created;
      totalUpdated += result.updated;
      result.brandsNotFound.forEach(b => allBrandsNotFound.add(b));
    }

    console.log('📊 Summary:');
    console.log(`   Total clients created: ${totalCreated}`);
    console.log(`   Total clients updated: ${totalUpdated}`);

    if (allBrandsNotFound.size > 0) {
      console.log('\n⚠️  Brands that need to be created first:');
      allBrandsNotFound.forEach(b => console.log(`   - ${b}`));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

main();
