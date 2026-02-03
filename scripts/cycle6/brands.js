/**
 * Seed Script - Brands & Clients with SBU Mappings (Cycle 6 - Solutions)
 * 
 * Features:
 * - Creates new brands if they don't exist
 * - Updates existing brands with new/updated services
 * - Merges department arrays (preserves existing, adds new)
 * - Creates/updates clients (POCs) for each brand
 * 
 * Run with: node scripts/cycle6/brands.js
 * Run AFTER: node scripts/cycle6/seedSBUs.js (SBUs must exist to link)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SBU, Brand, Client } from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
}

/**
 * Department name to code mapping
 */
const DEPT_CODE_MAP = {
    'Brand Solutions': 'solutions',
    Media: 'media',
    Tech: 'tech',
    SEO: 'seo',
    MarTech: 'martech',
    Fluence: 'fluence',
    SMP: 'smp',
};

/**
 * SBU (POD) Lead to SBU Entity Name Mapping
 */
const SBU_LEAD_TO_SBU_MAP = {
    'Chirag': 'SBU Global India',
    'Samarth': 'SBU Next Wave',
    'Shreya': 'SBU For the Craft',
    'Sumesh': 'Bangalore',
    'Vrinda': 'SBU Corporate India',
    'Amit': 'SBU India Prime',
    'Dhruv + Malka': 'SBU Impact India',
    'Dhruv + Aniket': 'SBU India Rising 1',
    'Dhruv + Ria': 'SBU India Rising 2',
    'Dhruv + Jainik': 'SBU India Rising 3',
    'Rohan + Batul + Reuben': 'SBU India on the Move 1',
    'Rohan + Yohann': 'SBU India on the Move 2',
    'Afshaad': 'SBU Luxe',
    'Afshaad + Eric': 'SBU For the Arts',
    'Rohan + Varsha': 'SBU GenHer',
};

/**
 * SBU (POD) to Brand Mappings - Cycle 6 Solutions Brands
 */
const SBU_BRAND_MAP = {
    'SBU Global India': [
        'Glow & Lovely',
        'Bajaj Almond',
        'Bridgestone Tyres',
        'Bookmyshow',
        'Sanofi Allergy',
        'Medimix',
        'Huggies',
        'Gyproc',
        'Amazon SEA',
        'Amazon FUSE',
    ],
    'SBU Next Wave': [
        'Marvel + Disney',
        'London Dairy',
        'Allegro',
        'Riot Games - Valorant',
        'Riot Games - League Of Legends',
        'Dominos',
        'Celio',
        'Eureka Forbes',
        'Britannia',
        'Crompton',
        'Fair and Handsome',
        'Exotica / Pure Glow',
        'Voltas',
    ],
    'SBU For the Craft': ['ITC Hotels', 'Wok and Roll'],
    Bangalore: [
        'Himalaya PartySmart',
        'Pot and Bloom',
        'Krafton',
        'ITC Limited Corporate',
        'ITC HR',
    ],
    'SBU Corporate India': ['Jockey', 'Oriana', 'Ample Group'],
    'SBU India Prime': [
        'AM/NS',
        'UltraTech Cement',
        'Nerolac',
        'Milton',
        'Treo',
        'Procook',
        'Dr. Fixit',
        'Specta Surfaces',
        'Safari Genie',
        'Metro',
        'Mochi',
        'Visa',
        'GAIN by Galderma',
        'Hamilton D2C',
        'Tata Cliq Lifestyle',
        'TATA Cliq Palette',
    ],
    'SBU Impact India': [
        'Philips',
        'iQOO',
        'Cavin Kare',
        'Max Protein',
        'IIFL',
        'Optimum Nutrition + Isopure',
        'Dabur Hajmola',
    ],
    'SBU India Rising 1': [
        'Fevicol',
        'Fiama',
        'Kotak 811 + Kotak 811 (Fin For All)',
        'Hobby Ideas',
        'Charmis + Dermafique',
        'Vivel',
        'Engage',
    ],
    'SBU India Rising 2': [
        'HDFC Bank',
        'Phoenix Marketcity',
        'Britannia Cakes',
        'Britannia Breads',
        'Britannia Croissant',
        'Britannia Rusk',
        'Britannia Cheese',
        'Britannia Winkin Cow and Come Alive',
        "Dr. Reddy's Laboratories",
    ],
    'SBU India Rising 3': ['Apollo Hospitals'],
    'SBU India on the Move 1': [
        'HDFC Life',
        'Skybags Luggage',
        'Skybags Backpack',
        'Episoft',
        'Bonito Design',
        'HDFC Ergo',
        'Flair pens',
        'Pierre Cardin',
        'Meraki Habitat',
        'Torrent Electricals',
        'Hauser Germany',
    ],
    'SBU India on the Move 2': [
        'Castrol POWER1',
        'Castrol Magnatec/ Cars',
        'Greencell NueGo',
        'Mahindra Rise',
        'Aditya Birla Paints',
        'CRIF High Mark',
    ],
    'SBU GenHer': [
        'Mukul Madhav Foundation',
        'Reliance Foundation',
        'Shiv Nadar Foundation',
        'Godrej Design Labs',
        'Cochlear',
        'INTABCPA',
        'Aditya Birla Novel',
        'Her Circle',
        'Nanhi Kali',
        'Kaabil',
        'Indriya',
    ],
    'SBU Luxe': [
        'Kerastase',
        "Kiehl's",
        'Lancome',
        "L'oreal Redken",
        'ICA Pidilite',
        'Simpolo',
        "L'oreal Professionnel",
        'Kumari Jewels',
        'Louis Philippe',
        'Cerave',
    ],
    'SBU For the Arts': [
        'Nita Mukesh Ambani Cultural Centre (NMACC)',
        'Encore',
        'Jio World Convention Centre (JWCC)',
        'Vantara',
        'Vantara Niwas',
        'Reliance Jio',
    ],
};

