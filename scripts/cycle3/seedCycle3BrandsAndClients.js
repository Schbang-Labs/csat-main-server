/**
 * Seed Script - Cycle 3 Brands and Clients
 *
 * This script:
 * 1. Checks if brands exist in DB, if not creates them with isActive: false and empty services
 * 2. Seeds all brand entries in brandHistory with brandId and cycleId 3
 * 3. Checks if clients exist in DB, if not creates them with isActive: false
 * 4. Seeds all clients in clientHistory with cycleId 3
 *
 * Run with: node scripts/cycle3/seedCycle3BrandsAndClients.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  Brand,
  Client,
  Cycle,
  BrandHistory,
  ClientHistory,
} from '../../src/models/index.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGO_URI is not defined in .env');
  process.exit(1);
}

// Department mapping
const DEPT_MAP = {
  Solutions: 'solutions',
  Media: 'media',
  Tech: 'tech',
  SEO: 'seo',
  MarTech: 'martech',
  Fluence: 'fluence',
  SMP: 'smp',
};

/**
 * Cycle 3 Brand Data from brand_service_segregation_cycle3.md
 * Format: { brand, poc, phone, services: [dept1, dept2, ...] }
 */
const CYCLE3_DATA = [
  {
    brand: 'Amazon Prime Video',
    poc: 'Sangeeta Joshi',
    phone: '9818252621',
    services: ['Solutions'],
  },
  {
    brand: 'Glow & Lovely',
    poc: 'Charchit Khatri',
    phone: '9424063072',
    services: ['Solutions'],
  },
  {
    brand: 'Glow & Lovely',
    poc: 'Aatmika Thakur',
    phone: '9572850317',
    services: ['Solutions'],
  },
  {
    brand: 'Glow & Lovely',
    poc: 'Suraj Shukla',
    phone: '9702859986',
    services: ['Solutions', 'Fluence'],
  },
  {
    brand: 'Alpenliebe',
    poc: 'Anurag Gupta',
    phone: '8130370322',
    services: ['Solutions'],
  },
  {
    brand: 'Alpenliebe',
    poc: 'Neeraj Mann',
    phone: '9582700864',
    services: ['Solutions'],
  },
  {
    brand: 'Alpenliebe',
    poc: 'Akshit Sobti',
    phone: '9597362245',
    services: ['Solutions'],
  },
  {
    brand: 'Happydent',
    poc: 'Siddhartha Kaushik',
    phone: '9582295899',
    services: ['Solutions'],
  },
  {
    brand: 'Happydent',
    poc: 'Saurabh Nath',
    phone: '9922429519',
    services: ['Solutions'],
  },
  {
    brand: 'Juzt Jelly + Center Fruit',
    poc: 'Karan Budhiraja',
    phone: '9717372505',
    services: ['Solutions'],
  },
  {
    brand: 'Juzt Jelly + Center Fruit',
    poc: 'Ronit Nandi',
    phone: '9432217487',
    services: ['Solutions'],
  },
  {
    brand: 'Juzt Jelly + Center Fruit',
    poc: 'Arjun Singh Brar',
    phone: '7757887798',
    services: ['Solutions'],
  },
  {
    brand: 'Juzt Jelly + Center Fruit',
    poc: 'Akarsh Sood',
    phone: '9560580880',
    services: ['SMP'],
  },
  {
    brand: 'Centrefruit Kumbh',
    poc: 'Saumya Sanyal',
    phone: '8170003880',
    services: ['SMP'],
  },
  {
    brand: 'PVMI (Perfetti Employer)',
    poc: 'Arif Khan',
    phone: '9999447711',
    services: ['Solutions'],
  },
  {
    brand: 'Centerfresh',
    poc: 'Abhishek De',
    phone: '8745091911',
    services: ['Solutions', 'Fluence'],
  },
  {
    brand: 'Centerfresh',
    poc: 'Sumedha Anand',
    phone: '9910400706',
    services: ['Solutions'],
  },
  {
    brand: 'Mentos',
    poc: 'Manan Dhawan',
    phone: '7045696914',
    services: ['Solutions'],
  },
  {
    brand: 'Mentos',
    poc: 'Nitin Joy',
    phone: '9790046221',
    services: ['Solutions'],
  },
  {
    brand: 'Mentos',
    poc: 'Shaina Sharma',
    phone: '8802121984',
    services: ['Solutions'],
  },
  {
    brand: 'Huggies',
    poc: 'Aditya Pendharkar',
    phone: '8446772753',
    services: ['Solutions'],
  },
  {
    brand: 'Huggies',
    poc: 'Akanksha Sagar',
    phone: '8447157081',
    services: ['Solutions'],
  },
  {
    brand: 'Huggies',
    poc: 'Iti Bhadani',
    phone: '9953895484',
    services: ['Solutions'],
  },
  {
    brand: 'Bajaj Almond',
    poc: 'Sonal Singh',
    phone: '9711981493',
    services: ['Solutions'],
  },
  {
    brand: 'Gyproc',
    poc: 'Niharika Gujar',
    phone: '9867260445',
    services: ['Solutions'],
  },
  {
    brand: 'Gyproc',
    poc: 'Aninda Gupta',
    phone: '9594027908',
    services: ['Solutions'],
  },
  {
    brand: 'Maybelline',
    poc: 'Ishani Chakrabarti',
    phone: '8582948850',
    services: ['Solutions'],
  },
  {
    brand: 'Maybelline',
    poc: 'Anila Saldanha',
    phone: '9664452750',
    services: ['Solutions'],
  },
  {
    brand: 'Maybelline',
    poc: 'Vibhuti Varma',
    phone: '9910017441',
    services: ['Solutions', 'SMP'],
  },
  {
    brand: 'Maybelline',
    poc: 'Pooja Gujral',
    phone: '9910372045',
    services: ['SMP'],
  },
  {
    brand: 'Maybelline',
    poc: 'Ashan Gupta',
    phone: '9891714458',
    services: ['SMP'],
  },
  {
    brand: 'Maybelline',
    poc: 'Nidhi Jadeja',
    phone: '9911795902',
    services: ['SMP'],
  },
  {
    brand: 'Enamor',
    poc: 'Ankita Banerjee',
    phone: '9716741127',
    services: ['Solutions'],
  },
  {
    brand: 'Bridgestone Tyres',
    poc: 'Sumedha Sharma',
    phone: '9953251989',
    services: ['Solutions', 'Media', 'Tech', 'SEO', 'MarTech', 'Fluence'],
  },
  {
    brand: 'Bridgestone Tyres',
    poc: 'Paritosh Koppikar',
    phone: '9967002720',
    services: ['Media', 'Tech', 'SEO', 'MarTech'],
  },
  {
    brand: 'Bookmyshow',
    poc: 'Akansha Singh',
    phone: '9870317808',
    services: ['Solutions'],
  },
  {
    brand: 'Bookmyshow',
    poc: 'Niyati Shah',
    phone: '9619574517',
    services: ['Solutions'],
  },
  {
    brand: 'Cartamundi',
    poc: 'Apurva Choughule',
    phone: '9930734180',
    services: ['Solutions', 'Fluence'],
  },
  {
    brand: 'Cartamundi',
    poc: 'Jigar Shah',
    phone: '9136294424',
    services: ['Solutions'],
  },
  {
    brand: 'Sanofi Allergy',
    poc: 'Bhavna Kewalramani',
    phone: '9820256674',
    services: ['Solutions', 'SMP'],
  },
  {
    brand: 'Sanofi Allergy',
    poc: 'Roohani Nayyar',
    phone: '9654848305',
    services: ['Solutions'],
  },
  {
    brand: 'Medimix',
    poc: 'Pooja Suchak',
    phone: '8976075027',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Medimix',
    poc: 'Tanya Navalkar',
    phone: '9769945757',
    services: ['Solutions'],
  },
  {
    brand: 'Medimix',
    poc: 'Rupa Murudkar',
    phone: '9073927966',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Medimix Date Night',
    poc: 'Priyanka Jaiswal',
    phone: '6292216701',
    services: ['SMP'],
  },
  {
    brand: 'Marvel + Disney',
    poc: 'Bhavya Chopra',
    phone: '9867066763',
    services: ['Solutions'],
  },
  {
    brand: 'London Dairy',
    poc: 'Vipul Yadav',
    phone: '9833393092',
    services: ['Solutions'],
  },
  {
    brand: 'London Dairy',
    poc: 'Patricia Dsouza',
    phone: '9820714498',
    services: ['Media', 'SMP'],
  },
  {
    brand: 'Riot Games - Valorant',
    poc: 'Harsh Sinha',
    phone: '8879949141',
    services: ['Solutions'],
  },
  {
    brand: 'Dominos',
    poc: 'Surabhi Prasoon',
    phone: '8299775274',
    services: ['Solutions'],
  },
  {
    brand: 'Dominos',
    poc: 'Meera Pawar',
    phone: '8860407408',
    services: ['Tech'],
  },
  {
    brand: 'Celio',
    poc: 'Rejoy Rajan',
    phone: '9686188441',
    services: ['Solutions'],
  },
  {
    brand: 'Celio',
    poc: 'Rafiq Shaikh',
    phone: '7718815765',
    services: ['Fluence'],
  },
  {
    brand: 'Eureka Forbes',
    poc: 'Vatsal Dedhia',
    phone: '9653295037',
    services: ['Solutions'],
  },
  {
    brand: 'Eureka Forbes',
    poc: 'Manisha Kode',
    phone: '9662970080',
    services: ['Fluence'],
  },
  {
    brand: 'Eureka Forbes',
    poc: 'Harshal Patil',
    phone: '8830700617',
    services: [],
  },
  {
    brand: 'Eureka Forbes',
    poc: 'Krupa Jhaveri',
    phone: '9833232385',
    services: ['MarTech'],
  },
  {
    brand: 'Eureka Forbes',
    poc: 'Shreya Naithani',
    phone: '7838552269',
    services: ['Fluence'],
  },
  {
    brand: 'Britannia',
    poc: 'Shree Das',
    phone: '9718294118',
    services: ['Solutions'],
  },
  {
    brand: 'Britannia',
    poc: 'Divya Deora',
    phone: '8826512124',
    services: ['Solutions'],
  },
  {
    brand: 'Crompton',
    poc: 'Vaibhav Joshi',
    phone: '9699393165',
    services: ['Solutions'],
  },
  {
    brand: 'Fair and Handsome',
    poc: 'Vijay Gupta',
    phone: '9819945331',
    services: ['Solutions'],
  },
  {
    brand: 'Mukul Madhav Foundation',
    poc: 'Shalom Paul',
    phone: '9503639864',
    services: ['Solutions'],
  },
  {
    brand: 'Mukul Madhav Foundation',
    poc: 'Paresh Karan',
    phone: '9711000590',
    services: ['Solutions'],
  },
  {
    brand: 'Mukul Madhav Foundation',
    poc: 'Vinay Patil',
    phone: '8888815287',
    services: ['Fluence'],
  },
  {
    brand: 'Reliance Foundation',
    poc: 'Vanshita Gudekar',
    phone: '8291688951',
    services: ['Solutions'],
  },
  {
    brand: 'Reliance Foundation',
    poc: 'Utsav Tiwari',
    phone: '9321911641',
    services: ['Solutions'],
  },
  {
    brand: 'Shiv Nadar Foundation',
    poc: 'Jatin Dabas',
    phone: '9811665895',
    services: ['Solutions'],
  },
  {
    brand: 'Shiv Nadar Foundation',
    poc: 'Radhika Goel',
    phone: '8077603356',
    services: ['Solutions'],
  },
  {
    brand: 'Godrej Design Labs',
    poc: 'Ashita Misquitta',
    phone: '9920776008',
    services: ['Solutions'],
  },
  {
    brand: 'Godrej Design Labs',
    poc: 'Henry Skupniewicz',
    phone: '9825014578',
    services: ['Solutions'],
  },
  {
    brand: 'Cochlear',
    poc: 'Samantha Mendonsa',
    phone: '9920238249',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'ABCPA',
    poc: 'Zohra Baig',
    phone: '9820428590',
    services: ['Solutions'],
  },
  {
    brand: 'Aditya Birla Novel',
    poc: 'Simran Talwar',
    phone: '9769808077',
    services: ['Solutions', 'Fluence'],
  },
  {
    brand: 'Aditya Birla Novel',
    poc: 'Delzeen Damania',
    phone: '9321539567',
    services: ['Solutions'],
  },
  {
    brand: 'Her Circle',
    poc: 'Karishma Sen',
    phone: '9167341408',
    services: ['Solutions'],
  },
  {
    brand: 'Her Circle',
    poc: 'Sonali Valecha',
    phone: '9930499792',
    services: ['Solutions'],
  },
  {
    brand: 'Nanhi Kali',
    poc: 'Priyanka Bhanushali',
    phone: '8452005769',
    services: ['Solutions'],
  },
  {
    brand: 'Kaabil',
    poc: 'Kamakshi Shaligram',
    phone: '7738076449',
    services: ['Solutions'],
  },
  {
    brand: 'Kerastase',
    poc: 'Smridhi Kapur',
    phone: '8368979592',
    services: ['Solutions'],
  },
  {
    brand: 'Kerastase',
    poc: 'Tishya Relia',
    phone: '9819968564',
    services: ['Solutions'],
  },
  {
    brand: 'Kerastase',
    poc: 'Shubhra Puri',
    phone: '9810795751',
    services: ['Solutions'],
  },
  {
    brand: 'Kiehl\'s',
    poc: 'Avanee Parulekar',
    phone: '9920242841',
    services: ['Solutions'],
  },
  {
    brand: 'Lancome',
    poc: 'Divya Karla',
    phone: '9711862718',
    services: ['Solutions'],
  },
  {
    brand: 'Lancome',
    poc: 'Smruthi Rajagopal',
    phone: '9841154231',
    services: ['Solutions'],
  },
  {
    brand: 'L\'oreal Redken',
    poc: 'Gurleen Bhasin',
    phone: '9769016631',
    services: ['Solutions'],
  },
  {
    brand: 'L\'oreal Redken',
    poc: 'Vidhi Dhruv',
    phone: '9619714546',
    services: ['Solutions'],
  },
  {
    brand: 'L\'oreal Redken',
    poc: 'Ananya Lamba',
    phone: '9650056623',
    services: ['Solutions'],
  },
  {
    brand: 'ICA Pidilite',
    poc: 'Kavita Jalan',
    phone: '9321004545',
    services: ['Solutions'],
  },
  {
    brand: 'ICA Pidilite',
    poc: 'Ajay Bhatia',
    phone: '9920140092',
    services: ['Solutions'],
  },
  {
    brand: 'Simpolo',
    poc: 'Deep Aghara',
    phone: '8511356222',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Simpolo',
    poc: 'Nilotpal Chakraborty',
    phone: '9974408808',
    services: ['Solutions', 'Media', 'Fluence'],
  },
  {
    brand: 'Simpolo',
    poc: 'Devanshi Yagnik',
    phone: '6357301497',
    services: ['SMP'],
  },
  {
    brand: 'L\'oreal Professionnel',
    poc: 'sonia ravindran',
    phone: '8106424433',
    services: ['Solutions'],
  },
  {
    brand: 'Kumari Jewels',
    poc: 'Amit Bandi',
    phone: '8356851403',
    services: ['Solutions'],
  },
  {
    brand: 'Kumari Jewels',
    poc: 'Ashish Sharma',
    phone: '9819413522',
    services: ['Solutions', 'Media', 'SEO'],
  },
  {
    brand: 'Kumari Jewels',
    poc: 'Rahul Kumar',
    phone: '7900186687',
    services: ['Media', 'SEO'],
  },
  {
    brand: 'Louis Philippe',
    poc: 'Akshita Kalia',
    phone: '9818155222',
    services: ['Solutions'],
  },
  {
    brand: 'Cerave',
    poc: 'Somarrita',
    phone: '9988889772',
    services: ['Solutions'],
  },
  {
    brand: 'Cerave',
    poc: 'Manvi',
    phone: '7030724524',
    services: ['Solutions'],
  },
  {
    brand: 'NMACC and JWCC',
    poc: 'Truvya Babani',
    phone: '9619516247',
    services: ['Solutions'],
  },
  {
    brand: 'Reliance Jio',
    poc: 'Priyanka Dueskar',
    phone: '9769868666',
    services: ['Solutions'],
  },
  {
    brand: 'Reliance Jio',
    poc: 'Shvetank Naik',
    phone: '9820836661',
    services: ['Solutions'],
  },
  {
    brand: 'AM/NS',
    poc: 'Om Bhojani',
    phone: '9769764336',
    services: ['Solutions'],
  },
  {
    brand: 'AM/NS',
    poc: 'Meet Pandit',
    phone: '8238784922',
    services: ['Solutions'],
  },
  {
    brand: 'AM/NS',
    poc: 'Piyush Mishra',
    phone: '7211184610',
    services: ['Solutions'],
  },
  {
    brand: 'AM/NS',
    poc: 'Tushar Makkar',
    phone: '9810437303',
    services: ['Solutions'],
  },
  {
    brand: 'AM/NS',
    poc: 'Soumitra Patnaik',
    phone: '9937012643',
    services: ['Solutions'],
  },
  {
    brand: 'UltraTech Cement',
    poc: 'Vaibhav Tripathi',
    phone: '9833345858',
    services: ['Solutions'],
  },
  {
    brand: 'UltraTech Cement',
    poc: 'Kanupriya Didwaniya',
    phone: '9967717670',
    services: ['Solutions'],
  },
  {
    brand: 'UltraTech Cement',
    poc: 'Avadhoot Davandkar',
    phone: '9619177699',
    services: ['Solutions', 'SEO'],
  },
  {
    brand: 'UltraTech Cement',
    poc: 'Mahdi Syed',
    phone: '9819078651',
    services: ['SEO'],
  },
  {
    brand: 'Nerolac',
    poc: 'Sushant',
    phone: '9892568511',
    services: ['Solutions'],
  },
  {
    brand: 'Nerolac',
    poc: 'Shrenik Shah',
    phone: '9819076500',
    services: ['Solutions'],
  },
  {
    brand: 'Milton',
    poc: 'Umangi Desai',
    phone: '8600720959',
    services: ['Solutions'],
  },
  {
    brand: 'Milton',
    poc: 'Priyanka Datta',
    phone: '8130778113',
    services: ['Solutions'],
  },
  {
    brand: 'Milton',
    poc: 'Arindam Panda',
    phone: '8697722299',
    services: ['Solutions'],
  },
  {
    brand: 'Treo',
    poc: 'Shreya Bangariya',
    phone: '9116788099',
    services: ['Solutions'],
  },
  {
    brand: 'ProCook',
    poc: 'Ananya Vaghani',
    phone: '9867750993',
    services: ['Solutions'],
  },
  {
    brand: 'Dr. Fixit',
    poc: 'Aakash Maurya',
    phone: '8898191944',
    services: ['Solutions'],
  },
  {
    brand: 'Dr. Fixit',
    poc: 'Parth Desai',
    phone: '9769943531',
    services: ['Solutions'],
  },
  {
    brand: 'Specta Surfaces',
    poc: 'Abhishek Agarwal',
    phone: '7982498162',
    services: ['Solutions'],
  },
  {
    brand: 'Specta Surfaces',
    poc: 'Ankit Jain',
    phone: '9829485255',
    services: ['Solutions'],
  },
  {
    brand: 'Safari Genie',
    poc: 'Purvai Aggarwal',
    phone: '9818326107',
    services: ['Solutions'],
  },
  {
    brand: 'Safari Genie',
    poc: 'Shishir Kumar',
    phone: '9588616839',
    services: ['Solutions'],
  },
  {
    brand: 'Safari Genie',
    poc: 'Nidish Garg',
    phone: '9619860068',
    services: ['Solutions'],
  },
  {
    brand: 'Metro',
    poc: 'Simona Bhansal',
    phone: '9521364499',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Metro',
    poc: 'Aastha Mantri',
    phone: '9987292109',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Metro',
    poc: 'Harsh Shah',
    phone: '9833345457',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Mochi',
    poc: 'Siddhita Ghosalkar',
    phone: '8291016806',
    services: ['Solutions'],
  },
  {
    brand: 'Visa',
    poc: 'Avinash Srivastava',
    phone: '8840807394',
    services: ['Solutions'],
  },
  {
    brand: 'GAIN by Galderma',
    poc: 'Sneha Miyani',
    phone: '9930089911',
    services: ['Solutions'],
  },
  {
    brand: 'Hamilton D2C',
    poc: 'Shreyash',
    phone: '8356094977',
    services: ['MarTech'],
  },
  {
    brand: 'TATA Cliq Lifestyle',
    poc: 'Aishwarya Nikam',
    phone: '9892154181',
    services: ['Solutions'],
  },
  {
    brand: 'TATA Cliq Lifestyle',
    poc: 'Anurima Rastogi',
    phone: '9873735187',
    services: ['Solutions'],
  },
  {
    brand: 'TATA Cliq Lifestyle',
    poc: 'Dimple Ramchandani',
    phone: '9029308382',
    services: ['Solutions'],
  },
  {
    brand: 'TATA Cliq Palette',
    poc: 'Zaianb Pardawala',
    phone: '9619771168',
    services: ['Solutions'],
  },
  {
    brand: 'TATA Cliq Palette',
    poc: 'Sakshi Chandak',
    phone: '9623121871',
    services: ['Solutions'],
  },
  {
    brand: 'Fevicol',
    poc: 'Disha',
    phone: '9819631263',
    services: ['Solutions', 'SEO'],
  },
  {
    brand: 'Fevicol',
    poc: 'Jessica',
    phone: '9920379383',
    services: ['Solutions'],
  },
  {
    brand: 'Fevicol',
    poc: 'Rajiv',
    phone: '9819713550',
    services: ['Solutions'],
  },
  {
    brand: 'Fiama',
    poc: 'Geetika Khanna',
    phone: '9999742934',
    services: ['Solutions'],
  },
  {
    brand: 'Fiama',
    poc: 'Navya Banga',
    phone: '9958782197',
    services: ['Solutions'],
  },
  {
    brand: 'Fiama',
    poc: 'Vaishnavi Singh',
    phone: '9546583838',
    services: ['Solutions'],
  },
  {
    brand: 'Kotak811',
    poc: 'Shraddha Nathani',
    phone: '9820807710',
    services: ['Solutions'],
  },
  {
    brand: 'Kotak811',
    poc: 'Chirag Rege',
    phone: '9920399816',
    services: ['Solutions'],
  },
  {
    brand: 'Kotak811',
    poc: 'Adil Merchant',
    phone: '9967328906',
    services: ['Solutions'],
  },
  {
    brand: 'Kotak811',
    poc: 'Kaveeta Buder',
    phone: '9920939497',
    services: ['Solutions'],
  },
  {
    brand: 'Kotak811',
    poc: 'Sagar Shah',
    phone: '9987512824',
    services: ['Tech', 'MarTech'],
  },
  {
    brand: 'Kotak811',
    poc: 'Shankar',
    phone: '9930036101',
    services: ['Tech', 'MarTech'],
  },
  {
    brand: 'Kotak811',
    poc: 'Suhail Shaikh',
    phone: '7208232369',
    services: ['Tech', 'MarTech'],
  },
  {
    brand: 'Hobby Ideas',
    poc: 'Isha Amin',
    phone: '9987024742',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Hobby Ideas',
    poc: 'Rishika Moghe',
    phone: '9819369250',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Hobby Ideas',
    poc: 'Shruti Nair',
    phone: '9619909636',
    services: ['Solutions'],
  },
  {
    brand: 'Charmis + Dermafique',
    poc: 'Priya Jajoo',
    phone: '9833791214',
    services: ['Solutions'],
  },
  {
    brand: 'Charmis + Dermafique',
    poc: 'Shivaalika Julka',
    phone: '8240069147',
    services: ['Solutions'],
  },
  {
    brand: 'Charmis + Dermafique',
    poc: 'Saumya George',
    phone: '8335834242',
    services: ['Solutions'],
  },
  {
    brand: 'Vivel',
    poc: 'Manu Bhatotia',
    phone: '8585010200',
    services: ['Solutions'],
  },
  {
    brand: 'Vivel',
    poc: 'Reema Shrivastav',
    phone: '8286259566',
    services: ['Solutions'],
  },
  {
    brand: 'Vivel',
    poc: 'Mansee Mohta',
    phone: '7044008857',
    services: ['Solutions'],
  },
  {
    brand: 'Engage',
    poc: 'Jayanthi sreenivasan',
    phone: '7257828753',
    services: ['Solutions'],
  },
  {
    brand: 'Engage',
    poc: 'Anukiti Dwivedi',
    phone: '8437903326',
    services: ['Solutions'],
  },
  {
    brand: 'Engage',
    poc: 'Namrita Khurana',
    phone: '9748185433',
    services: ['Solutions'],
  },
  {
    brand: 'HDFC Bank',
    poc: 'Dipti Nadkarni',
    phone: '9819661191',
    services: ['Solutions'],
  },
  {
    brand: 'HDFC Bank',
    poc: 'Akhil Nile',
    phone: '9987564471',
    services: ['Solutions'],
  },
  {
    brand: 'Phoenix Marketcity',
    poc: 'Anant Patil',
    phone: '9886826268',
    services: ['Solutions'],
  },
  {
    brand: 'Britannia Cakes and Breads',
    poc: 'Sayali Thakur',
    phone: '9930222455',
    services: ['Solutions'],
  },
  {
    brand: 'Britannia Cakes and Breads',
    poc: 'Avijit Saha',
    phone: '9748099899',
    services: ['Solutions'],
  },
  {
    brand: 'Britannia Cakes and Breads',
    poc: 'Vaishali Malik',
    phone: '7838981707',
    services: ['Solutions'],
  },
  {
    brand: 'Britannia Cakes and Breads',
    poc: 'Rajat Sharma',
    phone: '9923553971',
    services: ['Solutions'],
  },
  {
    brand: 'Britannia Croissant',
    poc: 'Sumit Gattani',
    phone: '7588951823',
    services: ['Solutions'],
  },
  {
    brand: 'Britannia Croissant',
    poc: 'Robin Gupta',
    phone: '9886360035',
    services: ['Solutions'],
  },
  {
    brand: 'Britannia Rusk',
    poc: 'Shekhar Agarwal',
    phone: '9945854650',
    services: ['Solutions'],
  },
  {
    brand: 'Britannia Rusk',
    poc: 'Neha Taneja',
    phone: '7798071202',
    services: ['Solutions'],
  },
  {
    brand: 'Britannia Cheese',
    poc: 'Pankhuri Agrawal',
    phone: '8982376177',
    services: ['Solutions'],
  },
  {
    brand: 'Britannia Winkin Cow and Come Alive',
    poc: 'Ambika Suresh',
    phone: '9731633299',
    services: ['Solutions'],
  },
  {
    brand: 'Dr. Reddy\'s Laboratories',
    poc: 'Harshith',
    phone: '7989190494',
    services: ['Solutions', 'Fluence'],
  },
  {
    brand: 'Apollo Hospitals',
    poc: 'Tishya Prajapati',
    phone: '9014000253',
    services: ['Solutions'],
  },
  {
    brand: 'Apollo Hospitals',
    poc: 'Harshvardhan Koppula',
    phone: '9963833410',
    services: ['Solutions'],
  },
  {
    brand: 'Apollo Hospitals',
    poc: 'Charan Reddy',
    phone: '9705311188',
    services: ['Solutions'],
  },
  {
    brand: 'HDFC Life',
    poc: 'Ria Das',
    phone: '7045301998',
    services: ['Solutions'],
  },
  {
    brand: 'HDFC Life',
    poc: 'Robin Potbhare',
    phone: '8080847778',
    services: ['Solutions'],
  },
  {
    brand: 'Skybags Backpack',
    poc: 'Mutum Singh',
    phone: '9819013557',
    services: ['Solutions'],
  },
  {
    brand: 'Episoft',
    poc: 'Venkat Kiran',
    phone: '9819017413',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Episoft',
    poc: 'Sagar Naidu',
    phone: '9769844075',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Episoft',
    poc: 'Dev Bhatia',
    phone: '9967137183',
    services: ['Media'],
  },
  {
    brand: 'Bonito Design',
    poc: 'Keerthi',
    phone: '6360830441',
    services: ['Solutions'],
  },
  {
    brand: 'HDFC Ergo',
    poc: 'Yogesh Gadekar',
    phone: '9004091601',
    services: ['Solutions', 'Media', 'SMP'],
  },
  {
    brand: 'HDFC Ergo',
    poc: 'Aishwarya Menon',
    phone: '9833023981',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Flair pens',
    poc: 'Chirag Koli',
    phone: '9769900469',
    services: ['Solutions'],
  },
  {
    brand: 'Flair pens',
    poc: 'Shalini Rathod',
    phone: '9820636222',
    services: ['Solutions'],
  },
  {
    brand: 'Torrent Electricals',
    poc: 'Ajit Tyagi',
    phone: '9899107943',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Torrent Electricals',
    poc: 'Anjali Jotwani',
    phone: '9601986101',
    services: ['Solutions', 'SMP'],
  },
  {
    brand: 'Castrol POWER1',
    poc: 'Gaurav Khatri',
    phone: '9130098805',
    services: ['Solutions', 'Fluence'],
  },
  {
    brand: 'Castrol POWER1',
    poc: 'Radhika Gokhale',
    phone: '8879689407',
    services: ['Solutions'],
  },
  {
    brand: 'Castrol Magnatec/Cars',
    poc: 'Prakhar Jain',
    phone: '8879972041',
    services: ['Solutions'],
  },
  {
    brand: 'Castrol Magnatec/Cars',
    poc: 'Rhea Ghosh',
    phone: '9831199072',
    services: ['Solutions'],
  },
  {
    brand: 'Sapient Finserv',
    poc: 'Deepshikha',
    phone: '7099035215',
    services: ['Solutions'],
  },
  {
    brand: 'Mahindra Rise',
    poc: 'Avantika Chitlangia',
    phone: '9833779503',
    services: ['Solutions', 'Media', 'SMP'],
  },
  {
    brand: 'Mahindra Rise',
    poc: 'Shilpi Dubey Pathak',
    phone: '9004082459',
    services: ['Solutions'],
  },
  {
    brand: 'Mahindra Rise',
    poc: 'Brendon Fernandes',
    phone: '9930591739',
    services: ['Tech', 'SEO'],
  },
  {
    brand: 'Aditya Birla Paints',
    poc: 'Trisha Chhabra',
    phone: '9619065981',
    services: ['Solutions'],
  },
  {
    brand: 'Aditya Birla Paints',
    poc: 'Diya Nahar',
    phone: '7387663694',
    services: ['Solutions'],
  },
  {
    brand: 'CRIF High Mark',
    poc: 'Garima Singh',
    phone: '9819037898',
    services: ['Solutions'],
  },
  {
    brand: 'CRIF High Mark',
    poc: 'Greeshma Nachane',
    phone: '9920959673',
    services: ['Solutions'],
  },
  { brand: 'MTR', poc: 'Vibhor', phone: '9158769633', services: ['Solutions'] },
  {
    brand: 'ITC Hotels',
    poc: 'Ishita',
    phone: '7889811148',
    services: ['Solutions', 'Media'],
  },
  {
    brand: 'Tata Consumer Products',
    poc: 'Bob',
    phone: '7506366446',
    services: ['Solutions'],
  },
  {
    brand: 'McCain',
    poc: 'Sumati Kapoor',
    phone: '9953526233',
    services: ['Solutions', 'MarTech'],
  },
  {
    brand: 'McCain',
    poc: 'Srishti Mohapatra',
    phone: '8598931475',
    services: [],
  },
  {
    brand: 'McCain',
    poc: 'Surbhi Pandit',
    phone: '9821817033',
    services: ['Fluence'],
  },
  {
    brand: 'Wok and Roll',
    poc: 'Anupam',
    phone: '9886088181',
    services: ['Solutions'],
  },
  {
    brand: 'Himalaya PartySmart',
    poc: 'Sunil Waghmode',
    phone: '9167712818',
    services: ['Solutions'],
  },
  {
    brand: 'Pot and Bloom',
    poc: 'Anand',
    phone: '9740455788',
    services: ['Solutions', 'Tech', 'MarTech'],
  },
  {
    brand: 'Pot and Bloom',
    poc: 'Harpreet Kaur',
    phone: '9008325588',
    services: ['Solutions', 'Tech', 'MarTech', 'Fluence'],
  },
  {
    brand: 'Krafton',
    poc: 'Raunak Kapoor',
    phone: '9163153264',
    services: ['Solutions'],
  },
  {
    brand: 'ITC HR',
    poc: 'Priti Khaitan',
    phone: '8910952405',
    services: ['Solutions'],
  },
  {
    brand: 'ITC HR',
    poc: 'Ipsita Kar',
    phone: '9911983404',
    services: ['Solutions'],
  },
  {
    brand: 'Tata Neu FS',
    poc: 'Adithya Kamath',
    phone: '9741984655',
    services: ['Solutions'],
  },
  {
    brand: 'Tata Neu FS',
    poc: 'Akshay Sengupta',
    phone: '8007415155',
    services: ['Solutions'],
  },
  {
    brand: 'Tata Neu FS',
    poc: 'Arjun Bhutani',
    phone: '8007415155',
    services: ['Solutions'],
  },
  { brand: 'Tata Neu FS', poc: 'Divyanshi', phone: '8126232125', services: [] },
  {
    brand: 'Jockey',
    poc: 'Ritika Sharma',
    phone: '8591481423',
    services: ['Solutions', 'SEO', 'MarTech'],
  },
  {
    brand: 'Jockey',
    poc: 'Sourav Das',
    phone: '7829546760',
    services: ['Fluence'],
  },
  {
    brand: 'Oriana',
    poc: 'Rajagopalan M',
    phone: '7904206683',
    services: ['Solutions'],
  },
  {
    brand: 'Oriana',
    poc: 'Suresh Srinivas',
    phone: '9150094777',
    services: ['Solutions'],
  },
  {
    brand: 'Oriana',
    poc: 'Sreelatha',
    phone: '9150048770',
    services: ['Solutions'],
  },
  { brand: 'Oriana', poc: 'Litesh Sahadev', phone: '9444555351', services: [] },
  {
    brand: 'Amazon Fresh',
    poc: 'Abraham',
    phone: '9663855927',
    services: ['Solutions'],
  },
  {
    brand: 'Ample Group',
    poc: 'Nabeel Ahmed',
    phone: '8792488536',
    services: ['Solutions'],
  },
  {
    brand: 'Ample Group',
    poc: 'Sandhya Gurung',
    phone: '9513686095',
    services: ['Solutions', 'Fluence'],
  },
  {
    brand: 'Philips',
    poc: 'Anushka Panwar',
    phone: '7060199291',
    services: ['Solutions', 'SEO'],
  },
  {
    brand: 'Philips',
    poc: 'Kanishka Garbyal',
    phone: '9891433015',
    services: ['Solutions', 'SEO', 'Fluence'],
  },
  {
    brand: 'Cavin Kare',
    poc: 'Priyanka Baid',
    phone: '9884674840',
    services: ['Solutions'],
  },
  {
    brand: 'Cavin Kare',
    poc: 'Vasanth Dhinakaran',
    phone: '9176472527',
    services: ['Solutions'],
  },
  {
    brand: 'Cavin Kare',
    poc: 'Akashivan Suresh',
    phone: '9791052222',
    services: ['Solutions'],
  },
  {
    brand: 'Max Protein',
    poc: 'Shivam',
    phone: '9594890660',
    services: ['Solutions'],
  },
  {
    brand: 'Max Protein',
    poc: 'Ravinder Verma',
    phone: '9930002878',
    services: ['Solutions'],
  },
  {
    brand: 'IIFL',
    poc: 'Mritunjay Bisht',
    phone: '9867528257',
    services: ['Solutions'],
  },
  {
    brand: 'IIFL',
    poc: 'Anmol Somani',
    phone: '9540280351',
    services: ['Solutions'],
  },
  {
    brand: 'Optimum Nutrition + Isopure',
    poc: 'Amit Midha',
    phone: '9999371335',
    services: ['Solutions'],
  },
  {
    brand: 'Optimum Nutrition + Isopure',
    poc: 'Sakshi Pingley',
    phone: '9920938034',
    services: ['Solutions'],
  },
  {
    brand: 'Dabur Hajmola',
    poc: 'Gyan Ranjan',
    phone: '9873737338',
    services: ['Solutions'],
  },
  {
    brand: 'Dabur Hajmola',
    poc: 'Mohit Sharma',
    phone: '8447779269',
    services: ['Solutions'],
  },
  {
    brand: 'Dabur Oxy',
    poc: 'Aditi Rawat',
    phone: '7037300440',
    services: ['Solutions'],
  },
  {
    brand: 'Dabur Oxy',
    poc: 'Virat Khanna',
    phone: '7506260722',
    services: ['Solutions'],
  },
  {
    brand: 'Dabur Fem',
    poc: 'Vikram Simhan',
    phone: '9899821378',
    services: ['Solutions'],
  },
  {
    brand: 'Dabur Almond Oil',
    poc: 'Aman Gupta',
    phone: '9868771545',
    services: ['Solutions'],
  },
  {
    brand: 'Dabur Almond Oil',
    poc: 'Rakesh Tahiliani',
    phone: '9650029080',
    services: ['Solutions'],
  },
  {
    brand: 'Dabur Amla',
    poc: 'Abhishek Jain',
    phone: '7838192423',
    services: ['Solutions'],
  },
  {
    brand: 'Dabur Amla',
    poc: 'Jasleen Kohli',
    phone: '9873747230',
    services: ['Fluence'],
  },
  // Media-only brands
  {
    brand: 'Papa Don\'t Preach',
    poc: 'Viraj Anam',
    phone: '8767344972',
    services: ['Media'],
  },
  {
    brand: 'Fevicreate',
    poc: 'Anish Desai',
    phone: '9016767460',
    services: ['Media', 'SEO'],
  },
  {
    brand: 'JLL',
    poc: 'Omprakash Singh',
    phone: '9004595090',
    services: ['Media'],
  },
  {
    brand: 'JLL',
    poc: 'Sahil Suhag',
    phone: '9582798405',
    services: ['Media'],
  },
  {
    brand: 'Level Supermind',
    poc: 'Pranali Kadu',
    phone: '9834553221',
    services: ['Media'],
  },
  {
    brand: 'Armaf',
    poc: 'Sufyaan Moosani',
    phone: '8655077233',
    services: ['Media'],
  },
  {
    brand: 'Armaf',
    poc: 'Zahid Khan',
    phone: '9833380003',
    services: ['Media'],
  },
  {
    brand: 'Bodycraft',
    poc: 'Kapil Sharma',
    phone: '9971316899',
    services: ['Media', 'Tech', 'SEO'],
  },
  {
    brand: 'Bodycraft',
    poc: 'Riddhi Sharma',
    phone: '9724320003',
    services: ['Media', 'Tech', 'SEO'],
  },
  {
    brand: 'Bodycraft',
    poc: 'Roshni Khatri',
    phone: '9884076488',
    services: ['Media', 'Tech', 'SEO'],
  },
  {
    brand: 'Bodycraft',
    poc: 'Lakshmi Sunil Ranganathan',
    phone: '9845108212',
    services: ['Media', 'Tech', 'SEO'],
  },
  {
    brand: 'Tata Comm',
    poc: 'Isha Chhaya',
    phone: '8511123564',
    services: ['Media'],
  },
  {
    brand: 'Tata Comm',
    poc: 'Parag Lohar',
    phone: '7827067637',
    services: ['Media'],
  },
  {
    brand: 'ACCA',
    poc: 'Saahil Kalvani',
    phone: '9820835273',
    services: ['Media'],
  },
  {
    brand: 'Karnavati University',
    poc: 'Hemaang Gandhi',
    phone: '9879574787',
    services: ['Media'],
  },
  {
    brand: 'Groviva',
    poc: 'Natasha Lobo',
    phone: '9561112558',
    services: ['Media'],
  },
  {
    brand: 'Groviva',
    poc: 'Anjali Pawar',
    phone: '7972446697',
    services: ['Media'],
  },
  {
    brand: 'Indriya',
    poc: 'Rakshana Srikanth',
    phone: '9445057968',
    services: ['Media'],
  },
  {
    brand: 'Indriya',
    poc: 'Kavish Barapatre',
    phone: '9673047686',
    services: ['Media'],
  },
  {
    brand: 'Shiamak',
    poc: 'Sai Kumar',
    phone: '9652387716',
    services: ['Media'],
  },
  {
    brand: 'Shiamak',
    poc: 'Nitesh Sahani',
    phone: '9870200545',
    services: ['Media'],
  },
  // Tech-only brands
  {
    brand: 'BetterBath',
    poc: 'Aanhal Prithviraj',
    phone: '8007089229',
    services: ['Tech'],
  },
  {
    brand: 'TVS Credit',
    poc: 'Megha Vij',
    phone: '9646740249',
    services: ['Tech', 'SEO'],
  },
  {
    brand: 'Tata Communications',
    poc: 'Raunaq Bhatija',
    phone: '9582183313',
    services: ['Tech', 'MarTech'],
  },
  {
    brand: 'Tata Communications',
    poc: 'Radhika',
    phone: '9816109765',
    services: ['Tech', 'MarTech'],
  },
  {
    brand: 'Tata Communications',
    poc: 'Jyoti Vani',
    phone: '9930303420',
    services: ['Tech', 'MarTech'],
  },
  {
    brand: 'Pyrosens',
    poc: 'Suhani Darak',
    phone: '8233376711',
    services: ['Tech', 'SEO'],
  },
  {
    brand: 'Britannia Corporate',
    poc: 'Prabakaran K',
    phone: '9986416717',
    services: ['Tech', 'SEO'],
  },
  {
    brand: 'Sriram Life Insurance',
    poc: 'Rahul Adaniya',
    phone: '9930577107',
    services: ['Tech', 'SEO'],
  },
  {
    brand: 'Britannia CheeseitUp',
    poc: 'Nandita Kamath',
    phone: '9900815222',
    services: ['SEO', 'SMP'],
  },
  {
    brand: 'Birla Opus',
    poc: 'Aastha Narula',
    phone: '9999513285',
    services: ['Tech'],
  },
  {
    brand: 'HCCB',
    poc: 'Chiththarthann',
    phone: '8012047626',
    services: ['Tech', 'SEO'],
  },
  {
    brand: 'Jindal Steel',
    poc: 'Isha Sahni',
    phone: '9599698449',
    services: ['Tech', 'SEO'],
  },
  {
    brand: 'House of Bindu',
    poc: 'Villoo',
    phone: '9833047683',
    services: ['SEO'],
  },
  {
    brand: 'NueGo',
    poc: 'Deepti Sharma',
    phone: '9654264642',
    services: ['Media', 'SEO'],
  },
  {
    brand: 'NueGo',
    poc: 'Manisha Modi',
    phone: '8591122572',
    services: ['Media', 'SEO'],
  },
  {
    brand: 'NueGo',
    poc: 'Apurva Sharma',
    phone: '9819242252',
    services: ['Solutions', 'Media', 'SEO'],
  },
  {
    brand: 'NueGo',
    poc: 'Vishal Gundetty',
    phone: '9920697652',
    services: ['Solutions', 'Fluence'],
  },
  {
    brand: 'ICICI prudential',
    poc: 'Pranjal Gunjal',
    phone: '9967955926',
    services: [],
  },
  {
    brand: 'JL Morison',
    poc: 'Sabhayata Singh',
    phone: '7506361427',
    services: ['MarTech'],
  },
  {
    brand: 'JL Morison',
    poc: 'Bhakti Muchhala',
    phone: '9136569305',
    services: ['MarTech'],
  },
  {
    brand: 'Brookfield',
    poc: 'Salil Phatak',
    phone: '7709403778',
    services: ['Tech', 'SEO', 'MarTech'],
  },
  {
    brand: 'Brookfield',
    poc: 'Karthik Pillai',
    phone: '9833993177',
    services: ['Tech', 'SEO', 'MarTech'],
  },
  {
    brand: 'Ethos',
    poc: 'Suneel Gupta',
    phone: '9013373115',
    services: ['SEO'],
  },
  {
    brand: 'Everest',
    poc: 'Salman Merchant',
    phone: '8898420058',
    services: ['SEO'],
  },
  {
    brand: 'Everest',
    poc: 'Dhruvi Jamda',
    phone: '8097591987',
    services: ['SEO'],
  },
  {
    brand: 'Everest',
    poc: 'Shivani Shrivastava',
    phone: '9326260922',
    services: ['SEO'],
  },
  { brand: 'JWC', poc: 'Shivam Singh', phone: '8286360368', services: ['SEO'] },
  {
    brand: '5 Paisa',
    poc: 'Parag Kubal',
    phone: '9892058033',
    services: ['SEO'],
  },
  {
    brand: 'Nivea',
    poc: 'Prateek Gulati',
    phone: '9711834224',
    services: ['MarTech'],
  },
  // Fluence-only brands
  {
    brand: 'Britannia - Pure Magic',
    poc: 'Arushi Mittal',
    phone: '9999684089',
    services: ['Fluence'],
  },
  {
    brand: 'Britannia - Bourbon',
    poc: 'Swagatika Panda',
    phone: '7755977702',
    services: ['Fluence'],
  },
  {
    brand: 'BMS',
    poc: 'Tirth Thakkar',
    phone: '9833061980',
    services: ['Fluence'],
  },
  {
    brand: 'Huggies Wonder Pants',
    poc: 'Pratik Jain',
    phone: '9953948545',
    services: ['Fluence'],
  },
  {
    brand: 'Adani Realty',
    poc: 'Sakshi',
    phone: '9825085451',
    services: ['Fluence'],
  },
  {
    brand: 'Castrol CRB',
    poc: 'Shweta Pawar',
    phone: '9820394737',
    services: ['Fluence'],
  },
  {
    brand: 'Castrol Activ',
    poc: 'Ayush Garg',
    phone: '9654170396',
    services: ['Fluence'],
  },
  {
    brand: 'Sleepwell + Kurlon',
    poc: 'Prachi Garg',
    phone: '6290407143',
    services: ['Fluence'],
  },
  {
    brand: 'Tata Motors',
    poc: 'Rishuvee Malani',
    phone: '8109127012',
    services: ['Fluence'],
  },
  {
    brand: 'Lakeshore',
    poc: 'Janai',
    phone: '9833285430',
    services: ['Fluence'],
  },
  {
    brand: 'Boheco',
    poc: 'Disha Rajput',
    phone: '9004388299',
    services: ['Fluence'],
  },
  {
    brand: 'Zouk (Sea Turtle)',
    poc: 'Chhaya Naidu',
    phone: '8169197726',
    services: ['Fluence'],
  },
  {
    brand: 'Kalki Fashion',
    poc: 'Sanchita',
    phone: '7977062335',
    services: ['Fluence'],
  },
  // SMP-only brands
  {
    brand: 'Kinder Joy',
    poc: 'Gaurav Chauhan',
    phone: '7400462555',
    services: ['SMP'],
  },
  {
    brand: 'Meta',
    poc: 'Kriti Sharma',
    phone: '8196818634',
    services: ['SMP'],
  },
  {
    brand: 'Nykaa Supergoop',
    poc: 'Anushka Vaidya',
    phone: '9920321398',
    services: ['SMP'],
  },
  {
    brand: 'Nykaa Supergoop',
    poc: 'Vinita Daga Gawde',
    phone: '9819808468',
    services: ['SMP'],
  },
  {
    brand: 'Nykaa Supergoop',
    poc: 'Jamila Bootwala',
    phone: '9920816185',
    services: ['SMP'],
  },
  {
    brand: 'Nykaa Supergoop',
    poc: 'Hritika Malki',
    phone: '9870657957',
    services: ['SMP'],
  },
  {
    brand: 'Britannia 5050',
    poc: 'Vishisht',
    phone: '9497713231',
    services: ['SMP'],
  },
  { brand: 'Stayfree', poc: 'Saumya', phone: '7500682690', services: ['SMP'] },
  {
    brand: 'Mr.DIY',
    poc: 'Shirsendu Singha',
    phone: '9899592518',
    services: ['SMP'],
  },
  { brand: 'Mr.DIY', poc: 'Prasad', phone: '9892468222', services: ['SMP'] },
  { brand: 'Kurl-on', poc: 'Rishab', phone: '9819862062', services: ['SMP'] },
  {
    brand: 'L\'oreal Cofferet Box',
    poc: 'Zoya Petiwala',
    phone: '9619983534',
    services: ['SMP'],
  },
  {
    brand: 'L\'Oreal - S&N - PDP & Stop Motion',
    poc: 'Khushboo Shah',
    phone: '8779591197',
    services: ['SMP'],
  },
  {
    brand: 'Cred UPI - Performance assets',
    poc: 'Akshat Pandey',
    phone: '9980914802',
    services: ['SMP'],
  },
  {
    brand: 'Cred UPI - Performance assets',
    poc: 'Nilanjana Dutta',
    phone: '9619636649',
    services: ['SMP'],
  },
  {
    brand: 'ITC Limited Corporate',
    poc: 'Naila nasir',
    phone: '9319083208',
    services: ['Solutions'],
  },
  {
    brand: 'ITC Limited Corporate',
    poc: 'Aurko Dasgupta',
    phone: '9831317083',
    services: ['Solutions'],
  },
  {
    brand: 'ITC Limited Corporate',
    poc: 'Indranil Bhattacharjee',
    phone: '8017111545',
    services: ['Solutions'],
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
 * Get or create Cycle 3
 */
async function getOrCreateCycle3() {
  let cycle = await Cycle.findOne({ cycleNumber: 3, year: 2025 });

  if (!cycle) {
    cycle = await Cycle.create({
      name: 'Cycle 3',
      cycleNumber: 3,
      year: 2025,
      startDate: new Date(2025, 5, 1), // June 1
      endDate: new Date(2025, 7, 31, 23, 59, 59, 999), // August 31
      status: 'completed',
      isActive: false,
    });
    console.log('  ✓ Created Cycle 3 (2025)');
  } else {
    console.log('  ✓ Found existing Cycle 3 (2025)');
  }

  return cycle;
}

/**
 * Seed brands and brand history
 */
async function seedBrands(cycleId) {
  console.log('\n🏷️  Seeding Brands...');

  // Get unique brands from data
  const brandMap = new Map();

  for (const entry of CYCLE3_DATA) {
    if (!brandMap.has(entry.brand)) {
      brandMap.set(entry.brand, {
        name: entry.brand,
        services: new Set(),
        pocs: [],
      });
    }

    // Add services
    entry.services.forEach(s => brandMap.get(entry.brand).services.add(s));

    // Add POC
    brandMap.get(entry.brand).pocs.push({
      name: entry.poc,
      phone: entry.phone,
      services: entry.services,
    });
  }

  let brandsCreated = 0;
  let brandsFound = 0;
  let historyCreated = 0;

  for (const [brandName, brandData] of brandMap) {
    try {
      const slug = generateSlug(brandName);

      // Check if brand exists
      let brand = await Brand.findOne({ slug });

      if (!brand) {
        // Create new brand with isActive: false and empty services
        brand = await Brand.create({
          name: brandName,
          slug,
          services: [], // Empty services array as requested
          isActive: false, // isActive as false as requested
        });
        brandsCreated++;
        console.log(`  ✓ Created brand: ${brandName} (inactive)`);
      } else {
        brandsFound++;
        console.log(`  ○ Found existing brand: ${brandName}`);
      }

      // Build services array for history (with actual services from Cycle 3 data)
      const services = Array.from(brandData.services).map(serviceName => ({
        department: DEPT_MAP[serviceName],
        isActive: true,
      }));

      // Create/update brand history for Cycle 3
      await BrandHistory.findOneAndUpdate(
        { brandId: brand._id, cycleId },
        {
          brandId: brand._id,
          cycleId,
          name: brandName,
          slug,
          services,
          pocs: [], // Will be populated after clients are created
          snapshotReason: 'cycle_start',
        },
        { upsert: true, new: true }
      );
      historyCreated++;
    } catch (error) {
      console.error(`  ✗ Failed to seed brand ${brandName}:`, error.message);
    }
  }

  console.log(
    `\n✅ Brands: ${brandsCreated} created, ${brandsFound} found existing`
  );
  console.log(
    `✅ Brand History: ${historyCreated} entries created/updated for Cycle 3`
  );

  return brandMap;
}

/**
 * Seed clients and client history
 */
async function seedClients(cycleId, _brandMap) {
  console.log('\n👥 Seeding Clients...');

  let clientsCreated = 0;
  let clientsFound = 0;
  let historyCreated = 0;

  // Track brand -> client mappings for updating brandHistory.pocs
  const brandPocMap = new Map();

  for (const entry of CYCLE3_DATA) {
    try {
      const brandSlug = generateSlug(entry.brand);
      const brand = await Brand.findOne({ slug: brandSlug });

      if (!brand) {
        console.error(`  ✗ Brand not found: ${entry.brand}`);
        continue;
      }

      // Check if client exists (by brand + phone)
      let client = await Client.findOne({
        brandId: brand._id,
        phone: entry.phone,
      });

      // Build service mapping
      const serviceMapping = entry.services.map(s => ({
        department: DEPT_MAP[s],
        isActive: true,
      }));

      if (!client) {
        // Create new client with isActive: false
        client = await Client.create({
          brandId: brand._id,
          name: entry.poc,
          phone: entry.phone,
          serviceMapping,
          isActive: false, // isActive as false as requested
        });
        clientsCreated++;
        console.log(`  ✓ Created client: ${entry.poc} (${entry.brand})`);
      } else {
        clientsFound++;
      }

      // Create/update client history for Cycle 3
      await ClientHistory.findOneAndUpdate(
        { clientId: client._id, cycleId },
        {
          clientId: client._id,
          cycleId,
          brandId: brand._id,
          name: entry.poc,
          phone: entry.phone,
          serviceMapping,
          snapshotReason: 'cycle_start',
        },
        { upsert: true, new: true }
      );
      historyCreated++;

      // Track POC for brand
      if (!brandPocMap.has(brand._id.toString())) {
        brandPocMap.set(brand._id.toString(), []);
      }
      brandPocMap.get(brand._id.toString()).push(client._id);
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key - client already exists, skip
        clientsFound++;
      } else {
        console.error(`  ✗ Failed to seed client ${entry.poc}:`, error.message);
      }
    }
  }

  // Update brandHistory with POC references
  console.log('\n🔗 Updating Brand History with POC references...');
  for (const [brandId, pocIds] of brandPocMap) {
    await BrandHistory.findOneAndUpdate(
      { brandId: new mongoose.Types.ObjectId(brandId), cycleId },
      { pocs: pocIds }
    );
  }

  console.log(
    `\n✅ Clients: ${clientsCreated} created, ${clientsFound} found existing`
  );
  console.log(
    `✅ Client History: ${historyCreated} entries created/updated for Cycle 3`
  );
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting Cycle 3 Seeding...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get or create Cycle 3
    console.log('📅 Setting up Cycle 3...');
    const cycle = await getOrCreateCycle3();
    const cycleId = cycle._id; // Use ObjectId, not string

    // Seed brands and brand history
    const brandMap = await seedBrands(cycleId);

    // Seed clients and client history
    await seedClients(cycleId, brandMap);

    // Summary
    console.log('\n📊 Summary:');
    const brandCount = await Brand.countDocuments();
    const clientCount = await Client.countDocuments();
    const brandHistoryCount = await BrandHistory.countDocuments({ cycleId });
    const clientHistoryCount = await ClientHistory.countDocuments({ cycleId });

    console.log(`   Total Brands: ${brandCount}`);
    console.log(`   Total Clients: ${clientCount}`);
    console.log(`   Brand History (Cycle 3): ${brandHistoryCount}`);
    console.log(`   Client History (Cycle 3): ${clientHistoryCount}`);

    console.log('\n🎉 Cycle 3 seeding completed successfully!');
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
