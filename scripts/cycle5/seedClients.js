/**
 * Seed Script - Clients (POCs)
 * Populates client POCs with their contact info and service mappings
 *
 * Run with: node scripts/seedClients.js
 * Run AFTER: node scripts/seedBrands.js (clients reference brands)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Brand, Client } from '../../src/models/index.js';

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
 * Client POC Data from brand_service_segregation.md
 * Format: { brandName, name, phone, services[] }
 */
const CLIENT_DATA = [
  // Amazon SEA
  {
    brandName: 'Amazon SEA',
    name: 'Michelle Chua',
    phone: '1111111111',
    services: ['Brand Solutions'],
  },
  // Amazon FUSE
  {
    brandName: 'Amazon FUSE',
    name: 'Alejandra Hurtado',
    phone: '2222222222',
    services: ['Brand Solutions'],
  },
  // Glow & Lovely
  {
    brandName: 'Glow & Lovely',
    name: 'Rahul Mittal',
    phone: '9971114795',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Glow & Lovely',
    name: 'Suraj Shukla',
    phone: '9702859986',
    services: ['Brand Solutions', 'Fluence'],
  },
  // Bajaj Almond
  {
    brandName: 'Bajaj Almond',
    name: 'Sonal Singh',
    phone: '9711981493',
    services: ['Brand Solutions'],
  },
  // Bridgestone Tyres
  {
    brandName: 'Bridgestone Tyres',
    name: 'Sumedha Sharma',
    phone: '9953251989',
    services: ['Brand Solutions', 'Media', 'Tech', 'SEO', 'MarTech', 'Fluence'],
  },
  {
    brandName: 'Bridgestone Tyres',
    name: 'Pradeep',
    phone: '7350016051',
    services: ['Brand Solutions', 'Media'],
  },
  {
    brandName: 'Bridgestone Tyres',
    name: 'Paritosh Koppikar',
    phone: '9967002720',
    services: ['Tech', 'SEO', 'MarTech'],
  },
  // Bookmyshow
  {
    brandName: 'Bookmyshow',
    name: 'Akansha Singh',
    phone: '9870317808',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Bookmyshow',
    name: 'Niyati Shah',
    phone: '9619574517',
    services: ['Brand Solutions'],
  },
  // Sanofi Allergy
  {
    brandName: 'Sanofi Allergy',
    name: 'Bhavna Kewalramani',
    phone: '9820256674',
    services: ['Brand Solutions'],
  },
  // Medimix
  {
    brandName: 'Medimix',
    name: 'Pooja Suchak',
    phone: '8976075027',
    services: ['Brand Solutions', 'Media'],
  },
  {
    brandName: 'Medimix',
    name: 'Siddhartha',
    phone: '9953606758',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Medimix',
    name: 'Rupa Murudkar',
    phone: '9073927966',
    services: ['Brand Solutions'],
  },
  // Huggies
  {
    brandName: 'Huggies',
    name: 'Shantanu',
    phone: '7045305490',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Huggies',
    name: 'Pratik',
    phone: '9953948545',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Huggies',
    name: 'Iti Bhadani',
    phone: '9953895484',
    services: ['Brand Solutions', 'Fluence'],
  },
  {
    brandName: 'Huggies',
    name: 'Shweta Vig',
    phone: '9743775021',
    services: ['Brand Solutions'],
  },
  // Gyproc
  {
    brandName: 'Gyproc',
    name: 'Ankur Bali',
    phone: '9833999165',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Gyproc',
    name: 'Divyesh Panchal',
    phone: '9819123198',
    services: ['Brand Solutions'],
  },
  // Marvel + Disney
  {
    brandName: 'Marvel + Disney',
    name: 'Bhavya Chopra',
    phone: '9867066763',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Marvel + Disney',
    name: 'Aditi Singh',
    phone: '9769936558',
    services: ['Brand Solutions'],
  },
  // London Dairy
  {
    brandName: 'London Dairy',
    name: 'Vipul Yadav',
    phone: '9833393092',
    services: ['Brand Solutions', 'Media'],
  },
  {
    brandName: 'London Dairy',
    name: 'Sayantan Bose',
    phone: '7506075920',
    services: ['Brand Solutions'],
  },
  // Allegro
  {
    brandName: 'Allegro',
    name: 'Vipul Yadav',
    phone: '9833393092',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Allegro',
    name: 'Sayantan Bose',
    phone: '7506075920',
    services: ['Brand Solutions'],
  },
  // Riot Games - Valorant
  {
    brandName: 'Riot Games - Valorant',
    name: 'Harsh Sinha',
    phone: '8879949141',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Riot Games - Valorant',
    name: 'Anushka Bhatnagar',
    phone: '8959178078',
    services: ['Brand Solutions'],
  },
  // Riot Games - League Of Legends
  {
    brandName: 'Riot Games - League Of Legends',
    name: 'Harsh Sinha',
    phone: '8879949141',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Riot Games - League Of Legends',
    name: 'Anushka Bhatnagar',
    phone: '8959178078',
    services: ['Brand Solutions'],
  },
  // Dominos
  {
    brandName: 'Dominos',
    name: 'Surabhi Prasoon',
    phone: '8299775274',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Dominos',
    name: 'Meera Pawar',
    phone: '8860407408',
    services: ['Tech'],
  },
  // Celio
  {
    brandName: 'Celio',
    name: 'Rafiq Shaikh',
    phone: '9833202153',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Celio',
    name: 'Rejoy Rajan',
    phone: '9686188441',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Celio',
    name: 'Vibhuti Arte',
    phone: '9004935011',
    services: ['SMP'],
  },
  // Eureka Forbes
  {
    brandName: 'Eureka Forbes',
    name: 'Vatsal Dedhia',
    phone: '9653295037',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Eureka Forbes',
    name: 'Manisha Kode',
    phone: '9662970080',
    services: ['MarTech', 'Fluence'],
  },
  {
    brandName: 'Eureka Forbes',
    name: 'Harshal Patil',
    phone: '8830700617',
    services: ['MarTech'],
  },
  {
    brandName: 'Eureka Forbes',
    name: 'Krupa Jhaveri',
    phone: '9833232385',
    services: ['MarTech'],
  },
  {
    brandName: 'Eureka Forbes',
    name: 'Arth Patel',
    phone: '8000759596',
    services: ['Fluence'],
  },
  // Britannia
  {
    brandName: 'Britannia',
    name: 'Shree Das',
    phone: '9718294118',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Britannia',
    name: 'Divya Deora',
    phone: '8826512124',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Britannia',
    name: 'Arushi Mittal',
    phone: '9999684089',
    services: ['Fluence'],
  },
  // Crompton
  {
    brandName: 'Crompton',
    name: 'Vaibhav Joshi',
    phone: '9699393165',
    services: ['Brand Solutions'],
  },
  // Fair and Handsome
  {
    brandName: 'Fair and Handsome',
    name: 'Vijay Gupta',
    phone: '9819945331',
    services: ['Brand Solutions'],
  },
  // Exotica / Pure Glow
  {
    brandName: 'Exotica / Pure Glow',
    name: 'Vijay Gupta',
    phone: '9819945331',
    services: ['Brand Solutions'],
  },
  // Voltas
  {
    brandName: 'Voltas',
    name: 'Drishti Ramchandani',
    phone: '9623276511',
    services: ['Brand Solutions'],
  },
  // ITC Hotels
  {
    brandName: 'ITC Hotels',
    name: 'Ishita',
    phone: '7889811148',
    services: ['Brand Solutions'],
  },
  // Wok and Roll
  {
    brandName: 'Wok and Roll',
    name: 'Anupam',
    phone: '9886088181',
    services: ['Brand Solutions'],
  },
  // Himalaya PartySmart
  {
    brandName: 'Himalaya PartySmart',
    name: 'Sunil Waghmode',
    phone: '9167712818',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Himalaya PartySmart',
    name: 'Shayri',
    phone: '8697425210',
    services: ['Brand Solutions'],
  },
  // Pot and Bloom
  {
    brandName: 'Pot and Bloom',
    name: 'Anand',
    phone: '9740455788',
    services: ['Brand Solutions', 'Tech', 'MarTech'],
  },
  {
    brandName: 'Pot and Bloom',
    name: 'Harpreet Kaur',
    phone: '9008325588',
    services: ['Brand Solutions', 'Tech', 'SEO'],
  },
  // Krafton
  {
    brandName: 'Krafton',
    name: 'Raunak Kapoor',
    phone: '9163153264',
    services: ['Brand Solutions'],
  },
  // ITC Limited Corporate
  {
    brandName: 'ITC Limited Corporate',
    name: 'Naila Nasir',
    phone: '9319083208',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'ITC Limited Corporate',
    name: 'Aurko Dasgupta',
    phone: '9831317083',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'ITC Limited Corporate',
    name: 'Indranil Bhattacharjee',
    phone: '8017111545',
    services: ['Brand Solutions'],
  },
  // ITC HR
  {
    brandName: 'ITC HR',
    name: 'Dhrthi Bhatt',
    phone: '9444341510',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'ITC HR',
    name: 'Ipsita Kar',
    phone: '9911983404',
    services: ['Brand Solutions'],
  },
  // Jockey
  {
    brandName: 'Jockey',
    name: 'Ritika Sharma',
    phone: '8591481423',
    services: ['Brand Solutions', 'SEO', 'MarTech'],
  },
  {
    brandName: 'Jockey',
    name: 'Swarn Pannu',
    phone: '9899574780',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Jockey',
    name: 'Rekha Nahar',
    phone: '9980222061',
    services: ['SEO', 'MarTech'],
  },
  {
    brandName: 'Jockey',
    name: 'Divya Mishra',
    phone: '9739949967',
    services: ['MarTech'],
  },
  // Oriana
  {
    brandName: 'Oriana',
    name: 'Rajagopalan M',
    phone: '7904206683',
    services: ['Brand Solutions', 'Media'],
  },
  {
    brandName: 'Oriana',
    name: 'Jayaraman',
    phone: '9600113655',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Oriana',
    name: 'Taruna',
    phone: '9158779152',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Oriana',
    name: 'Abraham',
    phone: '9663855927',
    services: ['Brand Solutions'],
  },
  // Ample Group
  {
    brandName: 'Ample Group',
    name: 'Nabeel Ahmed',
    phone: '8792488536',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Ample Group',
    name: 'Sandhya Gurung',
    phone: '9513686095',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Ample Group',
    name: 'Sunny Bose',
    phone: '9731292002',
    services: ['Brand Solutions'],
  },
  // AM/NS
  {
    brandName: 'AM/NS',
    name: 'Om Bhojani',
    phone: '9769764336',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'AM/NS',
    name: 'Meet Pandit',
    phone: '8238784922',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'AM/NS',
    name: 'Piyush Mishra',
    phone: '7211184610',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'AM/NS',
    name: 'Tushar Makkar',
    phone: '9810437303',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'AM/NS',
    name: 'Soumitra Patnaik',
    phone: '9937012643',
    services: ['Brand Solutions'],
  },
  // UltraTech Cement
  {
    brandName: 'UltraTech Cement',
    name: 'Vaibhav Tripathi',
    phone: '9833345858',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'UltraTech Cement',
    name: 'Avadhoot Davandkar',
    phone: '9619177699',
    services: ['Brand Solutions', 'SEO'],
  },
  {
    brandName: 'UltraTech Cement',
    name: 'Kanupriya Didwaniya',
    phone: '9967717670',
    services: ['Brand Solutions'],
  },
  // Nerolac
  {
    brandName: 'Nerolac',
    name: 'Sushant',
    phone: '9892568511',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Nerolac',
    name: 'Shrenik Shah',
    phone: '9819076500',
    services: ['Brand Solutions'],
  },
  // Milton
  {
    brandName: 'Milton',
    name: 'Umangi Desai',
    phone: '8600720959',
    services: ['Brand Solutions', 'MarTech'],
  },
  {
    brandName: 'Milton',
    name: 'Priyanka Datta',
    phone: '8130778113',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Milton',
    name: 'Arindam Panda',
    phone: '8697722299',
    services: ['Brand Solutions'],
  },
  // Treo
  {
    brandName: 'Treo',
    name: 'Shreya Bangariya',
    phone: '9116788099',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Treo',
    name: 'Priyanka Datta',
    phone: '8130778113',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Treo',
    name: 'Arindam Panda',
    phone: '8697722299',
    services: ['Brand Solutions'],
  },
  // Procook
  {
    brandName: 'Procook',
    name: 'Ananya Vaghani',
    phone: '9867750993',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Procook',
    name: 'Priyanka Datta',
    phone: '8130778113',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Procook',
    name: 'Arindam Panda',
    phone: '8697722299',
    services: ['Brand Solutions'],
  },
  // Dr. Fixit
  {
    brandName: 'Dr. Fixit',
    name: 'Aakash Maurya',
    phone: '8898191944',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Dr. Fixit',
    name: 'Parth Desai',
    phone: '9769943531',
    services: ['Brand Solutions'],
  },
  // Specta Surfaces
  {
    brandName: 'Specta Surfaces',
    name: 'Abhishek Agarwal',
    phone: '7982498162',
    services: ['Brand Solutions', 'Media'],
  },
  {
    brandName: 'Specta Surfaces',
    name: 'Ankit Jain',
    phone: '9829485255',
    services: ['Brand Solutions'],
  },
  // Safari Genie
  {
    brandName: 'Safari Genie',
    name: 'Purvai Aggarwal',
    phone: '9818326107',
    services: ['Brand Solutions', 'Fluence'],
  },
  {
    brandName: 'Safari Genie',
    name: 'Shishir Kumar',
    phone: '9588616839',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Safari Genie',
    name: 'Nidish Garg',
    phone: '9619860068',
    services: ['Brand Solutions'],
  },
  // Metro
  {
    brandName: 'Metro',
    name: 'Simona Bhansal',
    phone: '9521364499',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Metro',
    name: 'Aastha Mantri',
    phone: '9987292109',
    services: ['Brand Solutions', 'Media'],
  },
  {
    brandName: 'Metro',
    name: 'Harsh Shah',
    phone: '9833345457',
    services: ['Brand Solutions', 'Media'],
  },
  // Mochi
  {
    brandName: 'Mochi',
    name: 'Siddhita Ghosalkar',
    phone: '8291016806',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Mochi',
    name: 'Aastha Mantri',
    phone: '9987292109',
    services: ['Brand Solutions', 'Media', 'Fluence'],
  },
  {
    brandName: 'Mochi',
    name: 'Harsh Shah',
    phone: '9833345457',
    services: ['Brand Solutions', 'Media'],
  },
  // Visa
  {
    brandName: 'Visa',
    name: 'Avinash Srivastava',
    phone: '8840807394',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Visa',
    name: 'Richa Batra',
    phone: '9810993747',
    services: ['Brand Solutions'],
  },
  // GAIN by Galderma
  {
    brandName: 'GAIN by Galderma',
    name: 'Sneha Miyani',
    phone: '9930089911',
    services: ['Brand Solutions'],
  },
  // Hamilton D2C
  {
    brandName: 'Hamilton D2C',
    name: 'Priyanka Datta',
    phone: '8130778113',
    services: ['Brand Solutions', 'MarTech'],
  },
  // Tata Cliq Lifestyle
  {
    brandName: 'Tata Cliq Lifestyle',
    name: 'Aishwarya Nikam',
    phone: '9892154181',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Tata Cliq Lifestyle',
    name: 'Anurima Rastogi',
    phone: '9873735197',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Tata Cliq Lifestyle',
    name: 'Dimple Ramchandani',
    phone: '9029308382',
    services: ['Brand Solutions'],
  },
  // TATA Cliq Palette
  {
    brandName: 'TATA Cliq Palette',
    name: 'Aishwarya Nikam',
    phone: '9892154181',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'TATA Cliq Palette',
    name: 'Zaianb Pardawala',
    phone: '9619771168',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'TATA Cliq Palette',
    name: 'Sakshi Chandak',
    phone: '9623121871',
    services: ['Brand Solutions'],
  },
  // Philips
  {
    brandName: 'Philips',
    name: 'Kanishka Garbyal',
    phone: '9891433015',
    services: ['Brand Solutions', 'SEO', 'Fluence'],
  },
  // iQOO
  {
    brandName: 'iQOO',
    name: 'Suchit Chopra',
    phone: '9811117939',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'iQOO',
    name: 'Rashi Anthony',
    phone: '9910879402',
    services: ['Brand Solutions'],
  },
  // Cavin Kare
  {
    brandName: 'Cavin Kare',
    name: 'Vasanth Dhinakaran',
    phone: '9176472527',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Cavin Kare',
    name: 'Akashivan Suresh',
    phone: '9791052222',
    services: ['Brand Solutions'],
  },
  // Max Protein
  {
    brandName: 'Max Protein',
    name: 'Shivam',
    phone: '9594890660',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Max Protein',
    name: 'Ravinder Verma',
    phone: '9930002878',
    services: ['Brand Solutions'],
  },
  // IIFL
  {
    brandName: 'IIFL',
    name: 'Mritunjay Bisht',
    phone: '9867528257',
    services: ['Brand Solutions'],
  },
  // Optimum Nutrition + Isopure
  {
    brandName: 'Optimum Nutrition + Isopure',
    name: 'Amit Midha',
    phone: '9999371335',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Optimum Nutrition + Isopure',
    name: 'Sakshi Pingley',
    phone: '9920938034',
    services: ['Brand Solutions'],
  },
  // Dabur Hajmola
  {
    brandName: 'Dabur Hajmola',
    name: 'Gyan Ranjan',
    phone: '9873737338',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Dabur Hajmola',
    name: 'Mohit Sharma',
    phone: '8447779269',
    services: ['Brand Solutions'],
  },
  // Fevicol
  {
    brandName: 'Fevicol',
    name: 'Disha',
    phone: '9819631263',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Fevicol',
    name: 'Jessica',
    phone: '9920379383',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Fevicol',
    name: 'Parth Desai',
    phone: '9769943531',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Fevicol',
    name: 'Rajiv',
    phone: '9819713550',
    services: ['Brand Solutions'],
  },
  // Fiama
  {
    brandName: 'Fiama',
    name: 'Geetika Khanna',
    phone: '9999742934',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Fiama',
    name: 'Vaishnavi Singh',
    phone: '9546583838',
    services: ['Brand Solutions'],
  },
  // Kotak 811 + Kotak 811 (Fin For All)
  {
    brandName: 'Kotak 811 + Kotak 811 (Fin For All)',
    name: 'Adil Merchant',
    phone: '9967328906',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Kotak 811 + Kotak 811 (Fin For All)',
    name: 'Kaveeta Buder',
    phone: '9920939497',
    services: ['Brand Solutions'],
  },
  // Hobby Ideas
  {
    brandName: 'Hobby Ideas',
    name: 'Isha Amin',
    phone: '9987024742',
    services: ['Brand Solutions', 'SEO'],
  },
  {
    brandName: 'Hobby Ideas',
    name: 'Shruti Nair',
    phone: '9619909636',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Hobby Ideas',
    name: 'Jay Desai',
    phone: '8600801263',
    services: ['Media'],
  },
  // Charmis + Dermafique
  {
    brandName: 'Charmis + Dermafique',
    name: 'Priya Jajoo',
    phone: '9833791214',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Charmis + Dermafique',
    name: 'Shivaalika Julka',
    phone: '8240069147',
    services: ['Brand Solutions'],
  },
  // Vivel
  {
    brandName: 'Vivel',
    name: 'Manu Bhatotia',
    phone: '8585010200',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Vivel',
    name: 'Reema Shrivastav',
    phone: '8286259566',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Vivel',
    name: 'Mansee Mohta',
    phone: '7044008857',
    services: ['Brand Solutions'],
  },
  // Engage
  {
    brandName: 'Engage',
    name: 'Minakshi Handa',
    phone: '9920397022',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Engage',
    name: 'Mohit Yadav',
    phone: '9167722607',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Engage',
    name: 'Jayanthi sreenivasan',
    phone: '7257828753',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Engage',
    name: 'Anukiti Dwivedi',
    phone: '8437903326',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Engage',
    name: 'Namrita Khurana',
    phone: '9748185433',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Engage',
    name: 'Shivaalika Julka',
    phone: '8240069147',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Engage',
    name: 'Mohit Joshi',
    phone: '9163190908',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Engage',
    name: 'Tauqeer Siddiqui',
    phone: '8013088104',
    services: ['Brand Solutions'],
  },
  // HDFC Bank
  {
    brandName: 'HDFC Bank',
    name: 'Dipti Nadkarni',
    phone: '9819661191',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'HDFC Bank',
    name: 'Akhil',
    phone: '9987564471',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'HDFC Bank',
    name: 'Alisha',
    phone: '9769171848',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'HDFC Bank',
    name: 'Jiniya',
    phone: '9319602232',
    services: ['Brand Solutions'],
  },
  // Phoenix Marketcity
  {
    brandName: 'Phoenix Marketcity',
    name: 'Shefali Kothari',
    phone: '8657334606',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Phoenix Marketcity',
    name: 'Anant Patil',
    phone: '9886826268',
    services: ['Brand Solutions'],
  },
  // Britannia Cakes
  {
    brandName: 'Britannia Cakes',
    name: 'Sayali Thakur',
    phone: '9930222455',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Britannia Cakes',
    name: 'Avijit Saha',
    phone: '9748099899',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Britannia Cakes',
    name: 'Rajat Sharma',
    phone: '9923553971',
    services: ['Brand Solutions'],
  },
  // Britannia Breads
  {
    brandName: 'Britannia Breads',
    name: 'Vaishali Malik',
    phone: '7838981707',
    services: ['Brand Solutions'],
  },
  // Britannia Croissant
  {
    brandName: 'Britannia Croissant',
    name: 'Robin Gupta',
    phone: '9886360035',
    services: ['Brand Solutions'],
  },
  // Britannia Rusk
  {
    brandName: 'Britannia Rusk',
    name: 'Shekhar Agarwal',
    phone: '9945854650',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Britannia Rusk',
    name: 'Neha Taneja',
    phone: '7798071202',
    services: ['Brand Solutions'],
  },
  // Britannia Cheese
  {
    brandName: 'Britannia Cheese',
    name: 'Pankhuri Agrawal',
    phone: '8982376177',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Britannia Cheese',
    name: 'Arjun',
    phone: '9820463215',
    services: ['Brand Solutions'],
  },
  // Britannia Winkin Cow and Come Alive
  {
    brandName: 'Britannia Winkin Cow and Come Alive',
    name: 'Vibha Patel',
    phone: '8618910719',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Britannia Winkin Cow and Come Alive',
    name: 'Vignesh Srinivasan',
    phone: '8329480922',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Britannia Winkin Cow and Come Alive',
    name: 'Srushti Gupta',
    phone: '8295289073',
    services: ['Brand Solutions'],
  },
  // Britannia Corporate
  {
    brandName: 'Britannia Corporate',
    name: 'Prabakaran K',
    phone: '9986416717',
    services: ['Tech', 'SEO'],
  },
  // Britannia CheeseitUp
  {
    brandName: 'Britannia CheeseitUp',
    name: 'Nandita Kamath',
    phone: '9900815222',
    services: ['SEO'],
  },
  // Dr. Reddy's Laboratories
  {
    brandName: 'Dr. Reddy\'s Laboratories',
    name: 'Teena',
    phone: '9930227341',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Dr. Reddy\'s Laboratories',
    name: 'Harshith',
    phone: '7989190494',
    services: ['Brand Solutions', 'Media', 'Fluence'],
  },
  // Apollo Hospitals
  {
    brandName: 'Apollo Hospitals',
    name: 'Tishya Prajapati',
    phone: '9014000253',
    services: ['Brand Solutions'],
  },
  // HDFC Life
  {
    brandName: 'HDFC Life',
    name: 'Ria Das',
    phone: '7045301998',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'HDFC Life',
    name: 'Robin Potbhare',
    phone: '8080847778',
    services: ['Brand Solutions'],
  },
  // Skybags
  {
    brandName: 'Skybags Luggage',
    name: 'Smita Singla',
    phone: '8800387779',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Skybags Backpack',
    name: 'Smita Singla',
    phone: '8800387779',
    services: ['Brand Solutions'],
  },
  // Episoft
  {
    brandName: 'Episoft',
    name: 'Venkat Kiran',
    phone: '9819017413',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Episoft',
    name: 'Sagar Naidu',
    phone: '9769844075',
    services: ['Brand Solutions'],
  },
  // Bonito Design
  {
    brandName: 'Bonito Design',
    name: 'Keerthi',
    phone: '6360830441',
    services: ['Brand Solutions'],
  },
  // HDFC Ergo
  {
    brandName: 'HDFC Ergo',
    name: 'Yogesh Gadekar',
    phone: '9004091601',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'HDFC Ergo',
    name: 'Aishwarya Menon',
    phone: '9833023981',
    services: ['Brand Solutions'],
  },
  // Flair Pens
  {
    brandName: 'Flair Pens',
    name: 'Chirag Koli',
    phone: '9769900469',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Flair Pens',
    name: 'Shalini Rathod',
    phone: '9820636222',
    services: ['Brand Solutions'],
  },
  // Pierre Cardin
  {
    brandName: 'Pierre Cardin',
    name: 'Chirag Koli',
    phone: '9769900469',
    services: ['Brand Solutions'],
  },
  // Torrent Electricals
  {
    brandName: 'Torrent Electricals',
    name: 'Anjali Jotwani',
    phone: '9601986101',
    services: ['Brand Solutions', 'Media', 'Fluence'],
  },
  // Hauser Germany
  {
    brandName: 'Hauser Germany',
    name: 'Shalini Rathod',
    phone: '9820636222',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Hauser Germany',
    name: 'Chirag Koli',
    phone: '9769900469',
    services: ['Brand Solutions'],
  },
  // Castrol POWER1
  {
    brandName: 'Castrol POWER1',
    name: 'Gaurav Khatri',
    phone: '9130098805',
    services: ['Brand Solutions', 'Fluence'],
  },
  {
    brandName: 'Castrol POWER1',
    name: 'Radhika Gokhale',
    phone: '8879689407',
    services: ['Brand Solutions'],
  },
  // Castrol Magnatec/ Cars
  {
    brandName: 'Castrol Magnatec/ Cars',
    name: 'Rhea Ghosh',
    phone: '9831199072',
    services: ['Brand Solutions'],
  },
  // Castrol
  {
    brandName: 'Castrol',
    name: 'Rhea',
    phone: '8879972041',
    services: ['Fluence'],
  },
  {
    brandName: 'Castrol',
    name: 'Shweta Pawar',
    phone: '9820394737',
    services: ['Fluence'],
  },
  {
    brandName: 'Castrol',
    name: 'Ayush Garg',
    phone: '9654170396',
    services: ['Fluence'],
  },
  // Castrol - Autocare
  {
    brandName: 'Castrol - Autocare',
    name: 'Avni Goyal',
    phone: '9619218264',
    services: ['Fluence'],
  },
  // Greencell NueGo
  {
    brandName: 'Greencell NueGo',
    name: 'Vishal Gundetty',
    phone: '9920697652',
    services: ['Brand Solutions'],
  },
  // NueGo
  {
    brandName: 'NueGo',
    name: 'Deepti Sharma',
    phone: '9654264642',
    services: ['Media', 'SEO'],
  },
  {
    brandName: 'NueGo',
    name: 'Manisha Modi',
    phone: '8591122572',
    services: ['SEO'],
  },
  {
    brandName: 'NueGo',
    name: 'Vishal Gundetty',
    phone: '9920697652',
    services: ['Fluence'],
  },
  // Mahindra Rise
  {
    brandName: 'Mahindra Rise',
    name: 'Avantika',
    phone: '9833779503',
    services: ['Brand Solutions', 'Media'],
  },
  {
    brandName: 'Mahindra Rise',
    name: 'Shilpi Dubey Pathak',
    phone: '9004082459',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Mahindra Rise',
    name: 'Brendon Fernandes',
    phone: '9930591739',
    services: ['Tech', 'SEO', 'MarTech'],
  },
  // Aditya Birla Paints
  {
    brandName: 'Aditya Birla Paints',
    name: 'Trisha Chhabra',
    phone: '9619065981',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Aditya Birla Paints',
    name: 'Diya Nahar',
    phone: '7387663694',
    services: ['Brand Solutions'],
  },
  // CRIF High Mark
  {
    brandName: 'CRIF High Mark',
    name: 'Garima Singh',
    phone: '9819037898',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'CRIF High Mark',
    name: 'Greeshma Nachane',
    phone: '9920959673',
    services: ['Brand Solutions'],
  },
  // Kerastase
  {
    brandName: 'Kerastase',
    name: 'Smridhi Kapur',
    phone: '8368979592',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Kerastase',
    name: 'Tishya Relia',
    phone: '9819968564',
    services: ['Brand Solutions'],
  },
  // Kiehl's
  {
    brandName: 'Kiehl\'s',
    name: 'Avanee Parulekar',
    phone: '9920242841',
    services: ['Brand Solutions'],
  },
  // Lancome
  {
    brandName: 'Lancome',
    name: 'Avanee Parulekar',
    phone: '9920242841',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Lancome',
    name: 'Divya Kalra',
    phone: '9711862718',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Lancome',
    name: 'Smruthi Rajagopal',
    phone: '9841154231',
    services: ['Brand Solutions'],
  },
  // L'oreal Redken
  {
    brandName: 'L\'oreal Redken',
    name: 'Gurleen Bhasin',
    phone: '9769016631',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'L\'oreal Redken',
    name: 'Vidhi Dhruv',
    phone: '9619714546',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'L\'oreal Redken',
    name: 'Ananya Lamba',
    phone: '9650056623',
    services: ['Brand Solutions'],
  },
  // ICA Pidilite
  {
    brandName: 'ICA Pidilite',
    name: 'Kavita Jalan',
    phone: '9321004545',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'ICA Pidilite',
    name: 'Ajay Bhatia',
    phone: '9920140092',
    services: ['Brand Solutions'],
  },
  // Simpolo
  {
    brandName: 'Simpolo',
    name: 'Deep Aghara',
    phone: '8511356222',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Simpolo',
    name: 'Nilotpal Chakraborty',
    phone: '9974408808',
    services: ['Brand Solutions', 'Media'],
  },
  // L'oreal Professionnel
  {
    brandName: 'L\'oreal Professionnel',
    name: 'Shreya Mohan',
    phone: '9620991342',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'L\'oreal Professionnel',
    name: 'Aarfa Shaikh',
    phone: '9820600264',
    services: ['Brand Solutions'],
  },
  // Kumari Jewels
  {
    brandName: 'Kumari Jewels',
    name: 'Amit Bandi',
    phone: '8356851403',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Kumari Jewels',
    name: 'Ashish',
    phone: '9819413522',
    services: ['Brand Solutions', 'Media', 'SEO'],
  },
  // Kumari
  {
    brandName: 'Kumari',
    name: 'Rahul Kumar',
    phone: '7900186687',
    services: ['SEO'],
  },
  // Louis Philippe
  {
    brandName: 'Louis Philippe',
    name: 'Akshita Kalia',
    phone: '9818155222',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Louis Philippe',
    name: 'Deepika Tiwari',
    phone: '9886202726',
    services: ['Brand Solutions'],
  },
  // Cerave
  {
    brandName: 'Cerave',
    name: 'Somarrita',
    phone: '9988889772',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Cerave',
    name: 'Manvi',
    phone: '7030724524',
    services: ['Brand Solutions'],
  },
  // NMACC
  {
    brandName: 'Nita Mukesh Ambani Cultural Centre (NMACC)',
    name: 'Truvya Babani',
    phone: '9619516247',
    services: ['Brand Solutions'],
  },
  // Encore
  {
    brandName: 'Encore',
    name: 'Sachin Vishwakarma',
    phone: '9870559269',
    services: ['Brand Solutions'],
  },
  // JWCC
  {
    brandName: 'Jio World Convention Centre (JWCC)',
    name: 'Truvya Babani',
    phone: '9619516247',
    services: ['Brand Solutions'],
  },
  // Vantara
  {
    brandName: 'Vantara',
    name: 'Dr Manilal Valliyate',
    phone: '9810523108',
    services: ['Brand Solutions'],
  },
  // Vantara Niwas
  {
    brandName: 'Vantara Niwas',
    name: 'Pooja Upadhyay',
    phone: '8928191088',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Vantara Niwas',
    name: 'Saji Joseph',
    phone: '9274687400',
    services: ['Brand Solutions'],
  },
  // Reliance Jio
  {
    brandName: 'Reliance Jio',
    name: 'Priyanka Dueskar',
    phone: '9769868666',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Reliance Jio',
    name: 'Shvetank Naik',
    phone: '9820836661',
    services: ['Brand Solutions'],
  },
  // Mukul Madhav Foundation
  {
    brandName: 'Mukul Madhav Foundation',
    name: 'Shalom Paul',
    phone: '9503639864',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Mukul Madhav Foundation',
    name: 'Paresh Karan',
    phone: '9711000590',
    services: ['Brand Solutions'],
  },
  // Reliance Foundation
  {
    brandName: 'Reliance Foundation',
    name: 'Vanshita Gudekar',
    phone: '8291688951',
    services: ['Brand Solutions'],
  },
  {
    brandName: 'Reliance Foundation',
    name: 'Utsav Tiwari',
    phone: '9321911641',
    services: ['Brand Solutions'],
  },
  // Shiv Nadar Foundation
  {
    brandName: 'Shiv Nadar Foundation',
    name: 'Jatin Dabas',
    phone: '9811665895',
    services: ['Brand Solutions'],
  },
  // Godrej Design Labs
  {
    brandName: 'Godrej Design Labs',
    name: 'Ashita Misquitta',
    phone: '9920776008',
    services: ['Brand Solutions'],
  },
  // Cochlear
  {
    brandName: 'Cochlear',
    name: 'Samantha Mendonsa',
    phone: '9920238249',
    services: ['Brand Solutions', 'Media'],
  },
  // INTABCPA
  {
    brandName: 'INTABCPA',
    name: 'Zohra Baig',
    phone: '9820428590',
    services: ['Brand Solutions'],
  },
  // Aditya Birla Novel
  {
    brandName: 'Aditya Birla Novel',
    name: 'Delzeen Damania',
    phone: '9321539567',
    services: ['Brand Solutions'],
  },
  // Her Circle
  {
    brandName: 'Her Circle',
    name: 'Sonali Valecha',
    phone: '9930499792',
    services: ['Brand Solutions'],
  },
  // Nanhi Kali
  {
    brandName: 'Nanhi Kali',
    name: 'Priyanka Bhanushali',
    phone: '8452005769',
    services: ['Brand Solutions', 'Media'],
  },
  // Kaabil
  {
    brandName: 'Kaabil',
    name: 'Kamakshi Shaligram',
    phone: '7738076449',
    services: ['Brand Solutions'],
  },
  // Papa Don't Preach
  {
    brandName: 'Papa Don\'t Preach',
    name: 'Viraj Anam',
    phone: '8767344972',
    services: ['Media'],
  },
  // Fevicreate
  {
    brandName: 'Fevicreate',
    name: 'Jay Desai',
    phone: '8600801263',
    services: ['Media'],
  },
  {
    brandName: 'Fevicreate',
    name: 'Anish Desai',
    phone: '9016767460',
    services: ['SEO'],
  },
  // JLL
  {
    brandName: 'JLL',
    name: 'Omprakash Singh',
    phone: '9004595090',
    services: ['Media'],
  },
  {
    brandName: 'JLL',
    name: 'Sahil Suhag',
    phone: '9582798405',
    services: ['Media'],
  },
  // Level Supermind
  {
    brandName: 'Level Supermind',
    name: 'Pranali Kadu',
    phone: '9834553221',
    services: ['Media', 'Fluence'],
  },
  // Armaf
  {
    brandName: 'Armaf',
    name: 'Zahid Khan',
    phone: '9833380003',
    services: ['Media'],
  },
  // Bodycraft Salon
  {
    brandName: 'Bodycraft Salon',
    name: 'Riddhi Sharma',
    phone: '9724320003',
    services: ['Media', 'SEO'],
  },
  // Bodycraft
  {
    brandName: 'Bodycraft',
    name: 'Roshni Khatri',
    phone: '9884076488',
    services: ['Tech', 'SEO'],
  },
  {
    brandName: 'Bodycraft',
    name: 'Lakshmi Sunil Ranganathan',
    phone: '9845108212',
    services: ['SEO'],
  },
  // Tata Comm
  {
    brandName: 'Tata Comm',
    name: 'Isha Chhaya',
    phone: '8511123564',
    services: ['Media'],
  },
  {
    brandName: 'Tata Comm',
    name: 'Parag Girotra',
    phone: '7827067637',
    services: ['Media'],
  },
  {
    brandName: 'Tata Comm',
    name: 'Nidhi Chauhan',
    phone: '9971446373',
    services: ['Media'],
  },
  {
    brandName: 'Tata Comm',
    name: 'Alokita Sharma',
    phone: '7289986430',
    services: ['Media'],
  },
  // ACCA
  {
    brandName: 'ACCA',
    name: 'Saahil Kalvani',
    phone: '9820835273',
    services: ['Media', 'Fluence'],
  },
  // Groviva
  {
    brandName: 'Groviva',
    name: 'Anjali Pawar',
    phone: '7972446697',
    services: ['Media'],
  },
  // Indriya
  {
    brandName: 'Indriya',
    name: 'Rakshana Srikanth',
    phone: '9445057968',
    services: ['Media'],
  },
  // Lakeshore
  {
    brandName: 'Lakeshore',
    name: 'Prithvi Hasnandani',
    phone: '7977395820',
    services: ['Media'],
  },
  {
    brandName: 'Lakeshore',
    name: 'Seema Bansal',
    phone: '7045367084',
    services: ['Media'],
  },
  {
    brandName: 'Lakeshore',
    name: 'Janai Khan',
    phone: '9833285430',
    services: ['Media'],
  },
  // Nikon
  {
    brandName: 'Nikon',
    name: 'Arpana Kant',
    phone: '9873071496',
    services: ['Media'],
  },
  // Kosmoderma
  {
    brandName: 'Kosmoderma',
    name: 'Albin',
    phone: '9980202719',
    services: ['Media'],
  },
  // DHP Heavy
  {
    brandName: 'DHP Heavy',
    name: 'Bhavesh Goel',
    phone: '8879694015',
    services: ['Tech'],
  },
  // Sriram Life Insurance
  {
    brandName: 'Sriram Life Insurance',
    name: 'Rahul Adaniya',
    phone: '9930577107',
    services: ['Tech', 'SEO'],
  },
  // Birla Opus
  {
    brandName: 'Birla Opus',
    name: 'Aastha Narula',
    phone: '9999513285',
    services: ['Tech', 'SEO'],
  },
  // HCCB
  {
    brandName: 'HCCB',
    name: 'Chiththarthann',
    phone: '8012047626',
    services: ['Tech', 'SEO'],
  },
  // Jindal Steel
  {
    brandName: 'Jindal Steel',
    name: 'Isha Sahni',
    phone: '9599698449',
    services: ['Tech', 'SEO'],
  },
  // Ring (NZ)
  {
    brandName: 'Ring (NZ)',
    name: 'Varun Khanna',
    phone: '+61432089955',
    services: ['Tech'],
  },
  {
    brandName: 'Ring (NZ)',
    name: 'Corrine Cheng',
    phone: '+61405236602',
    services: ['Tech'],
  },
  // Brookfield
  {
    brandName: 'Brookfield',
    name: 'Salil Phatak',
    phone: '7709403778',
    services: ['Tech'],
  },
  {
    brandName: 'Brookfield',
    name: 'Karthik Pillai',
    phone: '9833993177',
    services: ['Tech'],
  },
  // Himatsingka
  {
    brandName: 'Himatsingka',
    name: 'Rohith Narayan',
    phone: '7760972675',
    services: ['Tech'],
  },
  {
    brandName: 'Himatsingka',
    name: 'Rithika Gandhi',
    phone: '9110201796',
    services: ['Tech'],
  },
  // Everest
  {
    brandName: 'Everest',
    name: 'Salman Merchant',
    phone: '8898420058',
    services: ['SEO'],
  },
  {
    brandName: 'Everest',
    name: 'Dhruvi Jamda',
    phone: '8097591987',
    services: ['SEO'],
  },
  {
    brandName: 'Everest',
    name: 'Shivani Shrivastava',
    phone: '9326260922',
    services: ['SEO'],
  },
  // 5 Paisa
  {
    brandName: '5 Paisa',
    name: 'Parag Kubal',
    phone: '9892058033',
    services: ['SEO'],
  },
  // McCain
  {
    brandName: 'McCain',
    name: 'Sumati Kapur',
    phone: '9953526233',
    services: ['MarTech'],
  },
  {
    brandName: 'McCain',
    name: 'Srishti Mahopatra',
    phone: '8598931475',
    services: ['SMP'],
  },
  // ICICI Prudential
  {
    brandName: 'ICICI Prudential',
    name: 'Pranjal Gunjal',
    phone: '9967955926',
    services: ['MarTech'],
  },
  // JL Morison
  {
    brandName: 'JL Morison',
    name: 'Sabhayata Singh',
    phone: '7506361427',
    services: ['MarTech'],
  },
  // Hamilton
  {
    brandName: 'Hamilton',
    name: 'Shreyash',
    phone: '8356094977',
    services: ['MarTech'],
  },
  // Kotak811
  {
    brandName: 'Kotak811',
    name: 'Sagar Shah',
    phone: '9987512824',
    services: ['MarTech'],
  },
  {
    brandName: 'Kotak811',
    name: 'Shankar',
    phone: '9930036101',
    services: ['MarTech'],
  },
  {
    brandName: 'Kotak811',
    name: 'Suhail Shaikh',
    phone: '7208232369',
    services: ['MarTech'],
  },
  // Nivea
  {
    brandName: 'Nivea',
    name: 'Prateek Gulati',
    phone: '9711834224',
    services: ['MarTech'],
  },
  // Adani Realty
  {
    brandName: 'Adani Realty',
    name: 'Sakshi',
    phone: '9825085451',
    services: ['Fluence'],
  },
  // Boheco
  {
    brandName: 'Boheco',
    name: 'Tejas Wani',
    phone: '8779074002',
    services: ['Fluence'],
  },
  // Swift TV
  {
    brandName: 'Swift TV',
    name: 'Srikant',
    phone: '9381532566',
    services: ['Fluence'],
  },
  // Odisha Tourism
  {
    brandName: 'Odisha Tourism',
    name: 'Ankit',
    phone: '9830864084',
    services: ['Fluence'],
  },
];

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
 * Seed Clients
 */