/**
 * Brand Data with Services - Cycle 6 Solutions Brands
 * All brands listed are for Brand Solutions department
 */
const BRAND_DATA = [
    // Chirag (SBU Global India)
    { name: 'Glow & Lovely', services: ['Brand Solutions'] },
    { name: 'Bajaj Almond', services: ['Brand Solutions'] },
    { name: 'Bridgestone Tyres', services: ['Brand Solutions'] },
    { name: 'Bookmyshow', services: ['Brand Solutions'] },
    { name: 'Sanofi Allergy', services: ['Brand Solutions'] },
    { name: 'Medimix', services: ['Brand Solutions'] },
    { name: 'Huggies', services: ['Brand Solutions'] },
    { name: 'Gyproc', services: ['Brand Solutions'] },
    { name: 'Amazon SEA', services: ['Brand Solutions'] },
    { name: 'Amazon FUSE', services: ['Brand Solutions'] },

    // Samarth (SBU Next Wave)
    { name: 'Marvel + Disney', services: ['Brand Solutions'] },
    { name: 'London Dairy', services: ['Brand Solutions'] },
    { name: 'Allegro', services: ['Brand Solutions'] },
    { name: 'Riot Games - Valorant', services: ['Brand Solutions'] },
    { name: 'Riot Games - League Of Legends', services: ['Brand Solutions'] },
    { name: 'Dominos', services: ['Brand Solutions'] },
    { name: 'Celio', services: ['Brand Solutions'] },
    { name: 'Eureka Forbes', services: ['Brand Solutions'] },
    { name: 'Britannia', services: ['Brand Solutions'] },
    { name: 'Crompton', services: ['Brand Solutions'] },
    { name: 'Fair and Handsome', services: ['Brand Solutions'] },
    { name: 'Exotica / Pure Glow', services: ['Brand Solutions'] },
    { name: 'Voltas', services: ['Brand Solutions'] },

    // Shreya (SBU For the Craft)
    { name: 'ITC Hotels', services: ['Brand Solutions'] },
    { name: 'Wok and Roll', services: ['Brand Solutions'] },

    // Sumesh (Bangalore)
    { name: 'Himalaya PartySmart', services: ['Brand Solutions'] },
    { name: 'Pot and Bloom', services: ['Brand Solutions'] },
    { name: 'Krafton', services: ['Brand Solutions'] },
    { name: 'ITC Limited Corporate', services: ['Brand Solutions'] },
    { name: 'ITC HR', services: ['Brand Solutions'] },

    // Vrinda (SBU Corporate India)
    { name: 'Jockey', services: ['Brand Solutions'] },
    { name: 'Oriana', services: ['Brand Solutions'] },
    { name: 'Ample Group', services: ['Brand Solutions'] },

    // Amit (SBU India Prime)
    { name: 'AM/NS', services: ['Brand Solutions'] },
    { name: 'UltraTech Cement', services: ['Brand Solutions'] },
    { name: 'Nerolac', services: ['Brand Solutions'] },
    { name: 'Milton', services: ['Brand Solutions'] },
    { name: 'Treo', services: ['Brand Solutions'] },
    { name: 'Procook', services: ['Brand Solutions'] },
    { name: 'Dr. Fixit', services: ['Brand Solutions'] },
    { name: 'Specta Surfaces', services: ['Brand Solutions'] },
    { name: 'Safari Genie', services: ['Brand Solutions'] },
    { name: 'Metro', services: ['Brand Solutions'] },
    { name: 'Mochi', services: ['Brand Solutions'] },
    { name: 'Visa', services: ['Brand Solutions'] },
    { name: 'GAIN by Galderma', services: ['Brand Solutions'] },
    { name: 'Hamilton D2C', services: ['Brand Solutions'] },
    { name: 'Tata Cliq Lifestyle', services: ['Brand Solutions'] },
    { name: 'TATA Cliq Palette', services: ['Brand Solutions'] },

    // Dhruv + Malka (SBU Impact India)
    { name: 'Philips', services: ['Brand Solutions'] },
    { name: 'iQOO', services: ['Brand Solutions'] },
    { name: 'Cavin Kare', services: ['Brand Solutions'] },
    { name: 'Max Protein', services: ['Brand Solutions'] },
    { name: 'IIFL', services: ['Brand Solutions'] },
    { name: 'Optimum Nutrition + Isopure', services: ['Brand Solutions'] },
    { name: 'Dabur Hajmola', services: ['Brand Solutions'] },

    // Dhruv + Aniket (SBU India Rising 1)
    { name: 'Fevicol', services: ['Brand Solutions'] },
    { name: 'Fiama', services: ['Brand Solutions'] },
    { name: 'Kotak 811 + Kotak 811 (Fin For All)', services: ['Brand Solutions'] },
    { name: 'Hobby Ideas', services: ['Brand Solutions'] },
    { name: 'Charmis + Dermafique', services: ['Brand Solutions'] },
    { name: 'Vivel', services: ['Brand Solutions'] },
    { name: 'Engage', services: ['Brand Solutions'] },

    // Dhruv + Ria (SBU India Rising 2)
    { name: 'HDFC Bank', services: ['Brand Solutions'] },
    { name: 'Phoenix Marketcity', services: ['Brand Solutions'] },
    { name: 'Britannia Cakes', services: ['Brand Solutions'] },
    { name: 'Britannia Breads', services: ['Brand Solutions'] },
    { name: 'Britannia Croissant', services: ['Brand Solutions'] },
    { name: 'Britannia Rusk', services: ['Brand Solutions'] },
    { name: 'Britannia Cheese', services: ['Brand Solutions'] },
    { name: 'Britannia Winkin Cow and Come Alive', services: ['Brand Solutions'] },
    { name: "Dr. Reddy's Laboratories", services: ['Brand Solutions'] },

    // Dhruv + Jainik (SBU India Rising 3)
    { name: 'Apollo Hospitals', services: ['Brand Solutions'] },

    // Rohan + Batul + Reuben (SBU India on the Move 1)
    { name: 'HDFC Life', services: ['Brand Solutions'] },
    { name: 'Skybags Luggage', services: ['Brand Solutions'] },
    { name: 'Skybags Backpack', services: ['Brand Solutions'] },
    { name: 'Episoft', services: ['Brand Solutions'] },
    { name: 'Bonito Design', services: ['Brand Solutions'] },
    { name: 'HDFC Ergo', services: ['Brand Solutions'] },
    { name: 'Flair pens', services: ['Brand Solutions'] },
    { name: 'Pierre Cardin', services: ['Brand Solutions'] },
    { name: 'Meraki Habitat', services: ['Brand Solutions'] },
    { name: 'Torrent Electricals', services: ['Brand Solutions'] },
    { name: 'Hauser Germany', services: ['Brand Solutions'] },

    // Rohan + Yohann (SBU India on the Move 2)
    { name: 'Castrol POWER1', services: ['Brand Solutions'] },
    { name: 'Castrol Magnatec/ Cars', services: ['Brand Solutions'] },
    { name: 'Greencell NueGo', services: ['Brand Solutions'] },
    { name: 'Mahindra Rise', services: ['Brand Solutions'] },
    { name: 'Aditya Birla Paints', services: ['Brand Solutions'] },
    { name: 'CRIF High Mark', services: ['Brand Solutions'] },

    // Afshaad (SBU Luxe)
    { name: 'Kerastase', services: ['Brand Solutions'] },
    { name: "Kiehl's", services: ['Brand Solutions'] },
    { name: 'Lancome', services: ['Brand Solutions'] },
    { name: "L'oreal Redken", services: ['Brand Solutions'] },
    { name: 'ICA Pidilite', services: ['Brand Solutions'] },
    { name: 'Simpolo', services: ['Brand Solutions'] },
    { name: "L'oreal Professionnel", services: ['Brand Solutions'] },
    { name: 'Kumari Jewels', services: ['Brand Solutions'] },
    { name: 'Louis Philippe', services: ['Brand Solutions'] },
    { name: 'Cerave', services: ['Brand Solutions'] },

    // Afshaad + Eric (SBU For the Arts)
    { name: 'Nita Mukesh Ambani Cultural Centre (NMACC)', services: ['Brand Solutions'] },
    { name: 'Encore', services: ['Brand Solutions'] },
    { name: 'Jio World Convention Centre (JWCC)', services: ['Brand Solutions'] },
    { name: 'Vantara', services: ['Brand Solutions'] },
    { name: 'Vantara Niwas', services: ['Brand Solutions'] },
    { name: 'Reliance Jio', services: ['Brand Solutions'] },

    // Rohan + Varsha (SBU GenHer)
    { name: 'Mukul Madhav Foundation', services: ['Brand Solutions'] },
    { name: 'Reliance Foundation', services: ['Brand Solutions'] },
    { name: 'Shiv Nadar Foundation', services: ['Brand Solutions'] },
    { name: 'Godrej Design Labs', services: ['Brand Solutions'] },
    { name: 'Cochlear', services: ['Brand Solutions'] },
    { name: 'INTABCPA', services: ['Brand Solutions'] },
    { name: 'Aditya Birla Novel', services: ['Brand Solutions'] },
    { name: 'Her Circle', services: ['Brand Solutions'] },
    { name: 'Nanhi Kali', services: ['Brand Solutions'] },
    { name: 'Kaabil', services: ['Brand Solutions'] },
    { name: 'Indriya', services: ['Brand Solutions'] },
];

