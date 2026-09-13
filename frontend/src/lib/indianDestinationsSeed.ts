// indianDestinationsSeed.ts
// Drop this file in your project and call seedIndianDestinations() once on app init
// (or call it from tourGuidePlacesStore.init() if the store is empty)

export interface DestinationSeed {
  id: string;
  name: string;
  country: string;
  location: string;
  category: string;
  season: string;
  difficulty: string;
  budget: string;
  currency: string;
  days: string;
  transport: string;
  rating: string;
  image: string;
  description: string;
  highlights: string;
  tips: string;
  lat: number;
  lng: number;
  status: 'Active' | 'Inactive';
  addedBy: string;
}

export const INDIAN_DESTINATIONS: DestinationSeed[] = [
  // ─────────────────────────────────────────────
  // 1. Taj Mahal
  // ─────────────────────────────────────────────
  {
    id: 'seed-001',
    name: 'Taj Mahal',
    country: 'India',
    location: 'Agra, Uttar Pradesh',
    category: 'Heritage',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '3000',
    currency: '₹',
    days: '2',
    transport: 'Train / Road',
    rating: '5.0',
    image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&q=80',
    description:
      'One of the Seven Wonders of the World, the Taj Mahal is a white-marble mausoleum built by Mughal Emperor Shah Jahan in memory of his beloved wife Mumtaz Mahal. It stands as the pinnacle of Mughal architecture on the banks of the Yamuna River.',
    highlights: 'Sunrise view, Moonlit Taj, Agra Fort, Mehtab Bagh, Mughal craftsmanship',
    tips: 'Visit at sunrise for the best golden light. Book tickets online to skip queues. The monument is closed on Fridays.',
    lat: 27.1751,
    lng: 78.0421,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 2. Kerala Backwaters
  // ─────────────────────────────────────────────
  {
    id: 'seed-002',
    name: 'Kerala Backwaters',
    country: 'India',
    location: 'Alleppey, Kerala',
    category: 'Nature',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '8000',
    currency: '₹',
    days: '3',
    transport: 'Road / Houseboat',
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&q=80',
    description:
      'The Kerala Backwaters are a network of interconnected canals, rivers, lakes, and inlets formed by more than 900 km of waterways. A houseboat cruise through Alleppey, also called the Venice of the East, is an unforgettable experience.',
    highlights: 'Houseboat stay, Vembanad Lake, Paddy fields, Sunset cruise, Village life, Snake boat races',
    tips: 'Book a premium houseboat for an overnight experience. October to February is ideal. Carry mosquito repellent for evening cruises.',
    lat: 9.4981,
    lng: 76.3388,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 3. Varanasi Ghats
  // ─────────────────────────────────────────────
  {
    id: 'seed-003',
    name: 'Varanasi Ghats',
    country: 'India',
    location: 'Varanasi, Uttar Pradesh',
    category: 'Spiritual',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '4000',
    currency: '₹',
    days: '3',
    transport: 'Train / Flight',
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=1200&q=80',
    description:
      "Varanasi, one of the world's oldest living cities, sits on the sacred banks of the Ganga. Its 88 ghats come alive every evening with the mesmerizing Ganga Aarti — a ritual of fire, chants, and devotion that has been performed for centuries.",
    highlights: 'Dashashwamedh Ghat Aarti, Manikarnika Ghat, Sarnath, Kashi Vishwanath Temple, Boat ride at dawn',
    tips: 'Take a boat ride at sunrise. Attend the Ganga Aarti at Dashashwamedh Ghat. Comfortable walking shoes are essential on the ghats.',
    lat: 25.3176,
    lng: 82.9739,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 4. Jaipur – Pink City
  // ─────────────────────────────────────────────
  {
    id: 'seed-004',
    name: 'Jaipur – Pink City',
    country: 'India',
    location: 'Jaipur, Rajasthan',
    category: 'Heritage',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '6000',
    currency: '₹',
    days: '3',
    transport: 'Train / Flight / Road',
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&q=80',
    description:
      'Jaipur, the capital of Rajasthan, is famous for its stunning palaces, forts, and bazaars. Known as the Pink City because its old town is painted a distinctive terracotta-pink, it is part of the Golden Triangle tourist circuit along with Delhi and Agra.',
    highlights: 'Amber Fort, Hawa Mahal, City Palace, Jantar Mantar, Johari Bazaar, Nahargarh Fort',
    tips: 'Hire a local auto-rickshaw for the day for affordable sightseeing. Bargain at Johari Bazaar for gems and jewellery. Carry water — it gets hot even in winter.',
    lat: 26.9124,
    lng: 75.7873,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 5. Ladakh
  // ─────────────────────────────────────────────
  {
    id: 'seed-005',
    name: 'Ladakh',
    country: 'India',
    location: 'Leh, Ladakh',
    category: 'Adventure',
    season: 'Summer',
    difficulty: 'Hard',
    budget: '25000',
    currency: '₹',
    days: '7',
    transport: 'Flight / Road (Manali–Leh highway)',
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=1200&q=80',
    description:
      "Ladakh, the Land of High Passes, is a cold high-altitude desert nestled between the Himalayas and the Karakoram range. With dramatic landscapes, crystal-clear lakes, ancient monasteries, and world-class biking routes, it is every adventure seeker's paradise.",
    highlights: 'Pangong Lake, Nubra Valley, Khardung La Pass, Hemis Monastery, Magnetic Hill, Zanskar River',
    tips: 'Acclimatize for at least 2 days in Leh before any excursion. Carry an oxygen cylinder if prone to altitude sickness. The Manali–Leh road is open only May–October.',
    lat: 34.1526,
    lng: 77.5771,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 6. Goa Beaches
  // ─────────────────────────────────────────────
  {
    id: 'seed-006',
    name: 'Goa Beaches',
    country: 'India',
    location: 'Panaji, Goa',
    category: 'Beach',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '10000',
    currency: '₹',
    days: '5',
    transport: 'Flight / Train',
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&q=80',
    description:
      "Goa, India's smallest state, is synonymous with sun, sand, and sea. With over 100 km of coastline dotted with pristine beaches, colonial Portuguese architecture, vibrant nightlife, and fresh seafood, it is India's most loved holiday destination.",
    highlights: 'Calangute Beach, Baga Beach, Dudhsagar Falls, Old Goa churches, Spice plantations, Anjuna flea market',
    tips: 'North Goa is for nightlife; South Goa for peaceful beaches. Rent a scooter for the most convenient exploration. The monsoon season (Jun–Sep) has rough seas but lush scenery.',
    lat: 15.2993,
    lng: 74.1240,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 7. Manali
  // ─────────────────────────────────────────────
  {
    id: 'seed-007',
    name: 'Manali',
    country: 'India',
    location: 'Manali, Himachal Pradesh',
    category: 'Adventure',
    season: 'Summer',
    difficulty: 'Moderate',
    budget: '12000',
    currency: '₹',
    days: '5',
    transport: 'Road / Flight to Kullu',
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1200&q=80',
    description:
      'Manali is a high-altitude Himalayan resort town in Himachal Pradesh. A gateway to adventure — skiing, paragliding, river rafting, and trekking — it is also known for apple orchards, cedar forests, ancient temples, and the iconic Rohtang Pass.',
    highlights: 'Rohtang Pass, Solang Valley, Hadimba Temple, Old Manali, Beas River rafting, Paragliding',
    tips: 'Book Rohtang Pass permits online in advance. Visit Solang Valley in winter for snow activities. Old Manali has excellent cafes and a bohemian vibe.',
    lat: 32.2396,
    lng: 77.1887,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 8. Ranthambore National Park
  // ─────────────────────────────────────────────
  {
    id: 'seed-008',
    name: 'Ranthambore National Park',
    country: 'India',
    location: 'Sawai Madhopur, Rajasthan',
    category: 'Wildlife',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '9000',
    currency: '₹',
    days: '3',
    transport: 'Train / Road',
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?w=1200&q=80',
    description:
      "Ranthambore is one of India's finest and most famous wildlife reserves, renowned for its Bengal tigers. The park uniquely blends wildlife with history — the ruins of the 10th-century Ranthambore Fort rise dramatically above the jungle.",
    highlights: 'Bengal Tiger sighting, Ranthambore Fort, Padam Lake, Leopard, Sloth Bear, Crocodile, Over 300 bird species',
    tips: 'Book safari zones 1–5 for the highest tiger sighting probability. Early morning safaris are most rewarding. Carry binoculars and a zoom camera lens.',
    lat: 26.0173,
    lng: 76.5026,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 9. Andaman Islands
  // ─────────────────────────────────────────────
  {
    id: 'seed-009',
    name: 'Andaman Islands',
    country: 'India',
    location: 'Port Blair, Andaman & Nicobar',
    category: 'Beach',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '20000',
    currency: '₹',
    days: '6',
    transport: 'Flight',
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=1200&q=80',
    description:
      "The Andaman Islands are an archipelago of over 570 islands in the Bay of Bengal, known for their turquoise waters, white-sand beaches, and rich marine biodiversity. Havelock Island and Neil Island offer some of Asia's best snorkelling and scuba diving.",
    highlights: 'Radhanagar Beach, Scuba diving, Cellular Jail, Elephant Beach, Bioluminescent plankton, Glass-bottom boat',
    tips: 'Apply for a Restricted Area Permit (RAP) in advance for certain islands. November to May is the best time. Book dive trips with certified PADI operators.',
    lat: 11.7401,
    lng: 92.6586,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 10. Mysore
  // ─────────────────────────────────────────────
  {
    id: 'seed-010',
    name: 'Mysore Palace & City',
    country: 'India',
    location: 'Mysore, Karnataka',
    category: 'Heritage',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '5000',
    currency: '₹',
    days: '2',
    transport: 'Train / Road',
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1590076082245-5a70e9d3b64f?w=1200&q=80',
    description:
      "Mysore, the City of Palaces, is home to the magnificent Mysore Palace — one of the most visited monuments in India. The city is famous for its royal heritage, silk sarees, sandalwood products, and the spectacular Dasara festival.",
    highlights: "Mysore Palace, Chamundeshwari Temple, Brindavan Gardens, Devaraja Market, St. Philomena's Church, Mysore Pak sweet",
    tips: 'Visit during Dasara (October) for the grand palace illumination. The palace is lit up with 97,000 bulbs every Sunday evening. Silk sarees from Cauvery outlet are authentic.',
    lat: 12.2958,
    lng: 76.6394,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 11. Hampi
  // ─────────────────────────────────────────────
  {
    id: 'seed-011',
    name: 'Hampi',
    country: 'India',
    location: 'Hampi, Karnataka',
    category: 'Heritage',
    season: 'Winter',
    difficulty: 'Moderate',
    budget: '5000',
    currency: '₹',
    days: '3',
    transport: 'Train / Road',
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1570458436416-b8fcccfe883f?w=1200&q=80',
    description:
      "Hampi, a UNESCO World Heritage Site, was once the capital of the Vijayanagara Empire — the second-largest medieval-era city in the world. Today its boulder-strewn landscape is littered with stunning temple ruins, chariot streets, and royal enclosures.",
    highlights: "Virupaksha Temple, Stone Chariot, Lotus Mahal, Queen's Bath, Tungabhadra River, Sunset from Matanga Hill",
    tips: 'Rent a bicycle or scooter to navigate the vast site. The Virupaksha Temple opens at 6 AM. Sunrise from Matanga Hill is spectacular and less crowded.',
    lat: 15.3350,
    lng: 76.4600,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 12. Darjeeling
  // ─────────────────────────────────────────────
  {
    id: 'seed-012',
    name: 'Darjeeling',
    country: 'India',
    location: 'Darjeeling, West Bengal',
    category: 'Nature',
    season: 'Spring',
    difficulty: 'Easy',
    budget: '8000',
    currency: '₹',
    days: '4',
    transport: 'Flight to Bagdogra / Toy Train',
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80',
    description:
      "Darjeeling, the Queen of the Hills, sits at 2,000 m in West Bengal and offers breathtaking views of the Kangchenjunga — the world's third-highest peak. It is synonymous with premium Darjeeling tea and the iconic UNESCO-listed Darjeeling Himalayan Railway (Toy Train).",
    highlights: 'Tiger Hill sunrise, Toy Train, Tea garden tours, Kangchenjunga views, Peace Pagoda, Batasia Loop',
    tips: 'Wake up at 4 AM for the Tiger Hill sunrise over Kangchenjunga. Book Toy Train joyrides early — seats fill fast. March–May is the best season for clear mountain views.',
    lat: 27.0360,
    lng: 88.2627,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 13. Udaipur – City of Lakes
  // ─────────────────────────────────────────────
  {
    id: 'seed-013',
    name: 'Udaipur – City of Lakes',
    country: 'India',
    location: 'Udaipur, Rajasthan',
    category: 'Heritage',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '8000',
    currency: '₹',
    days: '3',
    transport: 'Train / Flight',
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1590136131886-d6a2a244c3b5?w=1200&q=80',
    description:
      "Udaipur, the City of Lakes, is arguably India's most romantic destination. Set around a series of shimmering lakes and ringed by the Aravalli hills, its white-marble palaces, havelis, and temples create a fairy-tale skyline reflected in Lake Pichola.",
    highlights: 'Lake Pichola boat ride, City Palace, Jag Mandir, Sajjangarh Monsoon Palace, Bagore-ki-Haveli, Saheliyon-ki-Bari',
    tips: 'Take an evening boat ride on Lake Pichola for unmatched views of the City Palace. Stay in a heritage haveli for the full experience. The Old City is best explored on foot.',
    lat: 24.5854,
    lng: 73.7125,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 14. Rishikesh
  // ─────────────────────────────────────────────
  {
    id: 'seed-014',
    name: 'Rishikesh',
    country: 'India',
    location: 'Rishikesh, Uttarakhand',
    category: 'Adventure',
    season: 'Spring',
    difficulty: 'Moderate',
    budget: '6000',
    currency: '₹',
    days: '3',
    transport: 'Train / Road',
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1562019804-aca7f33bd003?w=1200&q=80',
    description:
      'Rishikesh, the Yoga Capital of the World and the Adventure Capital of India, sits at the foothills of the Himalayas where the Ganga flows down from the mountains. It offers white-water rafting, bungee jumping, yoga retreats, and serene ashrams.',
    highlights: 'River Rafting on Ganga, Laxman Jhula, Bungee Jumping, Ganga Aarti at Triveni Ghat, Beatles Ashram, Neer Gaddu waterfall',
    tips: 'Rafting is best Feb–May and Sep–Nov. Stay at a riverside camp for a unique experience. Book bungee jumping (Jumping Heights) in advance as slots fill quickly.',
    lat: 30.0869,
    lng: 78.2676,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 15. Amritsar – Golden Temple
  // ─────────────────────────────────────────────
  {
    id: 'seed-015',
    name: 'Golden Temple (Harmandir Sahib)',
    country: 'India',
    location: 'Amritsar, Punjab',
    category: 'Spiritual',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '4000',
    currency: '₹',
    days: '2',
    transport: 'Flight / Train',
    rating: '5.0',
    image: 'https://images.unsplash.com/photo-1588416499018-d8c621e7d2c2?w=1200&q=80',
    description:
      'The Golden Temple (Harmandir Sahib) in Amritsar is the holiest shrine in Sikhism and one of the most visited religious sites in the world. Its golden exterior shimmers on the sacred Amrit Sarovar pool. The Langar (community kitchen) serves free meals to over 100,000 people daily.',
    highlights: 'Golden Temple at dawn, Langar experience, Wagah Border Ceremony, Jallianwala Bagh, Partition Museum',
    tips: 'Visit at 4 AM for the serene early-morning darshan — almost no queues. Cover your head and remove shoes before entering. The Wagah Border ceremony at sunset is a thrilling patriotic experience.',
    lat: 31.6200,
    lng: 74.8765,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 16. Coorg (Kodagu)
  // ─────────────────────────────────────────────
  {
    id: 'seed-016',
    name: 'Coorg (Kodagu)',
    country: 'India',
    location: 'Madikeri, Karnataka',
    category: 'Nature',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '9000',
    currency: '₹',
    days: '3',
    transport: 'Road',
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1542401886-65d6c61db217?w=1200&q=80',
    description:
      "Coorg, also known as Kodagu, is the Scotland of India — a lush hill station blanketed with coffee and spice plantations, misty valleys, and roaring waterfalls. Home to the warrior Kodava people, it offers a unique culture, homestay experiences, and fantastic trekking.",
    highlights: "Abbey Falls, Raja's Seat, Coffee plantation walks, Iruppu Falls, Nagarhole National Park, Brahmagiri Trek",
    tips: 'Stay at a coffee plantation homestay for an authentic experience. October to March is ideal. Carry a light jacket as evenings are cool year-round.',
    lat: 12.4244,
    lng: 75.7382,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 17. Jim Corbett National Park
  // ─────────────────────────────────────────────
  {
    id: 'seed-017',
    name: 'Jim Corbett National Park',
    country: 'India',
    location: 'Ramnagar, Uttarakhand',
    category: 'Wildlife',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '8000',
    currency: '₹',
    days: '3',
    transport: 'Train / Road',
    rating: '4.6',
    image: 'https://images.unsplash.com/photo-1551361415-69c87624334f?w=1200&q=80',
    description:
      "Jim Corbett National Park, established in 1936, is India's oldest national park and one of the finest tiger reserves in the world. Set in the foothills of the Himalayas along the Ramganga River, it offers jeep safaris, elephant rides, and extraordinary birdwatching.",
    highlights: 'Bengal Tiger safari, Elephant safari, Dhikala zone, Corbett Waterfall, Sitabani forest, Over 600 bird species',
    tips: 'The Dhikala zone has the best wildlife density — book months in advance. Feb–April offers the best sighting chances as vegetation thins. Carry a telephoto lens (300mm+).',
    lat: 29.5300,
    lng: 78.7747,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 18. Jodhpur – Blue City
  // ─────────────────────────────────────────────
  {
    id: 'seed-018',
    name: 'Jodhpur – Blue City',
    country: 'India',
    location: 'Jodhpur, Rajasthan',
    category: 'Heritage',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '6000',
    currency: '₹',
    days: '2',
    transport: 'Flight / Train',
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=1200&q=80',
    description:
      "Jodhpur, the Blue City of India, is dominated by the mighty Mehrangarh Fort towering 400 feet above the city. The old town below is a sea of indigo-blue houses — a magical spectacle from the fort walls. Famous for its Rajasthani cuisine and antique markets.",
    highlights: 'Mehrangarh Fort, Jaswant Thada, Umaid Bhawan Palace, Ghanta Ghar clock tower, Sardar Market, Mandore Gardens',
    tips: "The view of the blue city from Mehrangarh Fort's ramparts is best photographed in the morning light. Taste the famous Mirchi Vada and Pyaaz Kachori at Shri Mishrilal Hotel.",
    lat: 26.2389,
    lng: 73.0243,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 19. Munnar
  // ─────────────────────────────────────────────
  {
    id: 'seed-019',
    name: 'Munnar',
    country: 'India',
    location: 'Munnar, Kerala',
    category: 'Nature',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '7000',
    currency: '₹',
    days: '3',
    transport: 'Road',
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1571990611777-b8dc5c01d0e5?w=1200&q=80',
    description:
      'Munnar is a serene hill station in the Western Ghats of Kerala, set at 1,600 m amidst rolling hills carpeted with tea, coffee, and cardamom plantations. The drive through hairpin bends, misty valleys, and emerald-green estates is as beautiful as the destination itself.',
    highlights: 'Eravikulam National Park, Neelakurinji blooms, Top Station, Tea Museum, Mattupetty Dam, Attukal Waterfalls',
    tips: 'Visit Eravikulam NP early morning for Nilgiri Tahr sightings. Neelakurinji blooms only once every 12 years (next in 2030). Avoid peak season (Dec–Jan) to dodge crowds.',
    lat: 10.0889,
    lng: 77.0595,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 20. Spiti Valley
  // ─────────────────────────────────────────────
  {
    id: 'seed-020',
    name: 'Spiti Valley',
    country: 'India',
    location: 'Kaza, Himachal Pradesh',
    category: 'Adventure',
    season: 'Summer',
    difficulty: 'Expert',
    budget: '20000',
    currency: '₹',
    days: '7',
    transport: 'Road (Manali or Shimla route)',
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1560179406-1c6c60e0dc76?w=1200&q=80',
    description:
      'Spiti Valley, the "Middle Land" between India and Tibet, is a remote cold desert in Himachal Pradesh at an average elevation of 3,800 m. With ancient Buddhist monasteries perched on sheer cliff faces, turquoise rivers, and a starscape unlike anywhere else, it is a true hidden gem.',
    highlights: 'Key Monastery, Chandratal Lake, Dhankar Monastery, Pin Valley, Langza fossil village, Stargazing at Kaza',
    tips: 'Carry enough cash — there are very few ATMs. The Shimla route (via Kinnaur) is open longer than Manali route. Altitude sickness is real — acclimatize gradually.',
    lat: 32.2257,
    lng: 78.0694,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 21. Ajanta & Ellora Caves
  // ─────────────────────────────────────────────
  {
    id: 'seed-021',
    name: 'Ajanta & Ellora Caves',
    country: 'India',
    location: 'Aurangabad, Maharashtra',
    category: 'Heritage',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '5000',
    currency: '₹',
    days: '2',
    transport: 'Flight / Train',
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1578338076801-7b5e00e90f2e?w=1200&q=80',
    description:
      "The Ajanta and Ellora Caves are two separate UNESCO World Heritage Sites near Aurangabad. Ajanta's 30 rock-cut Buddhist caves feature exquisite 2nd-century BC paintings and sculptures. Ellora's 34 caves encompass Buddhist, Hindu, and Jain temples, including the monolithic Kailasa Temple.",
    highlights: 'Kailasa Temple at Ellora, Ajanta murals, Cave 26 at Ajanta, Buddhist chaityas, Daulatabad Fort nearby',
    tips: 'Both sites are closed on different days — Ajanta on Monday, Ellora on Tuesday. Start with Ajanta (they require more time). The UNESCO-listed Kailasa Temple alone is worth the trip.',
    lat: 20.5520,
    lng: 75.7005,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 22. Ooty
  // ─────────────────────────────────────────────
  {
    id: 'seed-022',
    name: 'Ooty (Udhagamandalam)',
    country: 'India',
    location: 'Ooty, Tamil Nadu',
    category: 'Nature',
    season: 'Spring',
    difficulty: 'Easy',
    budget: '6000',
    currency: '₹',
    days: '3',
    transport: 'Road / Nilgiri Mountain Railway',
    rating: '4.5',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&q=80',
    description:
      'Ooty, the Queen of Hill Stations, sits at 2,240 m in the Nilgiri Hills of Tamil Nadu. Famous for its botanical gardens, tea estates, and the UNESCO-listed Nilgiri Mountain Railway (the "Toy Train"), it has been a popular retreat since the British colonial era.',
    highlights: 'Nilgiri Mountain Railway, Government Botanical Garden, Ooty Lake, Doddabetta Peak, Rose Garden, Tea Factory tour',
    tips: 'Book the Nilgiri Mountain Railway (Mettupalayam–Ooty) months in advance — seats are extremely limited. April–June is the flower season. Home-made chocolates from local shops are a must-buy.',
    lat: 11.4064,
    lng: 76.6932,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 23. Kaziranga National Park
  // ─────────────────────────────────────────────
  {
    id: 'seed-023',
    name: 'Kaziranga National Park',
    country: 'India',
    location: 'Golaghat, Assam',
    category: 'Wildlife',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '10000',
    currency: '₹',
    days: '3',
    transport: 'Flight to Guwahati / Road',
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1551316679-9c6ae9dec224?w=1200&q=80',
    description:
      "Kaziranga National Park is a UNESCO World Heritage Site and home to two-thirds of the world's great one-horned rhinoceroses. Spread across the floodplains of the Brahmaputra river in Assam, it also shelters tigers, elephants, wild buffaloes, and over 480 bird species.",
    highlights: 'One-horned Rhinoceros, Elephant safari, Tiger, Wild Water Buffalo, Brahmaputra river views, Orchid Park',
    tips: 'Elephant safaris at dawn offer the best rhino sightings. November to April is the ideal season. The park is closed during monsoon (June–October) due to flooding.',
    lat: 26.5775,
    lng: 93.1711,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 24. Mahabalipuram
  // ─────────────────────────────────────────────
  {
    id: 'seed-024',
    name: 'Mahabalipuram',
    country: 'India',
    location: 'Mamallapuram, Tamil Nadu',
    category: 'Heritage',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '3000',
    currency: '₹',
    days: '2',
    transport: 'Road from Chennai',
    rating: '4.6',
    image: 'https://images.unsplash.com/photo-1604413191066-4dd20bedf486?w=1200&q=80',
    description:
      "Mahabalipuram, a UNESCO World Heritage Site, is a 7th-century port city of the Pallava dynasty on the Coromandel Coast. Its rock-cut temples, monolithic rathas (chariots), and the massive open-air relief \"Arjuna's Penance\" are masterpieces of ancient Indian sculpture.",
    highlights: "Shore Temple, Pancha Rathas, Arjuna's Penance bas-relief, Krishna's Butterball, Mahishasuramardini Cave",
    tips: 'Combine with a day trip to Pondicherry (just 100 km south). The Shore Temple is best photographed at sunrise with waves crashing behind it. Wear comfortable walking shoes.',
    lat: 12.6269,
    lng: 80.1927,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 25. Valley of Flowers
  // ─────────────────────────────────────────────
  {
    id: 'seed-025',
    name: 'Valley of Flowers',
    country: 'India',
    location: 'Chamoli, Uttarakhand',
    category: 'Nature',
    season: 'Summer',
    difficulty: 'Hard',
    budget: '12000',
    currency: '₹',
    days: '5',
    transport: 'Road to Govindghat / Trek',
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&q=80',
    description:
      'The Valley of Flowers is a UNESCO World Heritage Site in Uttarakhand, accessible only by a 17 km trek from Govindghat. During July–September the valley transforms into a canvas of over 500 species of alpine wildflowers against a backdrop of snow-capped Himalayan peaks.',
    highlights: 'Alpine flower meadows, Hemkund Sahib Gurudwara, Bhyundar Ganga river, Snow peaks, Rare Himalayan fauna',
    tips: 'The valley is open only July 1 to October 31. Carry trekking poles — the trail has snow patches. Camp at Ghangaria (the last village) as the base. No camping inside the valley.',
    lat: 30.7281,
    lng: 79.6078,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 26. Pondicherry
  // ─────────────────────────────────────────────
  {
    id: 'seed-026',
    name: 'Pondicherry (Puducherry)',
    country: 'India',
    location: 'Puducherry, Puducherry',
    category: 'Heritage',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '5000',
    currency: '₹',
    days: '3',
    transport: 'Road / Train',
    rating: '4.6',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&q=80',
    description:
      'Pondicherry, the French Riviera of the East, is a former French colony with a unique blend of Dravidian and French cultures. The charming French Quarter (White Town) has tree-lined boulevards, pastel-coloured villas, cafes, and boutiques — all just steps from the Bay of Bengal.',
    highlights: 'French Quarter promenade, Auroville Matrimandir, Sri Aurobindo Ashram, Paradise Beach, Scuba diving, French cuisine',
    tips: 'Rent a bicycle and ride through the French Quarter at sunrise — magical with minimal traffic. Auroville\'s Matrimandir requires advance booking. The beer is cheaper here (Union Territory, lower tax).',
    lat: 11.9416,
    lng: 79.8083,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 27. Khajuraho
  // ─────────────────────────────────────────────
  {
    id: 'seed-027',
    name: 'Khajuraho Temples',
    country: 'India',
    location: 'Khajuraho, Madhya Pradesh',
    category: 'Heritage',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '5000',
    currency: '₹',
    days: '2',
    transport: 'Flight / Train',
    rating: '4.6',
    image: 'https://images.unsplash.com/photo-1574783932270-6c33c6b35e4d?w=1200&q=80',
    description:
      'The Khajuraho Group of Monuments is a UNESCO World Heritage Site featuring 85 temples built by the Chandela dynasty between 950 and 1050 AD. Famous worldwide for their intricate erotic sculptures, the temples are masterpieces of medieval Indian architecture and a celebration of life, love, and spirituality.',
    highlights: 'Kandariya Mahadeva Temple, Western Group temples, Sound & Light Show, Panna National Park nearby, Raneh Falls',
    tips: 'The Sound & Light Show (₹250) in the evenings beautifully narrates the history of the temples. The Western Group has the most significant temples. Combine with a Panna Tiger Reserve safari.',
    lat: 24.8318,
    lng: 79.9199,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 28. Sundarbans
  // ─────────────────────────────────────────────
  {
    id: 'seed-028',
    name: 'Sundarbans',
    country: 'India',
    location: 'South 24 Parganas, West Bengal',
    category: 'Wildlife',
    season: 'Winter',
    difficulty: 'Moderate',
    budget: '8000',
    currency: '₹',
    days: '3',
    transport: 'Road + Boat from Kolkata',
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1600773454100-0d2ed1551e8b?w=1200&q=80',
    description:
      "The Sundarbans is the world's largest mangrove delta and a UNESCO World Heritage Site, shared between India and Bangladesh. It is the last stronghold of the Royal Bengal Tiger, which has uniquely adapted to a semi-aquatic lifestyle. Boat safaris through labyrinthine waterways are the only way to explore.",
    highlights: 'Royal Bengal Tiger, Mangrove forests, Estuarine Crocodile, Spotted Deer, Irrawaddy Dolphin, Watchtowers',
    tips: 'An entry permit is required. Stay on the boat at all times inside the forest. November to February offers the best wildlife sighting conditions. A forest guide is compulsory.',
    lat: 21.9497,
    lng: 88.9468,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 29. Pushkar
  // ─────────────────────────────────────────────
  {
    id: 'seed-029',
    name: 'Pushkar',
    country: 'India',
    location: 'Pushkar, Rajasthan',
    category: 'Spiritual',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '4000',
    currency: '₹',
    days: '2',
    transport: 'Train / Road',
    rating: '4.6',
    image: 'https://images.unsplash.com/photo-1625033700027-ee9de4f3a4e9?w=1200&q=80',
    description:
      'Pushkar, one of the oldest cities in India, is built around the sacred Pushkar Lake and is home to one of the world\'s only temples dedicated to Lord Brahma. Every November, it hosts the famous Pushkar Camel Fair — a spectacular gathering of 200,000 camels, horses, and cattle.',
    highlights: 'Brahma Temple, Pushkar Lake 52 ghats, Camel Fair (November), Savitri Mata Temple, Pushkar Bazaar, Hot air balloon',
    tips: 'Alcohol and meat are strictly prohibited in the holy town. The Camel Fair is a photographer\'s paradise — book accommodation a year in advance for fair dates. Hot air balloon rides above the fair are unforgettable.',
    lat: 26.4899,
    lng: 74.5515,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 30. Lakshadweep
  // ─────────────────────────────────────────────
  {
    id: 'seed-030',
    name: 'Lakshadweep Islands',
    country: 'India',
    location: 'Kavaratti, Lakshadweep',
    category: 'Beach',
    season: 'Winter',
    difficulty: 'Moderate',
    budget: '30000',
    currency: '₹',
    days: '5',
    transport: 'Flight / Ship from Kochi',
    rating: '4.9',
    image: 'https://images.unsplash.com/photo-1504275807627-fd59e4af4db8?w=1200&q=80',
    description:
      "Lakshadweep is India's smallest Union Territory — a group of 36 coral islands in the Arabian Sea with some of the clearest lagoons, untouched coral reefs, and most pristine beaches in Asia. Only 10 islands are inhabited and tourist footfall is deliberately kept low, preserving its pristine nature.",
    highlights: 'Agatti Island lagoon, Scuba diving on coral reefs, Glass-bottom boat, Bangaram Island resort, Kayaking, Uninhabited island picnics',
    tips: 'Indian nationals need an Entry Permit from the Lakshadweep Administration. Tourism is limited and packages must be booked via SPORTS (Society for Promotion of Nature Tourism). Snorkelling is free and spectacular right off the beach.',
    lat: 10.5669,
    lng: 72.6420,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 31. Sikkim
  // ─────────────────────────────────────────────
  {
    id: 'seed-031',
    name: 'Sikkim – Gangtok & Gurudongmar',
    country: 'India',
    location: 'Gangtok, Sikkim',
    category: 'Nature',
    season: 'Spring',
    difficulty: 'Hard',
    budget: '15000',
    currency: '₹',
    days: '6',
    transport: 'Flight to Bagdogra / Road',
    rating: '4.8',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    description:
      'Sikkim, the smallest state of India, is a Buddhist kingdom nestled in the Eastern Himalayas. From the buzzing capital Gangtok to the sacred Gurudongmar Lake at 5,183 m — one of the highest lakes in the world — it offers Himalayan vistas, rhododendron forests, monasteries, and zero-waste mountain villages.',
    highlights: 'Gurudongmar Lake, Tsomgo (Changu) Lake, Rumtek Monastery, Nathula Pass, MG Marg Gangtok, Khangchendzonga views',
    tips: 'Inner Line Permit (ILP) and Protected Area Permit (PAP) are required for North Sikkim. Book permits 30 days in advance. Nathula Pass (4,310 m) requires an additional permit from Sikkim Tourism.',
    lat: 27.3314,
    lng: 88.6138,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 32. Konark Sun Temple
  // ─────────────────────────────────────────────
  {
    id: 'seed-032',
    name: 'Konark Sun Temple',
    country: 'India',
    location: 'Konark, Odisha',
    category: 'Heritage',
    season: 'Winter',
    difficulty: 'Easy',
    budget: '4000',
    currency: '₹',
    days: '2',
    transport: 'Road from Bhubaneswar',
    rating: '4.7',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200&q=80',
    description:
      'The Konark Sun Temple, a UNESCO World Heritage Site, is a 13th-century masterpiece built by King Narasimhadeva I of the Eastern Ganga dynasty. Conceived as a colossal chariot of the Sun God with 24 intricately carved stone wheels and 7 horses, it represents the pinnacle of Kalinga architecture.',
    highlights: 'Chariot wheels, Erotic sculptures, Chandrabhaga Beach, Puri Jagannath Temple (60 km), Konark Dance Festival (December)',
    tips: 'Combine with Puri and Bhubaneswar for the Golden Triangle of Odisha. The Konark Dance Festival (every December) features classical dance performances against the temple backdrop. Use an Archaeological Survey guide for full context.',
    lat: 19.8876,
    lng: 86.0945,
    status: 'Active',
    addedBy: 'admin',
  },

  // ─────────────────────────────────────────────
  // 33. Lonavala & Khandala
  // ─────────────────────────────────────────────
  {
    id: 'seed-033',
    name: 'Lonavala & Khandala',
    country: 'India',
    location: 'Lonavala, Maharashtra',
    category: 'Nature',
    season: 'Monsoon',
    difficulty: 'Easy',
    budget: '4000',
    currency: '₹',
    days: '2',
    transport: 'Road / Train from Mumbai or Pune',
    rating: '4.4',
    image: 'https://images.unsplash.com/photo-1591429939960-b7d5add10b5d?w=1200&q=80',
    description:
      "Lonavala and Khandala are twin hill stations in the Sahyadri Range of Maharashtra, set between Mumbai and Pune. During monsoon (June–September) the Western Ghats transform into a lush paradise with dozens of roaring waterfalls, emerald valleys, and dramatic viewpoints. Famous for chikki (nut brittle) and fudge.",
    highlights: "Tiger's Leap viewpoint, Bhushi Dam waterfall, Lohagad Fort, Rajmachi Fort, Bhaja Caves, Karla Caves",
    tips: 'Monsoon is the most spectacular time (waterfalls) but roads can be slippery. Bhushi Dam steps are crowded but fun — watch out for strong currents after heavy rain. Lohagad Fort trek is excellent in July–August.',
    lat: 18.7537,
    lng: 73.4068,
    status: 'Active',
    addedBy: 'admin',
  },
];

// Named alias so existing imports of INDIA_PLACES still work
export const INDIA_PLACES = INDIAN_DESTINATIONS;

export default INDIAN_DESTINATIONS;