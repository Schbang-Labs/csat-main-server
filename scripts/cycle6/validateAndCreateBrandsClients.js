/**
 * Validate and Create Brands & Clients for Cycle 6
 * 
 * This script:
 * 1. Reads brand/POC data from implementation.md
 * 2. Validates brands exist in Brand model - reports missing brands
 * 3. Validates clients exist in Client model - creates if missing
 * 4. Ensures correct brandId alignment for existing clients
 * 
 * Run: node scripts/cycle6/validateAndCreateBrandsClients.js
 */

import mongoose from 'mongoose';
import 'dotenv/config';
import Brand from '../../src/models/brand.model.js';
import Client from '../../src/models/client.model.js';

/**
 * POC Data from implementation.md (EXACTLY as in the file)
 * Format: { brandNames, pocName, phone }
 * Note: Brand names with "/" indicate the POC is for multiple brands
 */
const POC_DATA = [
  // Solutions Department POCs - EXACTLY from implementation.md
  { brandNames: ['Glow & Lovely'], pocName: 'Rahul Mittal', phone: '9971114795' },
  { brandNames: ['Glow & Lovely'], pocName: 'Suraj Shukla', phone: '9702859986' },
  { brandNames: ['Bajaj Almond'], pocName: 'Sonal Singh', phone: '9711981493' },
  { brandNames: ['Maybelline'], pocName: 'Dhwani Shah', phone: '8779163934' },
  { brandNames: ['Maybelline'], pocName: 'Anila Saldanha', phone: '9664452750' },
  { brandNames: ['Maybelline'], pocName: 'Vibhuti Varma', phone: '9910017441' },
  { brandNames: ['Enamor'], pocName: 'Ankita Banerjee', phone: '9716741127' },
  { brandNames: ['Enamor'], pocName: 'Sandra Daniels', phone: '9686448409' },
  { brandNames: ['Bridgestone Tyres'], pocName: 'Sumedha Sharma', phone: '9953251989' },
  { brandNames: ['Bridgestone Tyres'], pocName: 'Pradeep', phone: '7350016051' },
  { brandNames: ['Bookmyshow'], pocName: 'Akansha Singh', phone: '9870317808' },
  { brandNames: ['Bookmyshow'], pocName: 'Niyati Shah', phone: '9619574517' },
  { brandNames: ['Sanofi Allergy'], pocName: 'Bhavna Kewalramani', phone: '9820256674' },
  { brandNames: ['Neutrogena'], pocName: 'Manisha Shah', phone: '9002946885' },
  { brandNames: ['Huggies'], pocName: 'Shantanu', phone: '7045305490' },
  { brandNames: ['Huggies'], pocName: 'Taru Jain', phone: '9811668031' },
  { brandNames: ['Huggies'], pocName: 'Pratik', phone: '9953948545' },
  { brandNames: ['Huggies'], pocName: 'Iti Bhadani', phone: '9953895484' },
  { brandNames: ['Huggies'], pocName: 'Shweta Vig', phone: '9743775021' },
  { brandNames: ['Gyproc'], pocName: 'Ankur Bali', phone: '9833999165' },
  { brandNames: ['Gyproc'], pocName: 'Divyesh Panchal', phone: '9819123198' },
  { brandNames: ['Gyproc'], pocName: 'Aninda Gupta', phone: '9594027908' },
  { brandNames: ['Marvel + Disney'], pocName: 'Aditi Singh', phone: '9769936558' },
  { brandNames: ['London Dairy', 'Allegro'], pocName: 'Sayantan Bose', phone: '7506075920' },
  { brandNames: ['Riot Games - Valorant', 'Riot Games - League Of Legends'], pocName: 'Harsh Sinha', phone: '8879949141' },
  { brandNames: ['Riot Games - Valorant', 'Riot Games - League Of Legends'], pocName: 'Anushka Bhatnagar', phone: '8959178078' },
  { brandNames: ['Dominos'], pocName: 'Surabhi Prasoon', phone: '8299775274' },
  { brandNames: ['Celio'], pocName: 'Rafiq Shaikh', phone: '9833202153' },
  { brandNames: ['Celio'], pocName: 'Rejoy Rajan', phone: '9686188441' },
  { brandNames: ['Eureka Forbes'], pocName: 'Vatsal Dedhia', phone: '9653295037' },
  { brandNames: ['Britannia'], pocName: 'Shree Das', phone: '9718294118' },
  { brandNames: ['Britannia'], pocName: 'Divya Deora', phone: '8826512124' },
  { brandNames: ['Crompton'], pocName: 'Vaibhav Joshi', phone: '9699393165' },
  { brandNames: ['Fair and Handsome', 'Exotica', 'Pure Glow'], pocName: 'Vijay Gupta', phone: '9819945331' },
  { brandNames: ['Voltas'], pocName: 'Drishti Ramchandani', phone: '9623276511' },
  { brandNames: ['MTR'], pocName: 'Vibhor', phone: '9158769633' },
  { brandNames: ['ITC Hotels'], pocName: 'Ishita', phone: '7889811148' },
  { brandNames: ['TCP (Tata Consumer Products)'], pocName: 'Bob', phone: '7506366446' },
  { brandNames: ['McCain Retail'], pocName: 'Sumati Kapoor', phone: '9953526233' },
  { brandNames: ['Wok and Roll'], pocName: 'Anupam', phone: '9886088181' },
  { brandNames: ['Jockey'], pocName: 'Swarn Pannu', phone: '9899574780' },
  { brandNames: ['Oriana'], pocName: 'Rajagopalan M', phone: '7904206683' },
  { brandNames: ['Oriana'], pocName: 'Jayaraman', phone: '9600113655' },
  { brandNames: ['Amazon Fresh'], pocName: 'Taruna', phone: '9158779152' },
  { brandNames: ['Amazon Fresh'], pocName: 'Abraham', phone: '9663855927' },
  { brandNames: ['Prakriti'], pocName: 'Tanya', phone: '8178388440' },
  { brandNames: ['Himalaya PartySmart'], pocName: 'Sunil Waghmode', phone: '9167712818' },
  { brandNames: ['Himalaya PartySmart'], pocName: 'Shayri', phone: '8697425210' },
  { brandNames: ['Pot and Bloom'], pocName: 'Anand', phone: '9740455788' },
  { brandNames: ['Pot and Bloom'], pocName: 'Harpreet Kaur', phone: '9008325588' },
  { brandNames: ['Krafton'], pocName: 'Raunak Kapoor', phone: '9163153264' },
  { brandNames: ['ITC Limited Corporate'], pocName: 'Naila Nasir', phone: '9319083208' },
  { brandNames: ['ITC Limited Corporate'], pocName: 'Aurko Dasgupta', phone: '9831317083' },
  { brandNames: ['ITC Limited Corporate'], pocName: 'Indranil Bhattacharjee', phone: '8017111545' },
  { brandNames: ['ITC HR'], pocName: 'Dhrthi Bhatt', phone: '9444341510' },
  { brandNames: ['ITC HR'], pocName: 'Ipsita Kar', phone: '9911983404' },
  { brandNames: ['Ample Group'], pocName: 'Nabeel Ahmed', phone: '8792488536' },
  { brandNames: ['Ample Group'], pocName: 'Sandhya Gurung', phone: '9513686095' },
  { brandNames: ['Ample Group'], pocName: 'Sunny Bose', phone: '9731292002' },
  { brandNames: ['Aster'], pocName: 'Shaheen', phone: '9945542392' },
  { brandNames: ['Philips'], pocName: 'Kanishka Garbyal', phone: '9891433015' },
  { brandNames: ['iQOO'], pocName: 'Suchit Chopra', phone: '9811117939' },
  { brandNames: ['iQOO'], pocName: 'Rashi Anthony', phone: '9910879402' },
  { brandNames: ['Cavin Kare'], pocName: 'Akashivan Suresh', phone: '9791052222' },
  { brandNames: ['Max Protein'], pocName: 'Shivam', phone: '9594890660' },
  { brandNames: ['Max Protein'], pocName: 'Ravinder Verma', phone: '9930002878' },
  { brandNames: ['IIFL'], pocName: 'Mritunjay Bisht', phone: '9867528257' },
  { brandNames: ['Optimum Nutrition + Isopure'], pocName: 'Amit Midha', phone: '9999371335' },
  { brandNames: ['Optimum Nutrition + Isopure'], pocName: 'Sakshi Pingley', phone: '9920938034' },
  { brandNames: ['Dabur Hajmola'], pocName: 'Gyan Ranjan', phone: '9873737338' },
  { brandNames: ['Dabur Hajmola'], pocName: 'Mohit Sharma', phone: '8447779269' },
  { brandNames: ['HDFC Bank'], pocName: 'Dipti Nadkarni', phone: '9819661191' },
  { brandNames: ['HDFC Bank'], pocName: 'Akhil', phone: '9987564471' },
  { brandNames: ['HDFC Bank'], pocName: 'Alisha', phone: '9769171848' },
  { brandNames: ['HDFC Bank'], pocName: 'Jiniya', phone: '9319602232' },
  { brandNames: ['Phoenix Marketcity'], pocName: 'Shefali Kothari', phone: '8657334606' },
  { brandNames: ['Phoenix Marketcity'], pocName: 'Anant Patil', phone: '9886826268' },
  { brandNames: ['Britannia Cakes'], pocName: 'Sayali Thakur', phone: '9930222455' },
  { brandNames: ['Britannia Cakes'], pocName: 'Avijit Saha', phone: '9748099899' },
  { brandNames: ['Britannia Cakes'], pocName: 'Rajat Sharma', phone: '9923553971' },
  { brandNames: ['Britannia Breads'], pocName: 'Vaishali Malik', phone: '7838981707' },
  { brandNames: ['Britannia Croissant'], pocName: 'Robin Gupta', phone: '9886360035' },
  { brandNames: ['Britannia Rusk'], pocName: 'Shekhar Agarwal', phone: '9945854650' },
  { brandNames: ['Britannia Rusk'], pocName: 'Neha Taneja', phone: '7798071202' },
  { brandNames: ['Britannia Cheese'], pocName: 'Pankhuri Agrawal', phone: '8982376177' },
  { brandNames: ['Britannia Cheese'], pocName: 'Arjun Visvanathan', phone: '9820463215' },
  { brandNames: ['Britannia Winkin Cow and Come Alive'], pocName: 'Vibha Patel', phone: '8618910719' },
  { brandNames: ['Britannia Winkin Cow and Come Alive'], pocName: 'Vignesh Srinivasan', phone: '8329480922' },
  { brandNames: ['Britannia Winkin Cow and Come Alive'], pocName: 'Srushti Gupta', phone: '8295289073' },
  { brandNames: ['Dr. Reddy\'s Laboratories'], pocName: 'Teena', phone: '9930227341' },
  { brandNames: ['Dr. Reddy\'s Laboratories'], pocName: 'Harshith', phone: '7989190494' },
  { brandNames: ['Fevicol'], pocName: 'Disha', phone: '9819631263' },
  { brandNames: ['Fevicol'], pocName: 'Jessica', phone: '9920379383' },
  { brandNames: ['Fevicol'], pocName: 'Parth Desai', phone: '9769943531' },
  { brandNames: ['Fevicol'], pocName: 'Rajiv', phone: '9819713550' },
  { brandNames: ['Fiama'], pocName: 'Geetika Khanna', phone: '9999742934' },
  { brandNames: ['Fiama'], pocName: 'Vaishnavi Singh', phone: '9546583838' },
  { brandNames: ['Kotak 811 + Kotak 811 (Fin For All)'], pocName: 'Adil Merchant', phone: '9967328906' },
  { brandNames: ['Kotak 811 + Kotak 811 (Fin For All)'], pocName: 'Kaveeta Buder', phone: '9920939497' },
  { brandNames: ['Hobby Ideas'], pocName: 'Ashwin Lobo', phone: '9820124020' },
  { brandNames: ['Hobby Ideas'], pocName: 'Shruti Bhardwaj', phone: '9899912155' },
  { brandNames: ['Charmis + Dermafique', 'Vivel'], pocName: 'Neetha Devir', phone: '9819466770' },
  { brandNames: ['Charmis + Dermafique', 'Vivel'], pocName: 'Geetika Khanna', phone: '9999742934' },
  { brandNames: ['Engage'], pocName: 'Sanaya Tangri', phone: '9920727072' },
  { brandNames: ['Engage'], pocName: 'Namrita Khurana', phone: '9748185433' },
  { brandNames: ['Engage'], pocName: 'Mohit Joshi', phone: '9163190908' },
  { brandNames: ['Engage'], pocName: 'Tauqeer Siddiqui', phone: '8013088104' },
  { brandNames: ['Engage'], pocName: 'Soham Jadhav', phone: '9594931618' },
  { brandNames: ['Visa'], pocName: 'Avinash Srivastava', phone: '8840807394' },
  { brandNames: ['Visa'], pocName: 'Richa Batra', phone: '9810993747' },
  { brandNames: ['Apollo Hospitals'], pocName: 'Tishya Prajapati', phone: '9014000253' },
  { brandNames: ['HDFC Life'], pocName: 'Ria Das', phone: '7045301998' },
  { brandNames: ['HDFC Life'], pocName: 'Navdeep', phone: '9930034824' },
  { brandNames: ['Skybags Luggage', 'Skybags Backpack'], pocName: 'Smita Singla', phone: '8800387779' },
  { brandNames: ['EPISOFT'], pocName: 'Sagar Naidu', phone: '9769844075' },
  { brandNames: ['HDFC Ergo'], pocName: 'Yogesh Gadekar', phone: '9004091601' },
  { brandNames: ['HDFC Ergo'], pocName: 'Aishwarya Menon', phone: '9833023981' },
  { brandNames: ['Flair pens', 'Pierre Cardin', 'Hauser Germany'], pocName: 'Chirag Koli', phone: '9769900469' },
  { brandNames: ['Flair pens', 'Hauser Germany'], pocName: 'Shalini Rathod', phone: '9820636222' },
  { brandNames: ['Torrent Electricals'], pocName: 'Anjali Jotwani', phone: '9601986101' },
  { brandNames: ['Torrent Electricals'], pocName: 'Bhavesh', phone: '9099850409' },
  { brandNames: ['Castrol POWER1'], pocName: 'Gaurav Khatri', phone: '9130098805' },
  { brandNames: ['Castrol POWER1'], pocName: 'Radhika Gokhale', phone: '8879689407' },
  { brandNames: ['Castrol Magnatec/ Cars'], pocName: 'Rhea Ghosh', phone: '9831199072' },
  { brandNames: ['Greencell NueGo'], pocName: 'Vishal gundetty', phone: '9920697652' },
  { brandNames: ['Mahindra Rise'], pocName: 'Avantika', phone: '9833779503' },
  { brandNames: ['Mahindra Rise'], pocName: 'Shilpi Dubey Pathak', phone: '9004082459' },
  { brandNames: ['Aditya Birla Paints'], pocName: 'Trisha Chhabra', phone: '9619065981' },
  { brandNames: ['Aditya Birla Paints'], pocName: 'Diya Nahar', phone: '7387663694' },
  { brandNames: ['CRIF High Mark'], pocName: 'Garima Singh', phone: '9819037898' },
  { brandNames: ['CRIF High Mark'], pocName: 'Greeshma Nachane', phone: '9920959673' },
  { brandNames: ['AM/NS'], pocName: 'Om Bhojani', phone: '9769764336' },
  { brandNames: ['AM/NS'], pocName: 'Meet Pandit', phone: '8238784922' },
  { brandNames: ['AM/NS'], pocName: 'Piyush Mishra', phone: '7211184610' },
  { brandNames: ['AM/NS'], pocName: 'Tushar Makkar', phone: '9810437303' },
  { brandNames: ['AM/NS'], pocName: 'Soumitra Patnaik', phone: '9937012643' },
  { brandNames: ['UltraTech Cement'], pocName: 'Vaibhav Tripathi', phone: '9833345858' },
  { brandNames: ['UltraTech Cement'], pocName: 'Avadhoot Davandkar', phone: '9619177699' },
  { brandNames: ['UltraTech Cement'], pocName: 'Kanupriya Didwaniya', phone: '9967717670' },
  { brandNames: ['Safari Genie'], pocName: 'Purvai Aggarwal', phone: '9818326107' },
  { brandNames: ['Safari Genie'], pocName: 'Shishir Kumar', phone: '9588616839' },
  { brandNames: ['Safari Genie'], pocName: 'Nidish Garg', phone: '9619860068' },
  { brandNames: ['Mukul Madhav Foundation'], pocName: 'Shalom Paul', phone: '9503639864' },
  { brandNames: ['Reliance Foundation'], pocName: 'Vanshita Gudekar', phone: '8291688951' },
  { brandNames: ['Reliance Foundation'], pocName: 'Utsav Tiwari', phone: '9321911641' },
  { brandNames: ['Shiv Nadar Foundation'], pocName: 'Jatin Dabas', phone: '9811665895' },
  { brandNames: ['Shiv Nadar Foundation'], pocName: 'Anshul Adhikari', phone: '9953559049' },
  { brandNames: ['Godrej Design Labs'], pocName: 'Ashita Misquitta', phone: '9920776008' },
  { brandNames: ['Cochlear'], pocName: 'Samantha Mendonsa', phone: '9920238249' },
  { brandNames: ['INTABCPA'], pocName: 'Zohra Baig', phone: '9820428590' },
  { brandNames: ['Aditya Birla Novel', 'Indriya'], pocName: 'Simran Talwar', phone: '9769808077' },
  { brandNames: ['Aditya Birla Novel', 'Indriya'], pocName: 'Delzeen Damania', phone: '9321539567' },
  { brandNames: ['Her Circle'], pocName: 'Sonali Valecha', phone: '9930499792' },
  { brandNames: ['Nanhi Kali'], pocName: 'Priyanka Bhanushali', phone: '8452005769' },
  { brandNames: ['Kaabil'], pocName: 'Kamakshi Shaligram', phone: '7738076449' },
  { brandNames: ['Indriya'], pocName: 'Kavish Barapatre', phone: '9673047686' },
  { brandNames: ['Milton', 'Hamilton'], pocName: 'Umangi Desai', phone: '8600720959' },
  { brandNames: ['Milton', 'Treo', 'Procook', 'Hamilton'], pocName: 'Priyanka Datta', phone: '8130778113' },
  { brandNames: ['Milton', 'Treo', 'Procook'], pocName: 'Arindam Panda', phone: '8697722299' },
  { brandNames: ['Treo'], pocName: 'Shreya Bangariya', phone: '9116788099' },
  { brandNames: ['Procook'], pocName: 'Ananya Vaghani', phone: '9867750993' },
  { brandNames: ['Kerastase'], pocName: 'Smridhi Kapur', phone: '8368979592' },
  { brandNames: ['Kiehl\'s', 'Lancome'], pocName: 'Avanee Parulekar', phone: '9920242841' },
  { brandNames: ['Lancome'], pocName: 'Divya Kalra', phone: '9711862718' },
  { brandNames: ['Lancome'], pocName: 'Smruthi Rajagopal', phone: '9841154231' },
  { brandNames: ['L\'oreal Redken'], pocName: 'Gurleen Bhasin', phone: '9769016631' },
  { brandNames: ['L\'oreal Redken'], pocName: 'Vidhi Dhruv', phone: '9619714546' },
  { brandNames: ['L\'oreal Redken'], pocName: 'Ananya Lamba', phone: '9650056623' },
  { brandNames: ['ICA Pidilite'], pocName: 'Kavita Jalan', phone: '9321004545' },
  { brandNames: ['ICA Pidilite'], pocName: 'Ajay Bhatia', phone: '9920140092' },
  { brandNames: ['Simpolo'], pocName: 'Deep Aghara', phone: '8511356222' },
  { brandNames: ['Simpolo'], pocName: 'Nilotpal Chakraborty', phone: '9974408808' },
  { brandNames: ['L\'oreal Professionnel'], pocName: 'Tishya Relia', phone: '9819968564' },
  { brandNames: ['L\'oreal Professionnel'], pocName: 'Aarfa Shaikh', phone: '9820600264' },
  { brandNames: ['Kumari Jewels'], pocName: 'Amit Bandi', phone: '8356851403' },
  { brandNames: ['Kumari Jewels'], pocName: 'Ashish Sharma', phone: '9819413522' },
  { brandNames: ['Louis Philippe'], pocName: 'Akshita Kalia', phone: '9818155222' },
  { brandNames: ['Louis Philippe'], pocName: 'Deepika Tiwari', phone: '9886202726' },
  { brandNames: ['Cerave'], pocName: 'Somarrita', phone: '9988889772' },
  { brandNames: ['Cerave'], pocName: 'Manvi', phone: '7030724524' },
  { brandNames: ['Nerolac'], pocName: 'Sushant', phone: '9892568511' },
  { brandNames: ['Nerolac'], pocName: 'Shrenik Shah', phone: '9819076500' },
  { brandNames: ['Specta Surfaces'], pocName: 'Abhishek Agarwal', phone: '7982498162' },
  { brandNames: ['Specta Surfaces'], pocName: 'Ankit Jain', phone: '9829485255' },
  { brandNames: ['Metro'], pocName: 'Simona Bhansal', phone: '9521364499' },
  { brandNames: ['Metro', 'Mochi'], pocName: 'Aastha Mantri', phone: '9987292109' },
  { brandNames: ['Metro', 'Mochi'], pocName: 'Harsh Shah', phone: '9833345457' },
  { brandNames: ['Mochi'], pocName: 'Siddhita Ghosalkar', phone: '8291016806' },
  { brandNames: ['GAIN by Galderma'], pocName: 'Sneha Miyani', phone: '9930089911' },
  { brandNames: ['Tata Cliq Lifestyle', 'TATA Cliq Palette'], pocName: 'Aishwarya Nikam', phone: '9892154181' },
  { brandNames: ['Tata Cliq Lifestyle'], pocName: 'Anurima Rastogi', phone: '9873735197' },
  { brandNames: ['Tata Cliq Lifestyle'], pocName: 'Dimple Ramchandani', phone: '9029308382' },
  { brandNames: ['TATA Cliq Palette'], pocName: 'Zaianb Pardawala', phone: '9619771168' },
  { brandNames: ['TATA Cliq Palette'], pocName: 'Sakshi Chandak', phone: '9623121871' },
  { brandNames: ['Nita Mukesh Ambani Cultural Centre (NMACC)'], pocName: 'Truvya Babani', phone: '9619516247' },
  { brandNames: ['Jio World Convention Centre (JWCC)'], pocName: 'Truvya Babani', phone: '9619516247' },
  { brandNames: ['Encore'], pocName: 'Sachin Vishwakarma', phone: '9870559269' },
  { brandNames: ['Vantara'], pocName: 'Dr Manilal Valliyate', phone: '9810523108' },
  { brandNames: ['Vantara'], pocName: 'Gaurav Lula', phone: '9820412527' },
  { brandNames: ['Vantara Niwas'], pocName: 'Pooja Upadhyay', phone: '8928191088' },
  { brandNames: ['Vantara Niwas'], pocName: 'Saji Joseph', phone: '9274687400' },
  { brandNames: ['Reliance Jio'], pocName: 'Amit Panhale', phone: '9892559778' },
  { brandNames: ['Reliance Jio'], pocName: 'Deepen Shah', phone: '9833630733' },

  // Media Department POCs
  { brandNames: ['Papa Don\'t Preach'], pocName: 'Viraj Anam', phone: '8767344972' },
  { brandNames: ['Hobby Ideas', 'Fevicreate'], pocName: 'Jay Desai', phone: '8600801263' },
  { brandNames: ['NueGo'], pocName: 'Deepti Sharma', phone: '9654264642' },
  { brandNames: ['JLL'], pocName: 'Omprakash Singh', phone: '9004595090' },
  { brandNames: ['JLL'], pocName: 'Sahil Suhag', phone: '9582798405' },
  { brandNames: ['Level Supermind'], pocName: 'Pranali Kadu', phone: '9834553221' },
  { brandNames: ['Armaf'], pocName: 'Sufyaan Moosani', phone: '8655077233' },
  { brandNames: ['Armaf'], pocName: 'Zahid Khan', phone: '9833380003' },
  { brandNames: ['Bodycraft Salon'], pocName: 'Riddhi Sharma', phone: '9724320003' },
  { brandNames: ['Tata Comm'], pocName: 'Isha Chhaya', phone: '8511123564' },
  { brandNames: ['Tata Comm'], pocName: 'Parag Girotra', phone: '7827067637' },
  { brandNames: ['Tata Comm'], pocName: 'Nidhi Chauhan', phone: '9971446373' },
  { brandNames: ['Tata Comm'], pocName: 'Alokita Sharma', phone: '7289986430' },
  { brandNames: ['ACCA'], pocName: 'Saahil Kalvani', phone: '9820835273' },
  { brandNames: ['Groviva'], pocName: 'Anjali Pawar', phone: '7972446697' },
  { brandNames: ['Medimix'], pocName: 'Pooja Shuchak', phone: '8976075027' },
  { brandNames: ['Indriya'], pocName: 'Rakshana Srikanth', phone: '9445057968' },
  { brandNames: ['Lakeshore'], pocName: 'Prithvi Hardasani', phone: '7977395820' },
  { brandNames: ['Lakeshore'], pocName: 'Seema Bansal', phone: '7045367084' },
  { brandNames: ['Lakeshore'], pocName: 'Janai Khan', phone: '9833285430' },
  { brandNames: ['Nikon'], pocName: 'Kshitij Arora', phone: '8826144777' },
  { brandNames: ['Nikon'], pocName: 'Arpana Kant', phone: '9873071496' },
  { brandNames: ['Kosmoderma'], pocName: 'Albin', phone: '9980202719' },

  // Tech Department POCs
  { brandNames: ['Bridgestone'], pocName: 'Paritosh Koppikar', phone: '9967002720' },
  { brandNames: ['DHP Heavy'], pocName: 'Bhavesh Goel', phone: '8879694015' },
  { brandNames: ['Britannia Corporate'], pocName: 'Prabakaran K', phone: '9986416717' },
  { brandNames: ['Sriram Life Insurance'], pocName: 'Rahul Adaniya', phone: '9930577107' },
  { brandNames: ['Sriram Life Insurance'], pocName: 'Sravan Kumar', phone: '9704191860' },
  { brandNames: ['Birla Opus'], pocName: 'Aastha Narula', phone: '9999513285' },
  { brandNames: ['HCCB'], pocName: 'Chiththarthann', phone: '8012047626' },
  { brandNames: ['Jindal Steel'], pocName: 'Isha Sahni', phone: '9599698449' },
  { brandNames: ['Bodycraft'], pocName: 'Roshni Khatri', phone: '9884076488' },
  { brandNames: ['NRB bearings'], pocName: 'Kanishk Kansal', phone: '7045754285' },
  { brandNames: ['Brookfield'], pocName: 'Salil Phatak', phone: '7709403778' },
  { brandNames: ['Brookfield'], pocName: 'Karthik Pillai', phone: '9833993177' },
  { brandNames: ['Himatsingka'], pocName: 'Rohith Narayan', phone: '7760972675' },
  { brandNames: ['Himatsingka'], pocName: 'Rithika Gandhi', phone: '9110201796' },
  { brandNames: ['Mahindra Rise'], pocName: 'Brendon Fernandes', phone: '9930591739' },

  // SEO Department POCs
  { brandNames: ['Britannia CheeseitUp'], pocName: 'Nandita Kamath', phone: '9900815222' },
  { brandNames: ['Lakme'], pocName: 'Krithikha Udayakumar', phone: '9943019003' },
  { brandNames: ['Britannia AEO-GEO'], pocName: 'Meeta Chandrasekhar', phone: '9940059613' },
  { brandNames: ['Bodycraft'], pocName: 'Lakshmi Sunil Ranganathan', phone: '9845108212' },
  { brandNames: ['Everest'], pocName: 'Salman Merchant', phone: '8898420058' },
  { brandNames: ['Everest'], pocName: 'Dhruvi Jamda', phone: '8097591987' },
  { brandNames: ['Everest'], pocName: 'Shivani Shrivastava', phone: '9326260922' },
  { brandNames: ['Kumari'], pocName: 'Rahul Kumar', phone: '7900186687' },
  { brandNames: ['Jockey'], pocName: 'Rekha Nahar', phone: '9980222061' },
  { brandNames: ['Jockey'], pocName: 'Ritika Sharma', phone: '8591481423' },
  { brandNames: ['5 Paisa'], pocName: 'Parag Kubal', phone: '9892058033' },
  { brandNames: ['5 Paisa'], pocName: 'Sushant Oberoi', phone: '9167584485' },

  // MarTech Department POCs
  { brandNames: ['Audi'], pocName: 'Moupriya Das', phone: '9175066983' },
  { brandNames: ['Jio Hotstar'], pocName: 'Manali Kukreja', phone: '9987486522' },
  { brandNames: ['Jio Hotstar'], pocName: 'Shaun Fernandes', phone: '9819280020' },
  { brandNames: ['ICICI prudential'], pocName: 'Pranjal Gunjal', phone: '9967955926' },
  { brandNames: ['JL Morison'], pocName: 'Sabhayata Singh', phone: '7506361427' },
  { brandNames: ['Hamilton'], pocName: 'Shreyash', phone: '8356094977' },
  { brandNames: ['Kotak811'], pocName: 'Sagar Shah', phone: '9987512824' },
  { brandNames: ['Kotak811'], pocName: 'Shankar', phone: '9930036101' },
  { brandNames: ['Kotak811'], pocName: 'Suhail Shaikh', phone: '7208232369' },
  { brandNames: ['Jockey'], pocName: 'Divya Mishra', phone: '9739949967' },
  { brandNames: ['Nivea'], pocName: 'Prateek Gulati', phone: '9711834224' },
  { brandNames: ['Eureka Forbes'], pocName: 'Manisha Kode', phone: '9662970080' },
  { brandNames: ['Eureka Forbes'], pocName: 'Harshal Patil', phone: '8830700617' },
  { brandNames: ['Eureka Forbes'], pocName: 'Krupa Jhaveri', phone: '9833232385' },
  { brandNames: ['Eureka Forbes'], pocName: 'Shreya Naithani', phone: '7838552269' },
  { brandNames: ['Eureka Forbes'], pocName: 'Arth Patel', phone: '8000759596' },

  // Fluence Department POCs
  { brandNames: ['Adani Realty'], pocName: 'Sakshi', phone: '9825085451' },
  { brandNames: ['Castrol'], pocName: 'Rhea', phone: '8879972041' },
  { brandNames: ['Castrol'], pocName: 'Shweta Pawar', phone: '9820394737' },
  { brandNames: ['Castrol'], pocName: 'Ayush Garg', phone: '9654170396' },
  { brandNames: ['Jockey'], pocName: 'Sourav Das', phone: '7829546760' },
  { brandNames: ['Zespri'], pocName: 'Akshay Pai', phone: '9901929760' },
  { brandNames: ['Boheco'], pocName: 'Tejas Wani', phone: '8779074002' },
  { brandNames: ['Milton Appliances'], pocName: 'Ayush Sharma', phone: '9039380557' },
  { brandNames: ['Motorola'], pocName: 'Himalay', phone: '9873676622' },

  // SMP Department POCs
  { brandNames: ['McCain'], pocName: 'Srishti Mahopatra', phone: '8598931475' },
  { brandNames: ['Celio'], pocName: 'Vibhuti Arte', phone: '9004935011' },
  { brandNames: ['ITC'], pocName: 'Kamna Srivastav', phone: '9810320728' },
  { brandNames: ['Britannia'], pocName: 'Pournami Unnikrishnan', phone: '9870005717' },
  { brandNames: ['Tata Capital'], pocName: 'Nikita Gupta', phone: '9768815548' },

  // Schbang Internal (for testing)
  { brandNames: ['Schbang CSAT'], pocName: 'Raj', phone: '9321133877' },
  { brandNames: ['Schbang Jitto'], pocName: 'Manan', phone: '7219694850' },
  { brandNames: ['Schbang Harshil'], pocName: 'Harsh', phone: '9354992217' },
  { brandNames: ['Schbang AI Labs'], pocName: 'Chetan', phone: '8999431754' },
  { brandNames: ['Schbang NSM'], pocName: 'Ansh', phone: '9987272606' },
  { brandNames: ['Schbang NSM'], pocName: 'Yadnesh', phone: '8208626251' },
  { brandNames: ['Schbang NSM'], pocName: 'Saee', phone: '8104682054' },
];