/**
 * Brand POC Data - Cycle 6 Solutions
 * Maps brands to their POC information
 */
const BRAND_POC_DATA = {
    'Glow & Lovely': [
        { name: 'Rahul Mittal', phone: '9971114795' },
        { name: 'Suraj Shukla', phone: '9702859986' },
    ],
    'Bajaj Almond': [{ name: 'Sonal Singh', phone: '9711981493' }],
    'Bridgestone Tyres': [
        { name: 'Sumedha Sharma', phone: '9953251989' },
        { name: 'Pradeep', phone: '7350016051' },
    ],
    Bookmyshow: [
        { name: 'Akansha Singh', phone: '9870317808' },
        { name: 'Niyati Shah', phone: '9619574517' },
    ],
    'Sanofi Allergy': [
        { name: 'Bhavna Kewalramani', phone: '9820256674' },
        { name: 'Roohani Nayyar', phone: '9654848305' },
    ],
    Medimix: [
        { name: 'Pooja Suchak', phone: '8976075027' },
        { name: 'Siddhartha', phone: '9953606758' },
        { name: 'Rupa Murudkar', phone: '9073927966' },
    ],
    Huggies: [
        { name: 'Shantanu', phone: '7045305490' },
        { name: 'Pratik', phone: '9953948545' },
        { name: 'Iti Bhadani', phone: '9953895484' },
        { name: 'Shweta Vig', phone: '9743775021' },
    ],
    Gyproc: [
        { name: 'Ankur Bali', phone: '9833999165' },
        { name: 'Divyesh Panchal', phone: '9819123198' },
    ],
    'Amazon SEA': [{ name: 'Michelle Chua', phone: 'NA' }],
    'Amazon FUSE': [{ name: 'Alejandra Hurtado', phone: 'NA' }],
    'Marvel + Disney': [
        { name: 'Bhavya Chopra', phone: '9867066763' },
        { name: 'Aditi Singh', phone: '9769936558' },
    ],
    'London Dairy': [
        { name: 'Vipul Yadav', phone: '9833393092' },
        { name: 'Sayantan Bose', phone: '7506075920' },
    ],
    Allegro: [
        { name: 'Vipul Yadav', phone: '9833393092' },
        { name: 'Sayantan Bose', phone: '7506075920' },
    ],
    'Riot Games - Valorant': [
        { name: 'Harsh Sinha', phone: '8879949141' },
        { name: 'Anushka Bhatnagar', phone: '8959178078' },
    ],
    'Riot Games - League Of Legends': [
        { name: 'Harsh Sinha', phone: '8879949141' },
        { name: 'Anushka Bhatnagar', phone: '8959178078' },
    ],
    Dominos: [{ name: 'Surabhi Prasoon', phone: '8299775274' }],
    Celio: [
        { name: 'Rafiq Shaikh', phone: '9833202153' },
        { name: 'Rejoy Rajan', phone: '9686188441' },
    ],
    'Eureka Forbes': [{ name: 'Vatsal Dedhia', phone: '9653295037' }],
    Britannia: [
        { name: 'Shree Das', phone: '9718294118' },
        { name: 'Divya Deora', phone: '8826512124' },
    ],
    Crompton: [{ name: 'Vaibhav Joshi', phone: '9699393165' }],
    'Fair and Handsome': [{ name: 'Vijay Gupta', phone: '9819945331' }],
    'Exotica / Pure Glow': [{ name: 'Vijay Gupta', phone: '9819945331' }],
    Voltas: [{ name: 'Drishti Ramchandani', phone: '9623276511' }],
    'ITC Hotels': [{ name: 'Ishita', phone: '7889811148' }],
    'Wok and Roll': [{ name: 'Anupam', phone: '9886088181' }],
    'Himalaya PartySmart': [
        { name: 'Sunil Waghmode', phone: '9167712818' },
        { name: 'Shayri', phone: '8697425210' },
    ],
    'Pot and Bloom': [
        { name: 'Anand', phone: '9740455788' },
        { name: 'Harpreet Kaur', phone: '9008325588' },
    ],
    Krafton: [{ name: 'Raunak Kapoor', phone: '9163153264' }],
    'ITC Limited Corporate': [
        { name: 'Naila Nasir', phone: '9319083208' },
        { name: 'Aurko Dasgupta', phone: '9831317083' },
        { name: 'Indranil Bhattacharjee', phone: '8017111545' },
    ],
    'ITC HR': [
        { name: 'Dhrthi Bhatt', phone: '9444341510' },
        { name: 'Ipsita Kar', phone: '9911983404' },
    ],
    Jockey: [
        { name: 'Ritika Sharma', phone: '8591481423' },
        { name: 'Swarn Pannu', phone: '9899574780' },
    ],
    Oriana: [
        { name: 'Rajagopalan M', phone: '7904206683' },
        { name: 'Jayaraman', phone: '9600113655' },
        { name: 'Taruna', phone: '9158779152' },
        { name: 'Abraham', phone: '9663855927' },
    ],
    'Ample Group': [
        { name: 'Nabeel Ahmed', phone: '8792488536' },
        { name: 'Sandhya Gurung', phone: '9513686095' },
        { name: 'Sunny Bose', phone: '9731292002' },
    ],
    'AM/NS': [
        { name: 'Om Bhojani', phone: '9769764336' },
        { name: 'Meet Pandit', phone: '8238784922' },
        { name: 'Piyush Mishra', phone: '7211184610' },
        { name: 'Tushar Makkar', phone: '9810437303' },
        { name: 'Soumitra Patnaik', phone: '9937012643' },
    ],
    'UltraTech Cement': [
        { name: 'Vaibhav Tripathi', phone: '9833345858' },
        { name: 'Avadhoot Davandkar', phone: '9619177699' },
        { name: 'Kanupriya Didwaniya', phone: '9967717670' },
    ],
    Nerolac: [
        { name: 'Sushant', phone: '9892568511' },
        { name: 'Shrenik Shah', phone: '9819076500' },
    ],
    Milton: [
        { name: 'Umangi Desai', phone: '8600720959' },
        { name: 'Priyanka Datta', phone: '8130778113' },
        { name: 'Arindam Panda', phone: '8697722299' },
    ],
    Treo: [
        { name: 'Shreya Bangariya', phone: '9116788099' },
        { name: 'Priyanka Datta', phone: '8130778113' },
        { name: 'Arindam Panda', phone: '8697722299' },
    ],
    Procook: [
        { name: 'Ananya Vaghani', phone: '9867750993' },
        { name: 'Priyanka Datta', phone: '8130778113' },
        { name: 'Arindam Panda', phone: '8697722299' },
    ],
    'Dr. Fixit': [
        { name: 'Aakash Maurya', phone: '8898191944' },
        { name: 'Parth Desai', phone: '9769943531' },
    ],
    'Specta Surfaces': [
        { name: 'Abhishek Agarwal', phone: '7982498162' },
        { name: 'Ankit Jain', phone: '9829485255' },
    ],
    'Safari Genie': [
        { name: 'Purvai Aggarwal', phone: '9818326107' },
        { name: 'Shishir Kumar', phone: '9588616839' },
        { name: 'Nidish Garg', phone: '9619860068' },
    ],
    Metro: [
        { name: 'Simona Bhansal', phone: '9521364499' },
        { name: 'Aastha Mantri', phone: '9987292109' },
        { name: 'Harsh Shah', phone: '9833345457' },
    ],
    Mochi: [
        { name: 'Siddhita Ghosalkar', phone: '8291016806' },
        { name: 'Aastha Mantri', phone: '9987292109' },
        { name: 'Harsh Shah', phone: '9833345457' },
    ],
    Visa: [
        { name: 'Avinash Srivastava', phone: '8840807394' },
        { name: 'Richa Batra', phone: '9810993747' },
    ],
    'GAIN by Galderma': [{ name: 'Sneha Miyani', phone: '9930089911' }],
    'Hamilton D2C': [{ name: 'Priyanka Datta', phone: '8130778113' }],
    'Tata Cliq Lifestyle': [
        { name: 'Aishwarya Nikam', phone: '9892154181' },
        { name: 'Anurima Rastogi', phone: '9873735197' },
        { name: 'Dimple Ramchandani', phone: '9029308382' },
    ],
    'TATA Cliq Palette': [
        { name: 'Aishwarya Nikam', phone: '9892154181' },
        { name: 'Zaianb Pardawala', phone: '9619771168' },
        { name: 'Sakshi Chandak', phone: '9623121871' },
    ],
    Philips: [{ name: 'Kanishka Garbyal', phone: '9891433015' }],
    iQOO: [
        { name: 'Suchit Chopra', phone: '9811117939' },
        { name: 'Rashi Anthony', phone: '9910879402' },
    ],
    'Cavin Kare': [
        { name: 'Vasanth Dhinakaran', phone: '9176472527' },
        { name: 'Akashivan Suresh', phone: '9791052222' },
    ],
    'Max Protein': [
        { name: 'Shivam', phone: '9594890660' },
        { name: 'Ravinder Verma', phone: '9930002878' },
    ],
    IIFL: [{ name: 'Mritunjay Bisht', phone: '9867528257' }],
    'Optimum Nutrition + Isopure': [
        { name: 'Amit Midha', phone: '9999371335' },
        { name: 'Sakshi Pingley', phone: '9920938034' },
    ],
    'Dabur Hajmola': [
        { name: 'Gyan Ranjan', phone: '9873737338' },
        { name: 'Mohit Sharma', phone: '8447779269' },
    ],
    Fevicol: [
        { name: 'Disha', phone: '9819631263' },
        { name: 'Jessica', phone: '9920379383' },
        { name: 'Parth Desai', phone: '9769943531' },
        { name: 'Rajiv', phone: '9819713550' },
    ],
    Fiama: [
        { name: 'Geetika Khanna', phone: '9999742934' },
        { name: 'Vaishnavi Singh', phone: '9546583838' },
    ],
    'Kotak 811 + Kotak 811 (Fin For All)': [
        { name: 'Adil Merchant', phone: '9967328906' },
        { name: 'Kaveeta Buder', phone: '9920939497' },
    ],
    'Hobby Ideas': [
        { name: 'Isha Amin', phone: '9987024742' },
        { name: 'Shruti Nair', phone: '9619909636' },
    ],
    'Charmis + Dermafique': [
        { name: 'Priya Jajoo', phone: '9833791214' },
        { name: 'Shivaalika Julka', phone: '8240069147' },
    ],
    Vivel: [
        { name: 'Manu Bhatotia', phone: '8585010200' },
        { name: 'Reema Shrivastav', phone: '8286259566' },
        { name: 'Mansee Mohta', phone: '7044008857' },
    ],
    Engage: [
        { name: 'Minakshi Handa', phone: '9920397022' },
        { name: 'Mohit Yadav', phone: '9167722607' },
        { name: 'Jayanthi sreenivasan', phone: '7257828753' },
        { name: 'Anukiti Dwivedi', phone: '8437903326' },
        { name: 'Namrita Khurana', phone: '9748185433' },
        { name: 'Shivaalika Julka', phone: '8240069147' },
        { name: 'Mohit Joshi', phone: '9163190908' },
        { name: 'Tauqeer Siddiqui', phone: '8013088104' },
    ],
    'HDFC Bank': [
        { name: 'Dipti Nadkarni', phone: '9819661191' },
        { name: 'Akhil', phone: '9987564471' },
        { name: 'Alisha', phone: '9769171848' },
        { name: 'Jiniya', phone: '9319602232' },
    ],
    'Phoenix Marketcity': [
        { name: 'Shefali Kothari', phone: '8657334606' },
        { name: 'Anant Patil', phone: '9886826268' },
    ],
    'Britannia Cakes': [
        { name: 'Sayali Thakur', phone: '9930222455' },
        { name: 'Avijit Saha', phone: '9748099899' },
        { name: 'Rajat Sharma', phone: '9923553971' },
    ],
    'Britannia Breads': [{ name: 'Vaishali Malik', phone: '7838981707' }],
    'Britannia Croissant': [{ name: 'Robin Gupta', phone: '9886360035' }],
    'Britannia Rusk': [
        { name: 'Shekhar Agarwal', phone: '9945854650' },
        { name: 'Neha Taneja', phone: '7798071202' },
    ],
    'Britannia Cheese': [
        { name: 'Pankhuri Agrawal', phone: '8982376177' },
        { name: 'Arjun', phone: '9820463215' },
    ],
    'Britannia Winkin Cow and Come Alive': [
        { name: 'Vibha Patel', phone: '8618910719' },
        { name: 'Vignesh Srinivasan', phone: '8329480922' },
        { name: 'Srushti Gupta', phone: '8295289073' },
    ],
    "Dr. Reddy's Laboratories": [
        { name: 'Teena', phone: '9930227341' },
        { name: 'Harshith', phone: '7989190494' },
    ],
    'Apollo Hospitals': [{ name: 'Tishya Prajapati', phone: '9014000253' }],
    'HDFC Life': [
        { name: 'Ria Das', phone: '7045301998' },
        { name: 'Robin Potbhare', phone: '8080847778' },
    ],
    'Skybags Luggage': [{ name: 'Smita Singla', phone: '8800387779' }],
    'Skybags Backpack': [{ name: 'Smita Singla', phone: '8800387779' }],
    Episoft: [
        { name: 'Venkat Kiran', phone: '9819017413' },
        { name: 'Sagar Naidu', phone: '9769844075' },
    ],
    'Bonito Design': [{ name: 'Keerthi', phone: '6360830441' }],
    'HDFC Ergo': [
        { name: 'Yogesh Gadekar', phone: '9004091601' },
        { name: 'Aishwarya Menon', phone: '9833023981' },
    ],
    'Flair pens': [
        { name: 'Chirag Koli', phone: '9769900469' },
        { name: 'Shalini Rathod', phone: '9820636222' },
    ],
    'Pierre Cardin': [{ name: 'Chirag Koli', phone: '9769900469' }],
    'Meraki Habitat': [{ name: 'Samir Savla', phone: '' }],
    'Torrent Electricals': [{ name: 'Anjali Jotwani', phone: '9601986101' }],
    'Hauser Germany': [
        { name: 'Shalini Rathod', phone: '9820636222' },
        { name: 'Chirag Koli', phone: '9769900469' },
    ],
    'Castrol POWER1': [
        { name: 'Gaurav Khatri', phone: '9130098805' },
        { name: 'Radhika Gokhale', phone: '8879689407' },
    ],
    'Castrol Magnatec/ Cars': [{ name: 'Rhea Ghosh', phone: '9831199072' }],
    'Greencell NueGo': [{ name: 'Vishal gundetty', phone: '9920697652' }],
    'Mahindra Rise': [
        { name: 'Avantika', phone: '9833779503' },
        { name: 'Shilpi Dubey Pathak', phone: '9004082459' },
    ],
    'Aditya Birla Paints': [
        { name: 'Trisha Chhabra', phone: '9619065981' },
        { name: 'Diya Nahar', phone: '7387663694' },
    ],
    'CRIF High Mark': [
        { name: 'Garima Singh', phone: '9819037898' },
        { name: 'Greeshma Nachane', phone: '9920959673' },
    ],
    Kerastase: [
        { name: 'Smridhi Kapur', phone: '8368979592' },
        { name: 'Tishya Relia', phone: '9819968564' },
    ],
    "Kiehl's": [{ name: 'Avanee Parulekar', phone: '9920242841' }],
    Lancome: [
        { name: 'Avanee Parulekar', phone: '9920242841' },
        { name: 'Divya Kalra', phone: '9711862718' },
        { name: 'Smruthi Rajagopal', phone: '9841154231' },
    ],
    "L'oreal Redken": [
        { name: 'Gurleen Bhasin', phone: '9769016631' },
        { name: 'Vidhi Dhruv', phone: '9619714546' },
        { name: 'Ananya Lamba', phone: '9650056623' },
    ],
    'ICA Pidilite': [
        { name: 'Kavita Jalan', phone: '9321004545' },
        { name: 'Ajay Bhatia', phone: '9920140092' },
    ],
    Simpolo: [
        { name: 'Deep Aghara', phone: '8511356222' },
        { name: 'Nilotpal Chakraborty', phone: '9974408808' },
    ],
    "L'oreal Professionnel": [
        { name: 'Shreya Mohan', phone: '9620991342' },
        { name: 'Aarfa Shaikh', phone: '9820600264' },
    ],
    'Kumari Jewels': [
        { name: 'Amit Bandi', phone: '8356851403' },
        { name: 'Ashish', phone: '9819413522' },
    ],
    'Louis Philippe': [
        { name: 'Akshita Kalia', phone: '9818155222' },
        { name: 'Deepika Tiwari', phone: '9886202726' },
    ],
    Cerave: [
        { name: 'Somarrita', phone: '9988889772' },
        { name: 'Manvi', phone: '7030724524' },
    ],
    'Nita Mukesh Ambani Cultural Centre (NMACC)': [
        { name: 'Truvya Babani', phone: '9619516247' },
    ],
    Encore: [{ name: 'Sachin Vishwakarma', phone: '9870559269' }],
    'Jio World Convention Centre (JWCC)': [
        { name: 'Truvya Babani', phone: '9619516247' },
    ],
    Vantara: [{ name: 'Dr Manilal Valliyate', phone: '9810523108' }],
    'Vantara Niwas': [
        { name: 'Pooja Upadhyay', phone: '8928191088' },
        { name: 'Saji Joseph', phone: '9274687400' },
    ],
    'Reliance Jio': [
        { name: 'Priyanka Dueskar', phone: '9769868666' },
        { name: 'Shvetank Naik', phone: '9820836661' },
    ],
    'Mukul Madhav Foundation': [
        { name: 'Shalom Paul', phone: '9503639864' },
        { name: 'Sumit Bhatia', phone: 'NA' },
    ],
    'Reliance Foundation': [
        { name: 'Vanshita Gudekar', phone: '8291688951' },
        { name: 'Utsav Tiwari', phone: '9321911641' },
    ],
    'Shiv Nadar Foundation': [
        { name: 'Jatin Dabas', phone: '9811665895' },
        { name: 'Anshul Adhikari', phone: '9953559049' },
    ],
    'Godrej Design Labs': [{ name: 'Ashita Misquitta', phone: '9920776008' }],
    Cochlear: [{ name: 'Samantha Mendonsa', phone: '9920238249' }],
    INTABCPA: [{ name: 'Zohra Baig', phone: '9820428590' }],
    'Aditya Birla Novel': [
        { name: 'Simran Talwar', phone: '9769808077' },
        { name: 'Delzeen Damania', phone: '9321539567' },
    ],
    'Her Circle': [{ name: 'Sonali Valecha', phone: '9930499792' }],
    'Nanhi Kali': [{ name: 'Priyanka Bhanushali', phone: '8452005769' }],
    Kaabil: [{ name: 'Kamakshi Shaligram', phone: '7738076449' }],
    Indriya: [
        { name: 'Simran Talwar', phone: '9769808077' },
        { name: 'Delzeen Damania', phone: '9321539567' },
        { name: 'Kavish Barapatre', phone: '9673047686' },
    ],
};

