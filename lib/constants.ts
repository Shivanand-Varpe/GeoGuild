export interface City {
  name: string;
  slug: string;
  state: string;
  latitude: number;
  longitude: number;
}

export const INDIAN_CITIES: City[] = [
  { name: 'Bengaluru', slug: 'bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777 },
  { name: 'Delhi NCR', slug: 'delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { name: 'Hyderabad', slug: 'hyderabad', state: 'Telangana', latitude: 17.3850, longitude: 78.4867 },
  { name: 'Pune', slug: 'pune', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567 },
  { name: 'Chennai', slug: 'chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { name: 'Kolkata', slug: 'kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { name: 'Ahmedabad', slug: 'ahmedabad', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714 },
  { name: 'Jaipur', slug: 'jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873 },
  { name: 'Kochi', slug: 'kochi', state: 'Kerala', latitude: 9.9312, longitude: 76.2673 },
];

export const CATEGORIES = [
  { id: 'tech', name: 'Tech & AI', icon: 'Cpu' },
  { id: 'hackathon', name: 'Hackathons', icon: 'Code' },
  { id: 'music', name: 'Music & Concerts', icon: 'Music' },
  { id: 'networking', name: 'Networking & Meetups', icon: 'Users' },
  { id: 'workshops', name: 'Workshops & Learning', icon: 'BookOpen' },
  { id: 'sports', name: 'Fitness & Sports', icon: 'Trophy' },
  { id: 'arts', name: 'Arts & Culture', icon: 'Palette' },
  { id: 'food', name: 'Food & Nightlife', icon: 'Utensils' },
] as const;

export const DEFAULT_CITY = INDIAN_CITIES[0]; // Bengaluru

export interface EventItem {
  id: string;
  title: string;
  description: string;
  event_type?: string;
  category: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  start_time: string;
  end_time?: string;
  image_url: string;
  is_free: boolean;
  price?: number;
  rsvp_count: number;
  max_capacity?: number;
  organizer?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  tags?: string[];
  status?: string;
  google_maps_url?: string;
}

export const SAMPLE_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    title: 'Vecnaverse Web3 & AI Hackathon 2026',
    description: 'A 24-hour non-stop hackathon bringing together the best minds in AI, agents, and decentralized applications. Join over 300 builders, mentors, and VC judges.',
    category: 'Hackathons',
    city: 'Bengaluru',
    address: 'Koramangala Indoor Stadium, 80 Feet Rd, 6th Block, Koramangala',
    latitude: 12.9352,
    longitude: 77.6245,
    start_time: '2026-10-24T10:00:00.000Z',
    end_time: '2026-10-25T10:00:00.000Z',
    image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    is_free: true,
    price: 0,
    rsvp_count: 184,
    max_capacity: 250,
    organizer: {
      id: 'org-1',
      name: 'Vecnaverse Foundation',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Vecnaverse',
    },
    tags: ['AI', 'Hackathon', 'Web3', 'Next.js'],
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=12.9352,77.6245',
  },
  {
    id: 'evt-2',
    title: 'Bengaluru Founders & Builders Coffee Mixer',
    description: 'Casual Sunday morning coffee meetup for startup founders, indie hackers, and engineers. Share demos, talk product-market fit, and meet co-founders.',
    category: 'Networking & Meetups',
    city: 'Bengaluru',
    address: 'Third Wave Coffee, Indiranagar 100ft Road',
    latitude: 12.9784,
    longitude: 77.6408,
    start_time: '2026-10-26T16:00:00.000Z',
    image_url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    is_free: false,
    price: 350,
    rsvp_count: 52,
    max_capacity: 60,
    organizer: {
      id: 'org-2',
      name: 'Namma Tech Collective',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NammaTech',
    },
    tags: ['Startups', 'Coffee', 'Networking'],
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=12.9784,77.6408',
  },
  {
    id: 'evt-3',
    title: 'Indie Indie Acoustic Night: Live at Church Street',
    description: 'An intimate evening of indie folk and acoustic performances featuring local grassroots songwriters and live spoken word poetry.',
    category: 'Music & Concerts',
    city: 'Bengaluru',
    address: 'Church Street Social, Cobalt Building, Bengaluru',
    latitude: 12.9752,
    longitude: 77.6033,
    start_time: '2026-10-27T19:30:00.000Z',
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    is_free: false,
    price: 499,
    rsvp_count: 88,
    max_capacity: 120,
    organizer: {
      id: 'org-3',
      name: 'Underground Sound',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Underground',
    },
    tags: ['LiveMusic', 'Indie', 'Acoustic'],
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=12.9752,77.6033',
  },
  {
    id: 'evt-4',
    title: 'Mumbai GenAI Dev Summit 2026',
    description: 'Deep dive into LLM agents, local models with Ollama, MCP servers, and production RAG architecture. Talks by leading ML architects.',
    category: 'Tech & AI',
    city: 'Mumbai',
    address: 'Bandra-Kurla Complex (BKC) Convention Hall, Mumbai',
    latitude: 19.0657,
    longitude: 72.8687,
    start_time: '2026-10-28T09:30:00.000Z',
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    is_free: true,
    price: 0,
    rsvp_count: 245,
    max_capacity: 300,
    organizer: {
      id: 'org-4',
      name: 'Mumbai Dev Circle',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=MumbaiDev',
    },
    tags: ['AI', 'LLMs', 'Agents', 'Python'],
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=19.0657,72.8687',
  },
  {
    id: 'evt-5',
    title: 'Cubbon Park Morning 5K Community Run',
    description: 'Weekend fitness jog through the scenic greenery of Cubbon Park. Open for all paces, from brisk walkers to marathon runners. Post-run electrolytes provided!',
    category: 'Fitness & Sports',
    city: 'Bengaluru',
    address: 'Cubbon Park Main Bandstand, MG Road Entry, Bengaluru',
    latitude: 12.9763,
    longitude: 77.5929,
    start_time: '2026-10-25T06:30:00.000Z',
    image_url: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
    is_free: true,
    price: 0,
    rsvp_count: 67,
    max_capacity: 100,
    organizer: {
      id: 'org-5',
      name: 'Cubbon Runners Club',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CubbonRun',
    },
    tags: ['Fitness', 'Running', 'Health'],
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=12.9763,77.5929',
  },
  {
    id: 'evt-6',
    title: 'Hyderabad Pottery & Ceramic Crafting Workshop',
    description: 'Hands-on beginner workshop on pottery wheels. Shape your own ceramic bowls, mugs, and vases guided by master artisans from Jubilee Hills.',
    category: 'Workshops & Learning',
    city: 'Hyderabad',
    address: 'Artistic Clay Studio, Road No. 36, Jubilee Hills, Hyderabad',
    latitude: 17.4319,
    longitude: 78.4073,
    start_time: '2026-10-29T14:00:00.000Z',
    image_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    is_free: false,
    price: 850,
    rsvp_count: 29,
    max_capacity: 35,
    organizer: {
      id: 'org-6',
      name: 'Crafts Hyderabad',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CraftsHyd',
    },
    tags: ['Pottery', 'Art', 'Workshop'],
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=17.4319,78.4073',
  },
  {
    id: 'evt-7',
    title: 'Delhi NCR AI & Robotics Builders Expo 2026',
    description: 'Explore live autonomous drone demos, embodied AI robotics setups, and edge ML computing exhibits from leading hardware labs.',
    category: 'Tech & AI',
    city: 'Delhi NCR',
    address: 'Bharat Mandapam, Pragati Maidan, New Delhi',
    latitude: 28.6186,
    longitude: 77.2425,
    start_time: '2026-10-30T10:00:00.000Z',
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    is_free: true,
    price: 0,
    rsvp_count: 312,
    max_capacity: 450,
    organizer: {
      id: 'org-7',
      name: 'Delhi AI Guild',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=DelhiAI',
    },
    tags: ['Robotics', 'AI', 'Hardware', 'Demos'],
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=28.6186,77.2425',
  },
  {
    id: 'evt-8',
    title: 'Pune Open Source & Cloud Camp',
    description: 'A community unconference on Kubernetes, Rust CLI development, and developer productivity tooling. Morning workshops followed by lightning talks.',
    category: 'Workshops & Learning',
    city: 'Pune',
    address: 'Viman Nagar Cultural Center, Symbiosis Road, Pune',
    latitude: 18.5679,
    longitude: 73.9143,
    start_time: '2026-10-31T09:00:00.000Z',
    image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    is_free: true,
    price: 0,
    rsvp_count: 95,
    max_capacity: 120,
    organizer: {
      id: 'org-8',
      name: 'Pune OSS Circle',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PuneOSS',
    },
    tags: ['OpenSource', 'Cloud', 'Rust', 'DevOps'],
    google_maps_url: 'https://www.google.com/maps/search/?api=1&query=18.5679,73.9143',
  },
];