async function seedClients() {
  console.log('👥 Seeding Clients (POCs)...');

  // First, get all brands mapped by slug
  const brands = await Brand.find({});
  const brandMap = {};
  brands.forEach(brand => {
    brandMap[brand.slug] = brand;
    brandMap[brand.name.toLowerCase()] = brand;
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const clientData of CLIENT_DATA) {
    const brandSlug = generateSlug(clientData.brandName);
    const brand =
      brandMap[brandSlug] || brandMap[clientData.brandName.toLowerCase()];

    if (!brand) {
      console.warn(`  ⚠ Brand not found: ${clientData.brandName}`);
      skipped++;
      continue;
    }

    try {
      const phone = clientData.phone.replace(/[^0-9+]/g, '');

      const serviceMapping = (clientData.services || []).map(service => ({
        department: DEPT_CODE_MAP[service] || service.toLowerCase(),
        isActive: true,
      }));

      const existing = await Client.findOne({ brandId: brand._id, phone });

      if (existing) {
        await Client.findOneAndUpdate(
          { brandId: brand._id, phone },
          { name: clientData.name, serviceMapping, isActive: true },
          { new: true }
        );
        updated++;
      } else {
        await Client.create({
          brandId: brand._id,
          name: clientData.name,
          phone,
          serviceMapping,
          isActive: true,
        });
        created++;
      }
    } catch (error) {
      console.error(
        `  ✗ Failed to seed ${clientData.name} for ${clientData.brandName}:`,
        error.message
      );
    }
  }

  console.log(
    `\n✅ Clients seeded: ${created} created, ${updated} updated, ${skipped} skipped`
  );
}

/**
 * Main Seed Function
 */
async function seed() {
  console.log('🌱 Starting Client Seeding...\n');
  console.log(`📦 Connecting to: ${MONGODB_URI}\n`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    await seedClients();

    console.log('\n🎉 Client seeding completed successfully!');

    // Summary
    const clientCount = await Client.countDocuments();
    console.log(`\n📊 Total Clients: ${clientCount}`);
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