/**
 * Generate slug from brand name
 */
const generateSlug = name => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Build reverse mapping: brand name -> SBU name
 */
const buildBrandToSBUMap = () => {
    const map = {};
    Object.entries(SBU_BRAND_MAP).forEach(([sbuName, brands]) => {
        brands.forEach(brand => {
            map[brand] = sbuName;
        });
    });
    return map;
};

/**
 * Merge services array - adds new departments or updates existing ones
 * Preserves existing services, updates if department already exists
 */
const mergeServices = (existingServices, newServices) => {
    const serviceMap = new Map();

    // Add existing services to map
    existingServices.forEach(service => {
        serviceMap.set(service.department, service);
    });

    // Merge or add new services
    newServices.forEach(newService => {
        const existing = serviceMap.get(newService.department);
        if (existing) {
            // Update existing service with new SBU if provided
            if (newService.sbuId) {
                existing.sbuId = newService.sbuId;
            }
            existing.isActive = newService.isActive !== undefined ? newService.isActive : existing.isActive;
        } else {
            // Add new service
            serviceMap.set(newService.department, newService);
        }
    });

    return Array.from(serviceMap.values());
};

/**
 * Seed or Update Brands with SBU links
 */
async function seedBrands(sbuMap) {
    console.log('\n🏷️  Seeding/Updating Cycle 6 Solutions Brands...');

    // Build brand -> SBU mapping
    const brandToSBU = buildBrandToSBUMap();

    // Track brands for each SBU
    const sbuBrandsMap = {};

    let created = 0;
    let updated = 0;

    for (const brandData of BRAND_DATA) {
        try {
            const slug = generateSlug(brandData.name);

            // Find assigned SBU for this brand (for Brand Solutions)
            const sbuName = brandToSBU[brandData.name];
            const sbu = sbuName ? sbuMap[sbuName] : null;

            // Build services array with proper department codes and SBU links
            const newServices = brandData.services.map(serviceName => {
                const deptCode = DEPT_CODE_MAP[serviceName];
                const serviceEntry = {
                    department: deptCode,
                    isActive: true,
                    startDate: new Date(),
                };

                // Link SBU only for Brand Solutions department
                if (deptCode === 'solutions' && sbu) {
                    serviceEntry.sbuId = sbu._id;
                }

                return serviceEntry;
            });

            const existing = await Brand.findOne({ slug });
            let brandDoc;

            if (existing) {
                // Merge services - preserve existing, update/add new
                const mergedServices = mergeServices(existing.services || [], newServices);

                brandDoc = await Brand.findOneAndUpdate(
                    { slug },
                    {
                        name: brandData.name,
                        services: mergedServices,
                        isActive: true
                    },
                    { new: true }
                );
                updated++;
                if (sbu) {
                    console.log(`  ✓ Updated: ${brandData.name} (SBU: ${sbuName})`);
                } else {
                    console.log(`  ✓ Updated: ${brandData.name}`);
                }
            } else {
                brandDoc = await Brand.create({
                    name: brandData.name,
                    slug,
                    services: newServices,
                    isActive: true,
                });
                created++;
                if (sbu) {
                    console.log(`  ✓ Created: ${brandData.name} (SBU: ${sbuName})`);
                } else {
                    console.log(`  ✓ Created: ${brandData.name}`);
                }
            }

            // Track brand for SBU update
            if (sbu && brandDoc) {
                if (!sbuBrandsMap[sbu._id.toString()]) {
                    sbuBrandsMap[sbu._id.toString()] = [];
                }
                sbuBrandsMap[sbu._id.toString()].push(brandDoc._id);
            }
        } catch (error) {
            console.error(`  ✗ Failed to seed ${brandData.name}:`, error.message);
        }
    }

    console.log(`\n✅ Brands: ${created} created, ${updated} updated`);

    return sbuBrandsMap;
}

