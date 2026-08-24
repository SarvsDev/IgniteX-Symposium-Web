export interface BusRoute {
  id: string;
  sNo: number;
  routeNo: string;
  routeName: string;
  routePath: string;
  stops: string[];
  driverName: string;
  driverPhone: string;
}

export const BUS_ROUTES_DATA: BusRoute[] = [
  {
    id: 'route-1',
    sNo: 1,
    routeNo: 'Route No : 1',
    routeName: 'KALAVAI',
    routePath: 'KALAVAI, KALAVAI KOOTROAD, RAANTHAM KOOTROAD, PERUNGATTUR, VENPAKKAM, IYANGARKULAM KOOTROAD, SEVILIMEDU, KANCHIPURAM, CAMPUS',
    stops: ['Kalavai', 'Kalavai Kootroad', 'Raantham Kootroad', 'Perungattur', 'Venpakkam', 'Iyangarkulam Kootroad', 'Sevilimedu', 'Kanchipuram', 'Campus'],
    driverName: 'Mr. Boobalan',
    driverPhone: '9952155632'
  },
  {
    id: 'route-1a',
    sNo: 2,
    routeNo: 'Route No : 1A',
    routeName: 'UTHIRAMERUR',
    routePath: 'UTHIRAMERUR, MAANAMADHIKOOTROAD, MAAGARAL, ORIKKAI, RANGHASWAMY KULAM, WALAJABAD, CAMPUS',
    stops: ['Uthiramerur', 'Maanamadhi Kootroad', 'Maagaral', 'Orikkai', 'Ranghaswamy Kulam', 'Walajabad', 'Campus'],
    driverName: 'Mr. Akbar',
    driverPhone: '9092661939'
  },
  {
    id: 'route-1b',
    sNo: 3,
    routeNo: 'Route No : 1B',
    routeName: 'CHEYYAR',
    routePath: 'CHEYYAR, MAANGALKOOTROAD, SEVILIMEDU, COLLECTOR OFFICE, THALUK OFFICE, CAMPUS',
    stops: ['Cheyyar', 'Maangal Kootroad', 'Sevilimedu', 'Collector Office', 'Taluk Office', 'Campus'],
    driverName: 'Mr. Mani',
    driverPhone: '9698757459'
  },
  {
    id: 'route-1c',
    sNo: 4,
    routeNo: 'Route No : 1C',
    routeName: 'SENTHAMANGALAM',
    routePath: 'SENTHAMANGALAM, THIRUMALPUR RAILWAY STATION, VELLAI GATE, GORI, GUJARATHI CHATHIRAM, CHITHRAGUPTHAR KOIL, POOKADAI CHATHIRAM, KAMMALA THERU, PARANDHUR EGANAAPURAM, MADHURAMANGALAM, KAANDHUR, CAMPUS',
    stops: ['Senthamangalam', 'Thirumalpur Railway Station', 'Vellai Gate', 'Gori', 'Gujarathi Chathiram', 'Chithragupthar Koil', 'Pookadai Chathiram', 'Kammala Theru', 'Parandhur Eganaapuram', 'Madhuramangalam', 'Kaandhur', 'Campus'],
    driverName: 'Mr. Muralidharan',
    driverPhone: '8098179728'
  },
  {
    id: 'route-2',
    sNo: 5,
    routeNo: 'Route No : 2',
    routeName: 'GUDIYATHAM',
    routePath: 'GUDIYATHAM, VELLORE, KAVERIPAAKAM, OCHERI, BALUCHETTICHATHIRAM, VELLAI GATE, CAMPUS',
    stops: ['Gudiyatham', 'Vellore', 'Kaveripaakam', 'Ocheri', 'Baluchettichathiram', 'Vellai Gate', 'Campus'],
    driverName: 'Mr. Balaji',
    driverPhone: '9445941487'
  },
  {
    id: 'route-2a',
    sNo: 6,
    routeNo: 'Route No : 2A',
    routeName: 'ARANI',
    routePath: 'ARANI, THIMIRI, ARCOT, RANIPETTAI, WALAJAPETTAI, KILAMBI, GORI, VELLAI GATE, CAMPUS',
    stops: ['Arani', 'Thimiri', 'Arcot', 'Ranipettai', 'Walajapettai', 'Kilambi', 'Gori', 'Vellai Gate', 'Campus'],
    driverName: 'Mr. Mathavan R',
    driverPhone: '9994525363'
  },
  {
    id: 'route-3',
    sNo: 7,
    routeNo: 'Route No : 3',
    routeName: 'THIRUTHANI',
    routePath: 'THIRUTHANI, THIRUTHANI RAILWAY STATION, ARAKKONAM, THAKKOLAMKOOTROAD, THAKKOLAM, SR-GATE PERAMPAAKAM, MAPPEDU, VAYALUR, CAMPUS',
    stops: ['Thiruthani', 'Thiruthani Railway Station', 'Arakkonam', 'Thakkolam Kootroad', 'Thakkolam', 'SR-Gate Perampaakam', 'Mappedu', 'Vayalur', 'Campus'],
    driverName: 'Mr. Dhandapani',
    driverPhone: '9597826775'
  },
  {
    id: 'route-4',
    sNo: 8,
    routeNo: 'Route No : 4',
    routeName: 'UTHUKOTTAI',
    routePath: 'UTHUKOTTAI, UTHUKOTTAI BUS STAND, KAANCHUR, SEDHANCHERI, POONDI, THIRUPAACHIUR, KADAMPATHUR, PERAMPAAKAM, ULUNDAI, CAMPUS',
    stops: ['Uthukottai', 'Uthukottai Bus Stand', 'Kaanchur', 'Sedhancheri', 'Poondi', 'Thirupaachiur', 'Kadampathur', 'Perampaakam', 'Ulundai', 'Campus'],
    driverName: 'Mr. Nadhamuni',
    driverPhone: '7845924523'
  },
  {
    id: 'route-4a',
    sNo: 9,
    routeNo: 'Route No : 4A',
    routeName: 'VALLIYURE',
    routePath: 'KILAANOOR, THIRUVALLUR THERADI, POOKKADAI, POST OFFICE, OIL MIL, MANAVALANAGAR, NALLAATHUR, POLIVAKKAM, KAATTU KOOTROAD, CAMPUS',
    stops: ['Kilaanoor', 'Thiruvallur Theradi', 'Pookkadai', 'Post Office', 'Oil Mil', 'Manavalanagar', 'Nallaathur', 'Polivakkam', 'Kaattu Kootroad', 'Campus'],
    driverName: 'Mr. Vinothkumar',
    driverPhone: '9942364268'
  },
  {
    id: 'route-5',
    sNo: 10,
    routeNo: 'Route No : 5',
    routeName: 'MADHURANTHAGAM',
    routePath: 'MADHURAANTHAGAM, KARUNGULI, PADALAM, CHENGALPATTU GH, RAATINAKINARU, CHENGALPATTU IYAPPAN KOIL, KOOTROAD, PAALLUR, WALAJABAD, KUNNAVAKKAM, ORAGADAM, SPD HIGH SCHOOL, CAMPUS',
    stops: ['Madhuranthagam', 'Karunguli', 'Padalam', 'Chengalpattu GH', 'Raatinakinaru', 'Chengalpattu Iyappan Koil', 'Kootroad', 'Paallur', 'Walajabad', 'Kunnavakkam', 'Oragadam', 'SPD High School', 'Campus'],
    driverName: 'Mr. Nayagam',
    driverPhone: '9585178253'
  },
  {
    id: 'route-5a',
    sNo: 11,
    routeNo: 'Route No : 5A',
    routeName: 'MAHENDRA CITY',
    routePath: 'MAHENDRA CITY, MARAIMALAINAGAR, PUTHERI, GUDUVANCHERI, KILAMPAAKAM, VANDALUR, MANNIVAKKAM, PADAIPPAI, ORAGADAM, SPD HIGH SCHOOL, CAMPUS',
    stops: ['Mahendra City', 'Maraimalainagar', 'Putheri', 'Guduvancheri', 'Kilampaakam', 'Vandalur', 'Mannivakkam', 'Padaippai', 'Oragadam', 'SPD High School', 'Campus'],
    driverName: 'Mr. Abdul',
    driverPhone: '9488611955'
  },
  {
    id: 'route-6',
    sNo: 12,
    routeNo: 'Route No : 6',
    routeName: 'GUMUDIPOONDI',
    routePath: 'GUMUDIPOONDI, KAVARAI PETTAI, THACHUR KOOTROAD, KAARANODAI, REDHILLS, PUYAL, KALLIKUPPAM, AMPATHUR, RAAKKI THEATER, THIRUMULLAI VAYIL, AVADI, PATTABIRAAM, THIRUNINDRAVUR, VEPPAMPATTU, KAALKALUR, MANAVALANAGAR, KATTU KOOTROAD, CAMPUS',
    stops: ['Gumudipoondi', 'Kavarai Pettai', 'Thachur Kootroad', 'Kaaranodai', 'Redhills', 'Puyal', 'Kallikuppam', 'Ampathur', 'Raakki Theater', 'Thirumullai Vayil', 'Avadi', 'Pattabiraam', 'Thirunindravur', 'Veppampattu', 'Kaalkalur', 'Manavalanagar', 'Kattu Kootroad', 'Campus'],
    driverName: 'Mr. Rajesh',
    driverPhone: '9003426874'
  },
  {
    id: 'route-7',
    sNo: 13,
    routeNo: 'Route No : 7',
    routeName: 'VILLIVAKKAM',
    routePath: 'VILLIVAAKAM, RETTERI, THIRUMANGALAM, PAADI BRIDGE, ANNANAGAR, GOLDEN FLAT, NOLAMBUR, MADHURAVAYAL, VANAGARAM, POONAMALLI, THANDALAM, MUGAPERU, CETTIPETTEDU, IRUNGATTU KOTTAI, SRIPERUBUDUR, CAMPUS',
    stops: ['Villivakkam', 'Retteri', 'Thirumangalam', 'Paadi Bridge', 'Annanagar', 'Golden Flat', 'Nolambur', 'Madhuravayal', 'Vanagaram', 'Poonamalli', 'Thandalam', 'Mugaperu', 'Cettipettedu', 'Irungattu Kottai', 'Sriperumbudur', 'Campus'],
    driverName: 'Mr. Magesh',
    driverPhone: '9043807080'
  },
  {
    id: 'route-7a',
    sNo: 14,
    routeNo: 'Route No : 7A',
    routeName: 'KOYAMBEDU',
    routePath: 'KOYAMBEDU, VADAPALANI, ASHOKEPILAR, PONDICHERRY GUST HOUSE, VALASARVAKKAM, KESAVARTHINI, PORUR, BOY KADAI, KUNDRATHUR, SRIPERUMBUDUR, CAMPUS',
    stops: ['Koyambedu', 'Vadapalani', 'Ashok Pillar', 'Pondicherry Guest House', 'Valasarvakkam', 'Kesavarthini', 'Porur', 'Boy Kadai', 'Kundrathur', 'Sriperumbudur', 'Campus'],
    driverName: 'Mr. Anbu',
    driverPhone: '9150469505'
  },
  {
    id: 'route-7b',
    sNo: 15,
    routeNo: 'Route No : 7B',
    routeName: 'THIRUVETRIUR',
    routePath: 'THIRUVETRIUR, MANALI, VANNARAPETTAI, PARIS, MOUNT ROAD, GEMINI FLYOVER, TEYNAMPET, SAIDAPET, GINDY, KATHIPARAI, MANAPAKKAM, PORUR, KATUPAKKAM, POONDAMALI, THANDALAM, KATU KOOT ROAD, CAMPUS',
    stops: ['Thiruvetriur', 'Manali', 'Vannarpettai', 'Paris Corner', 'Mount Road', 'Gemini Flyover', 'Teynampet', 'Saidapet', 'Guindy', 'Kathiparai', 'Manapakkam', 'Porur', 'Katupakkam', 'Poondamalli', 'Thandalam', 'Katu Koot Road', 'Campus'],
    driverName: 'Mr. Sathish',
    driverPhone: '7845456431'
  },
  {
    id: 'route-8',
    sNo: 16,
    routeNo: 'Route No : 8',
    routeName: 'KOVILAMBAKKAM',
    routePath: 'KOVILAMBAKKAM, KAMACHI HOSPITAL, MADIPAKKAM, NANGANALUR, PALLAVARAM, PAMBAL, ANAGAPUDHUR, KARANUR, SOMAMNGALAM, SPD, CAMPUS',
    stops: ['Kovilambakkam', 'Kamachi Hospital', 'Madipakkam', 'Nanganallur', 'Pallavaram', 'Pammal', 'Anagaputhur', 'Karanur', 'Somangalam', 'SPD', 'Campus'],
    driverName: 'Mr. Ragu',
    driverPhone: '8940356669'
  },
  {
    id: 'route-9',
    sNo: 17,
    routeNo: 'Route No : 9',
    routeName: 'MAIN CAMPUS',
    routePath: 'PADUR, NAVALUR, KELAMBAKKAM, KANDIGAI, MAMBAKKAM, VANDALUR, TAMBARAM BRIGE, MANIMANGALAM, JK TYE, SPD HIGH SCHOOL, CAMPUS',
    stops: ['Padur', 'Navalur', 'Kelambakkam', 'Kandigai', 'Mambakkam', 'Vandalur', 'Tambaram Bridge', 'Manimangalam', 'JK Tyre', 'SPD High School', 'Campus'],
    driverName: 'Mr. Manikandan',
    driverPhone: '8939093763'
  },
  {
    id: 'route-10',
    sNo: 18,
    routeNo: 'Route No : 10',
    routeName: 'SRIPERUMBUDUR',
    routePath: 'AN KANDIGAI, POTHU KOVIL, SRIPERMUBUDUR, HIGH SCHOOL, VADAMANGALAM, CAMPUS',
    stops: ['An Kandigai', 'Pothu Kovil', 'Sriperumbudur', 'High School', 'Vadamangalam', 'Campus'],
    driverName: 'Mr. Selvam',
    driverPhone: '8608054301'
  },
  {
    id: 'route-10a',
    sNo: 19,
    routeNo: 'Route No : 10A',
    routeName: 'PERAMBAKKAM',
    routePath: 'PERAMBAKKAM, MAPEDU, PANNUR, SONGANDI, SUNGUVACHTHIRAM, VADAMANGALAM, CAMPUS',
    stops: ['Perambakkam', 'Mappedu', 'Pannur', 'Songandi', 'Sunguvarchatram', 'Vadamangalam', 'Campus'],
    driverName: 'Mr. G Kumar',
    driverPhone: '8667762585'
  }
];