/**
 * Brand name variations mapping
 */
const BRAND_NAME_VARIATIONS = {
  'Bridgestone Tyres': 'Bridgestone',
  'Greencell NueGo': 'NueGo',
  'ITC': 'ITC Limited Corporate',
  'Pot & Bloom': 'Pot and Bloom',
};

/**
 * Escape regex special characters
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * Find brand by name
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
 * Normalize phone number
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  // Remove special characters, keep only digits
  return phone.replace(/[^0-9]/g, '').slice(-10);
};

/**
 * Main function
 */
const main = async () => {
  console.log('🚀 Validate and Create Brands & Clients for Cycle 6');
  console.log('====================================================\n');

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Track results
    const missingBrands = new Set();
    const existingBrands = new Set();
    const createdClients = [];
    const updatedClients = [];
    const existingClients = [];
    const errors = [];

    // Process each POC entry
    console.log('📊 Processing POC data...\n');

    for (const pocEntry of POC_DATA) {
      const { brandNames, pocName, phone } = pocEntry;
      const normalizedPhone = normalizePhone(phone);

      if (!normalizedPhone) {
        errors.push({ pocName, phone, reason: 'Invalid phone number' });
        continue;
      }

      // Process each brand for this POC
      for (const brandName of brandNames) {
        // 1. Check if brand exists
        const brand = await findBrandByName(brandName);

        if (!brand) {
          missingBrands.add(brandName);
          continue;
        }

        existingBrands.add(brandName);

        // 2. Check if client exists for this brand + phone
        let client = await Client.findOne({
          brandId: brand._id,
          phone: { $regex: normalizedPhone }
        });

        if (client) {
          // Client exists - verify alignment
          if (client.name !== pocName) {
            // Update name if different
            client.name = pocName;
            await client.save();
            updatedClients.push({
              brandName,
              pocName,
              phone: normalizedPhone,
              action: 'name_updated'
            });
          } else {
            existingClients.push({
              brandName,
              pocName,
              phone: normalizedPhone
            });
          }
        } else {
          // Client doesn't exist - create new client
          try {
            client = new Client({
              brandId: brand._id,
              name: pocName,
              phone: normalizedPhone,
              serviceMapping: [{
                department: 'solutions',
                isActive: true,
              }],
              isActive: true,
            });
            await client.save();
            createdClients.push({
              brandName,
              pocName,
              phone: normalizedPhone
            });
            console.log(`  ✨ Created client: ${pocName} for ${brandName}`);
          } catch (err) {
            // Handle duplicate key error (brand + phone already exists)
            if (err.code === 11000) {
              existingClients.push({
                brandName,
                pocName,
                phone: normalizedPhone,
                note: 'Already exists with different name'
              });
            } else {
              errors.push({
                brandName,
                pocName,
                phone: normalizedPhone,
                reason: err.message
              });
            }
          }
        }
      }
    }

    // Summary Report
    console.log('\n====================================================');
    console.log('📋 VALIDATION REPORT');
    console.log('====================================================\n');

    // Missing Brands
    if (missingBrands.size > 0) {
      console.log('❌ MISSING BRANDS (need to be created first):');
      console.log('--------------------------------------------');
      Array.from(missingBrands).sort().forEach((brand, i) => {
        console.log(`  ${i + 1}. ${brand}`);
      });
      console.log(`\n  Total missing brands: ${missingBrands.size}\n`);
    } else {
      console.log('✅ All brands exist in the database!\n');
    }

    // Created Clients
    if (createdClients.length > 0) {
      console.log('✨ CREATED CLIENTS:');
      console.log('-------------------');
      createdClients.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.pocName} (${c.phone}) - ${c.brandName}`);
      });
      console.log(`\n  Total created: ${createdClients.length}\n`);
    }

    // Updated Clients
    if (updatedClients.length > 0) {
      console.log('📝 UPDATED CLIENTS:');
      console.log('-------------------');
      updatedClients.forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.pocName} (${c.phone}) - ${c.brandName}`);
      });
      console.log(`\n  Total updated: ${updatedClients.length}\n`);
    }

    // Errors
    if (errors.length > 0) {
      console.log('⚠️  ERRORS:');
      console.log('----------');
      errors.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.pocName || 'Unknown'} - ${e.reason}`);
      });
      console.log(`\n  Total errors: ${errors.length}\n`);
    }

    // Final Summary
    console.log('====================================================');
    console.log('📊 SUMMARY');
    console.log('====================================================');
    console.log(`  ✅ Existing brands verified: ${existingBrands.size}`);
    console.log(`  ❌ Missing brands: ${missingBrands.size}`);
    console.log(`  ✨ Clients created: ${createdClients.length}`);
    console.log(`  📝 Clients updated: ${updatedClients.length}`);
    console.log(`  ✔️  Clients already exist: ${existingClients.length}`);
    console.log(`  ⚠️  Errors: ${errors.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

main();