/**
 * Seed or Update Clients (POCs) for brands
 */
async function seedClients() {
    console.log('\n👥 Seeding/Updating Cycle 6 Clients (POCs)...');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const [brandName, pocs] of Object.entries(BRAND_POC_DATA)) {
        try {
            const slug = generateSlug(brandName);
            const brand = await Brand.findOne({ slug });

            if (!brand) {
                console.log(`  ⚠ Brand not found: ${brandName}, skipping POCs...`);
                skipped += pocs.length;
                continue;
            }

            for (const poc of pocs) {
                // Skip if phone is empty or NA
                if (!poc.phone || poc.phone === 'NA' || poc.phone.trim() === '') {
                    console.log(`  ⚠ Skipping ${poc.name} (no valid phone)`);
                    skipped++;
                    continue;
                }

                // Normalize phone number
                const normalizedPhone = poc.phone.replace(/\s+/g, '').replace(/-/g, '');

                try {
                    // Check if client exists for this brand and phone
                    const existingClient = await Client.findOne({
                        brandId: brand._id,
                        phone: normalizedPhone,
                    });

                    // Build service mapping from brand's services
                    const serviceMapping = brand.services
                        .filter(s => s.isActive)
                        .map(s => ({
                            department: s.department,
                            isActive: true,
                        }));

                    if (existingClient) {
                        // Update existing client
                        await Client.findByIdAndUpdate(existingClient._id, {
                            name: poc.name,
                            serviceMapping,
                            isActive: true,
                        });
                        updated++;
                        console.log(`  ✓ Updated POC: ${poc.name} (${brandName})`);
                    } else {
                        // Create new client
                        await Client.create({
                            brandId: brand._id,
                            name: poc.name,
                            phone: normalizedPhone,
                            serviceMapping,
                            isActive: true,
                        });
                        created++;
                        console.log(`  ✓ Created POC: ${poc.name} (${brandName})`);
                    }
                } catch (error) {
                    if (error.code === 11000) {
                        // Duplicate key error - try to update instead
                        console.log(`  ⚠ Duplicate POC found, updating: ${poc.name}`);
                        await Client.findOneAndUpdate(
                            { brandId: brand._id, phone: normalizedPhone },
                            { name: poc.name, isActive: true },
                            { new: true }
                        );
                        updated++;
                    } else {
                        console.error(`  ✗ Failed to seed POC ${poc.name}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error(`  ✗ Failed to process brand ${brandName}:`, error.message);
        }
    }

    console.log(`\n✅ Clients (POCs): ${created} created, ${updated} updated, ${skipped} skipped`);
}

/**
 * Update SBUs with their associated brand IDs
 */
async function updateSBUBrands(sbuBrandsMap) {
    console.log('\n🔗 Updating SBUs with brand references...');

    let updated = 0;

    for (const [sbuId, brandIds] of Object.entries(sbuBrandsMap)) {
        try {
            // Get existing brands for this SBU
            const sbu = await SBU.findById(sbuId);
            const existingBrandIds = (sbu?.brands || []).map(id => id.toString());

            // Merge existing and new brand IDs (avoid duplicates)
            const allBrandIds = [...new Set([
                ...existingBrandIds,
                ...brandIds.map(id => id.toString())
            ])];

            await SBU.findByIdAndUpdate(sbuId, {
                brands: allBrandIds.map(id => new mongoose.Types.ObjectId(id))
            });
            updated++;
        } catch (error) {
            console.error(`  ✗ Failed to update SBU ${sbuId}:`, error.message);
        }
    }

    console.log(`✅ Updated ${updated} SBUs with brand references`);
}

/**
 * Main Seed Function
 */
async function seed() {
    console.log('🌱 Starting Cycle 6 Brand & Client Seeding...\n');
    console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

    try {
        await mongoose.connect(MONGODB_URI);

        console.log('✅ Connected to MongoDB');

        // Get all SBUs mapped by name
        const sbus = await SBU.find({});
        const sbuMap = {};
        sbus.forEach(sbu => {
            const slug = generateSlug(sbu.name);
            sbuMap[slug] = sbu;
            sbuMap[sbu.name] = sbu;
        });

        console.log(`📋 Found ${sbus.length} SBUs`);

        // Seed/Update Brands
        const sbuBrandsMap = await seedBrands(sbuMap);

        // Update SBUs with their brand references
        await updateSBUBrands(sbuBrandsMap);

        // Seed/Update Clients (POCs)
        await seedClients();

        console.log('\n🎉 Cycle 6 Brand & Client seeding completed successfully!');

        // Summary
        const brandCount = await Brand.countDocuments();
        const clientCount = await Client.countDocuments();
        const brandsWithSBU = await Brand.countDocuments({
            'services.sbuId': { $ne: null },
        });
        const sbusWithBrands = await SBU.countDocuments({
            brands: { $exists: true, $ne: [] },
        });

        console.log('\n📊 Database Summary:');
        console.log(`   Total Brands: ${brandCount}`);
        console.log(`   Total Clients (POCs): ${clientCount}`);
        console.log(`   Brands with SBU: ${brandsWithSBU}`);
        console.log(`   SBUs with Brands: ${sbusWithBrands}`);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Export for use in other scripts
export { BRAND_DATA, BRAND_POC_DATA, SBU_BRAND_MAP, SBU_LEAD_TO_SBU_MAP };

// Run seed
seed();
