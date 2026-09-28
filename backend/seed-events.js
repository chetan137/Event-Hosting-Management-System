const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const Event = require('./models/Event');
const EventRegistration = require('./models/EventRegistration');
const User = require('./models/User');

// Helper to calculate future/past dates relative to today
const createDate = (daysOffset, hours = 10, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

// Fixed Admin ID used across application bypasses
const DEFAULT_ADMIN_ID = new mongoose.Types.ObjectId('65a1234567890abcdef12345');

const DUMMY_EVENTS = [
  // ==========================================
  // 1. TECHNOLOGY (10 events)
  // ==========================================
  {
    eventName: 'AI & Machine Learning Summit 2026',
    description: 'Explore generative AI, large language models, deep learning, and neural network architectures with industry pioneers from OpenAI and Google. Hands-on coding and machine learning demonstrations.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(1, 9, 30), // Tomorrow
    endDateTime: createDate(1, 18, 0),
    registrationDeadline: createDate(1, 8, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Tech Park Auditorium, Cyber City, Bangalore',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 999,
    requireApproval: false,
    capacity: 250,
    statusOverride: null
  },
  {
    eventName: 'Fullstack Web Development Bootcamp',
    description: 'Intensive hands-on coding bootcamp covering modern React, Node.js, Next.js, and TypeScript. Build fullstack applications with live debugging and deployment workflows.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(0, 11, 0), // Today (Live test)
    endDateTime: createDate(0, 19, 0),
    registrationDeadline: createDate(0, 10, 0),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://meet.google.com/dev-bootcamp-live',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 150,
    statusOverride: null
  },
  {
    eventName: 'National Python Hackathon 2026',
    description: '48-hour competitive Python hackathon. Build scalable automation scripts, data science pipelines, AI agents, and web backends. Win exciting prizes and internship opportunities.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(5, 18, 0), // This Weekend
    endDateTime: createDate(7, 18, 0),
    registrationDeadline: createDate(4, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Innovation Hub, Sector 62, Noida',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 100,
    statusOverride: null
  },
  {
    eventName: 'Cloud Computing & DevOps Conference',
    description: 'Learn Kubernetes orchestration, AWS serverless architectures, Docker microservices, CI/CD pipelines, and cloud security from top cloud engineers.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(12, 10, 0),
    endDateTime: createDate(12, 17, 0),
    registrationDeadline: createDate(11, 20, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Convention Center, Hitech City, Hyderabad',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 499,
    requireApproval: false,
    capacity: 120,
    statusOverride: null
  },
  {
    eventName: 'Cybersecurity & Ethical Hacking Summit',
    description: 'Deep dive into penetration testing, network defense, threat intelligence, bug bounties, and zero-trust architecture. Live red team vs blue team simulations.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(18, 14, 0),
    endDateTime: createDate(18, 19, 0),
    registrationDeadline: createDate(17, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://zoom.us/j/cyber-defense-summit',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 299,
    requireApproval: false,
    capacity: 200,
    statusOverride: null
  },
  {
    eventName: 'Generative AI Masterclass: From Models to Apps',
    description: 'Build real-world production LLM apps using LangChain, RAG vector databases, prompt engineering, and multimodal vision APIs. Ideal for software engineers and data scientists.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(22, 11, 0),
    endDateTime: createDate(22, 16, 0),
    registrationDeadline: createDate(21, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://meet.google.com/genai-masterclass',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 199,
    requireApproval: false,
    capacity: 80,
    statusOverride: null
  },
  {
    eventName: 'Big Data & Modern Analytics Meetup',
    description: 'Explore Apache Spark, Snowflake, real-time streaming pipelines, and predictive algorithms. Practical case studies on petabyte-scale data engineering.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(28, 15, 0),
    endDateTime: createDate(28, 18, 30),
    registrationDeadline: createDate(27, 20, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'CoWork Central, Bandra Kurla Complex, Mumbai',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 60,
    statusOverride: null
  },
  {
    eventName: 'Robotics & Autonomous Systems Expo',
    description: 'Experience live autonomous drone demonstrations, humanoid robotics, computer vision obstacle detection, and ROS2 robot operating system workshops.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(35, 10, 0),
    endDateTime: createDate(36, 18, 0),
    registrationDeadline: createDate(34, 18, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Science City Exhibition Hall, Kolkata',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 350,
    requireApproval: false,
    capacity: 300,
    statusOverride: null
  },
  {
    eventName: 'Blockchain, Web3 & Smart Contracts Expo',
    description: 'Demystifying decentralized finance (DeFi), Ethereum Solidity smart contract development, zero-knowledge proofs, and Web3 decentralized infrastructure.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(42, 13, 0),
    endDateTime: createDate(42, 19, 0),
    registrationDeadline: createDate(41, 18, 0),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://zoom.us/j/web3-developer-summit',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 180,
    statusOverride: null
  },
  {
    eventName: 'Future of Software Engineering 2026',
    description: 'Keynotes on AI pair programming, quantum computing fundamentals, edge computing, distributed microservices, and architectural excellence in software design.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(-5, 10, 0), // Completed event test
    endDateTime: createDate(-5, 16, 0),
    registrationDeadline: createDate(-6, 20, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Grand Hyatt Convention Center, Pune',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 1299,
    requireApproval: false,
    capacity: 200,
    statusOverride: null
  },

  // ==========================================
  // 2. WORKSHOP (10 events)
  // ==========================================
  {
    eventName: 'UI/UX Design Masterclass & Sprint',
    description: 'Learn Figma design systems, wireframing, interactive prototyping, user research interviews, and usability testing. Create portfolio-ready UI/UX projects.',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(2, 10, 0),
    endDateTime: createDate(2, 16, 0),
    registrationDeadline: createDate(1, 22, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Design Studio 4B, Koramangala, Bangalore',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 499,
    requireApproval: false,
    capacity: 25,
    statusOverride: null
  },
  {
    eventName: 'Public Speaking & Confident Pitching Workshop',
    description: 'Master stage presence, body language, vocal modulation, storytelling techniques, and overcoming stage fright. Includes live impromptu speech practice with mentor feedback.',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(6, 11, 0),
    endDateTime: createDate(6, 15, 0),
    registrationDeadline: createDate(5, 18, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Toastmasters Hall, Connaught Place, New Delhi',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 35,
    statusOverride: null
  },
  {
    eventName: 'Hands-on Photography & Lighting Workshop',
    description: 'DSLR camera controls, manual exposure triangle, creative portrait lighting, framing composition, and street photography walk with professional mentors.',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(9, 8, 30),
    endDateTime: createDate(9, 13, 0),
    registrationDeadline: createDate(8, 20, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Cubbon Park Pavilion, Bangalore',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 799,
    requireApproval: false,
    capacity: 20,
    statusOverride: null
  },
  {
    eventName: 'Creative Writing & Story Crafting Workshop',
    description: 'Develop captivating story arcs, memorable characters, sensory dialogue, and world-building techniques. Practical prompt writing exercises and peer critiques.',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(14, 15, 0),
    endDateTime: createDate(14, 18, 0),
    registrationDeadline: createDate(13, 21, 0),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://zoom.us/j/writers-room-live',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 40,
    statusOverride: null
  },
  {
    eventName: 'Executive Resume Building & ATS Optimization',
    description: 'Craft ATS-compliant modern resumes, optimize LinkedIn profiles for recruiters, and practice STAR technique interview questions with hiring managers.',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(16, 17, 0),
    endDateTime: createDate(16, 20, 0),
    registrationDeadline: createDate(15, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://meet.google.com/resume-boost-lab',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 199,
    requireApproval: false,
    capacity: 50,
    statusOverride: null
  },
  {
    eventName: 'Leadership & Team Dynamics Workshop',
    description: 'Learn conflict resolution, empathetic communication, delegating effectively, and fostering high-performance agile collaborative cultures in tech and business.',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(21, 10, 0),
    endDateTime: createDate(21, 16, 0),
    registrationDeadline: createDate(20, 18, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Corporate Training Hall, BKC, Mumbai',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 1200,
    requireApproval: false,
    capacity: 30,
    statusOverride: null
  },
  {
    eventName: 'Digital Marketing & Growth Hacking Workshop',
    description: 'Actionable strategies in Google Ads, Meta Ads, SEO ranking, conversion rate optimization, email funnels, and viral TikTok/Reels organic growth marketing.',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(25, 14, 0),
    endDateTime: createDate(25, 18, 0),
    registrationDeadline: createDate(24, 20, 0),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://meet.google.com/growth-lab-workshop',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 399,
    requireApproval: false,
    capacity: 75,
    statusOverride: null
  },
  {
    eventName: 'Video Editing & Motion Graphics in Premiere & After Effects',
    description: 'Hands-on editing sprint: jump cuts, color grading, sound design, animated lower thirds, kinetic typography, and YouTube short video workflows.',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(30, 11, 0),
    endDateTime: createDate(30, 15, 30),
    registrationDeadline: createDate(29, 21, 0),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://zoom.us/j/video-editing-mastery',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 499,
    requireApproval: false,
    capacity: 45,
    statusOverride: null
  },
  {
    eventName: 'Entrepreneurship & Zero-to-One Startup Bootcamp',
    description: 'Validation testing, defining your Minimum Viable Product (MVP), unit economics, customer acquisition loops, and legal formation for first-time founders.',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(38, 9, 0),
    endDateTime: createDate(38, 17, 0),
    registrationDeadline: createDate(37, 18, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Venture Studio Incubator, Sector 29, Gurgaon',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 999,
    requireApproval: false,
    capacity: 25,
    statusOverride: null
  },
  {
    eventName: 'Personal Branding on LinkedIn & X Masterclass',
    description: 'Build an authoritative personal brand. Content strategy templates, viral hook writing, audience engagement frameworks, and monetization avenues.',
    category: 'Workshop',
    coverImage: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(45, 16, 0),
    endDateTime: createDate(45, 19, 0),
    registrationDeadline: createDate(44, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://meet.google.com/brand-mastery',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 100,
    statusOverride: null
  },

  // ==========================================
  // 3. BUSINESS (10 events)
  // ==========================================
  {
    eventName: 'Startup Pitch Fest: Seed & Series A Showcase',
    description: 'Top 15 curated startups pitch to leading angel syndicates and VC funds (Sequoia, Accel, Blume). Networking lunch with angel investors and founders.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(3, 13, 0),
    endDateTime: createDate(3, 19, 0),
    registrationDeadline: createDate(2, 20, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'The Leela Palace Ballroom, Old Airport Road, Bangalore',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 1499,
    requireApproval: false,
    capacity: 150,
    statusOverride: null
  },
  {
    eventName: 'Young Entrepreneurs & Founders Meetup',
    description: 'An informal evening mixer for early-stage founders, indie hackers, and creative operators. Share battle stories, growth hacks, and explore co-founder synergies.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(4, 18, 30),
    endDateTime: createDate(4, 21, 30),
    registrationDeadline: createDate(4, 16, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Third Wave Coffee Roasters, Indiranagar, Bangalore',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 40,
    statusOverride: null
  },
  {
    eventName: 'Business Networking Night: Leaders & Innovators',
    description: 'Connect with CXOs, enterprise directors, and ambitious founders. Structured speed-networking rounds and curated business relationship building.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(8, 19, 0),
    endDateTime: createDate(8, 22, 0),
    registrationDeadline: createDate(7, 21, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'St. Regis Rooftop Lounge, Lower Parel, Mumbai',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 1999,
    requireApproval: false,
    capacity: 80,
    statusOverride: null
  },
  {
    eventName: 'Investor Connect: Angel Investment Roundtable',
    description: 'Closed-door roundtable for accredited investors and seed-stage founders. Learn about deal syndication, portfolio diversification, and valuation mechanics.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(11, 15, 0),
    endDateTime: createDate(11, 18, 0),
    registrationDeadline: createDate(10, 18, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Golf Club Private Suite, Vasant Kunj, New Delhi',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 2499,
    requireApproval: true,
    capacity: 20,
    statusOverride: null
  },
  {
    eventName: 'Global Marketing Strategy Summit',
    description: 'Keynotes on omnichannel customer acquisition, brand storytelling, marketing ROI attribution, and navigating AI-driven performance advertising.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(17, 9, 30),
    endDateTime: createDate(17, 17, 30),
    registrationDeadline: createDate(16, 20, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'ITC Grand Chola Convention Center, Chennai',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 899,
    requireApproval: false,
    capacity: 200,
    statusOverride: null
  },
  {
    eventName: 'Personal Finance & Wealth Creation Seminar',
    description: 'Actionable financial planning: mutual funds asset allocation, equity stock market analysis, tax-saving instruments, and retirement wealth building.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(20, 11, 0),
    endDateTime: createDate(20, 14, 0),
    registrationDeadline: createDate(19, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://zoom.us/j/wealth-creation-seminar',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 300,
    statusOverride: null
  },
  {
    eventName: 'Women in Business Leadership Conference',
    description: 'Celebrating pioneering female leaders, venture builders, and executives. Panels on breaking corporate glass ceilings, fundraising, and mentorship.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(26, 10, 0),
    endDateTime: createDate(26, 16, 0),
    registrationDeadline: createDate(25, 20, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Taj Vivanta Banquet Hall, MG Road, Pune',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 499,
    requireApproval: false,
    capacity: 120,
    statusOverride: null
  },
  {
    eventName: 'E-Commerce & D2C Brands Growth Summit',
    description: 'Scaling direct-to-consumer (D2C) brands from 1 Cr to 100 Cr ARR. Supply chain optimization, customer lifetime value (LTV), Shopify apps, and quick commerce.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(32, 10, 30),
    endDateTime: createDate(32, 18, 0),
    registrationDeadline: createDate(31, 21, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Aerocity Convention Centre, New Delhi',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 799,
    requireApproval: false,
    capacity: 180,
    statusOverride: null
  },
  {
    eventName: 'SaaS Startup Founder Breakfast Meetup',
    description: 'Early morning coffee and round-table discussions on B2B SaaS pricing, outbound sales pipelines, churn reduction, and achieving product-market fit.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(37, 8, 30),
    endDateTime: createDate(37, 11, 0),
    registrationDeadline: createDate(36, 18, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Smoke House Deli, Lavelle Road, Bangalore',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 20,
    statusOverride: null
  },
  {
    eventName: 'Corporate Business Leadership Forum',
    description: 'High-level executive strategy forum discussing global economic trends, mergers & acquisitions, governance, and sustainability compliance.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(48, 9, 0),
    endDateTime: createDate(48, 17, 0),
    registrationDeadline: createDate(47, 18, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Trident Hotel Convention Center, Nariman Point, Mumbai',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 2999,
    requireApproval: true,
    capacity: 100,
    statusOverride: null
  },

  // ==========================================
  // 4. ENTERTAINMENT (10 events)
  // ==========================================
  {
    eventName: 'Acoustic & Indie Live Music Night',
    description: 'An enchanting evening of soulful acoustic melodies, indie pop bands, original songwriting, and candlelit ambiance with hot craft beverages.',
    category: 'Entertainment',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(1, 20, 0),
    endDateTime: createDate(1, 23, 0),
    registrationDeadline: createDate(1, 18, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'The Humming Tree Amphitheatre, Bangalore',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 499,
    requireApproval: false,
    capacity: 120,
    statusOverride: null
  },
  {
    eventName: 'Friday Night Stand-Up Comedy Showcase',
    description: 'Unfiltered laughter! 5 top touring stand-up comedians bring their freshest jokes, hilarious crowd work, and punchlines for an unforgettable night.',
    category: 'Entertainment',
    coverImage: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(5, 20, 30),
    endDateTime: createDate(5, 22, 30),
    registrationDeadline: createDate(5, 19, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'The Habitat Comedy Club, Khar West, Mumbai',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 399,
    requireApproval: false,
    capacity: 90,
    statusOverride: null
  },
  {
    eventName: 'Bollywood Retro Night & DJ Party',
    description: 'Dance all night to non-stop 90s and 2000s Bollywood blockbuster tracks, live dhol beats, neon glow bands, and themed photo booths.',
    category: 'Entertainment',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(7, 21, 0),
    endDateTime: createDate(8, 2, 0),
    registrationDeadline: createDate(7, 20, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Club Soho, Hauz Khas Village, New Delhi',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 699,
    requireApproval: false,
    capacity: 150,
    statusOverride: null
  },
  {
    eventName: 'Underground Indie Music Festival 2026',
    description: '2 stages, 12 independent indie rock, dream pop, and electronic acts from across India. Food trucks, local flea market, and craft brews.',
    category: 'Entertainment',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(13, 16, 0),
    endDateTime: createDate(13, 23, 30),
    registrationDeadline: createDate(12, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Jayamahal Palace Grounds, Bangalore',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 999,
    requireApproval: false,
    capacity: 400,
    statusOverride: null
  },
  {
    eventName: 'Annual College Cultural & Arts Fest',
    description: 'Inter-collegiate battle of the bands, fashion show, street play dramatics, fine arts exhibitions, and celebrity guest star performance.',
    category: 'Entertainment',
    coverImage: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(19, 11, 0),
    endDateTime: createDate(20, 22, 0),
    registrationDeadline: createDate(18, 18, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'University Stadium Grounds, Pune',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 500,
    statusOverride: null
  },
  {
    eventName: 'Poetry, Storytelling & Acoustic Open Mic',
    description: 'A cozy, welcoming stage for aspiring poets, storytellers, spoken word artists, and singer-songwriters. 5-minute performance slots open to all.',
    category: 'Entertainment',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(23, 17, 30),
    endDateTime: createDate(23, 20, 30),
    registrationDeadline: createDate(23, 15, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Chai Point Community Stage, Indiranagar, Bangalore',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 50,
    statusOverride: null
  },
  {
    eventName: 'All-India Hip-Hop & Street Dance Battle',
    description: '1v1 Breaking, Popping, and All-Styles dance competition judged by international champions. Live beatbox showcase and graffiti art gallery.',
    category: 'Entertainment',
    coverImage: 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(27, 14, 0),
    endDateTime: createDate(27, 21, 0),
    registrationDeadline: createDate(26, 18, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'YMCA Cultural Centre, Colaba, Mumbai',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 249,
    requireApproval: false,
    capacity: 180,
    statusOverride: null
  },
  {
    eventName: 'Rooftop Cinema & Starlit Movie Screening',
    description: 'Classic cinema under the open night sky. Wireless silent-disco headphones, gourmet butter popcorn, beanbag seating, and artisan mocktails.',
    category: 'Entertainment',
    coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(31, 19, 30),
    endDateTime: createDate(31, 22, 30),
    registrationDeadline: createDate(31, 17, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Skydeck Rooftop, VR Bengaluru, Whitefield',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 599,
    requireApproval: false,
    capacity: 60,
    statusOverride: null
  },
  {
    eventName: 'Electrifying Electronic DJ Night: Bass & Beats',
    description: 'Pumping progressive house, techno, and bass heavy EDM drops powered by state-of-the-art laser projection and surround sound systems.',
    category: 'Entertainment',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(39, 21, 0),
    endDateTime: createDate(40, 2, 0),
    registrationDeadline: createDate(39, 19, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Kitty Su Nightclub, Barakhamba Road, New Delhi',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 999,
    requireApproval: false,
    capacity: 250,
    statusOverride: null
  },
  {
    eventName: 'Classic Dramatic Theatre: The Merchant Odyssey',
    description: 'An acclaimed 3-act theatrical drama portraying ambition, betrayal, and redemption. Stellar live cast, period costumes, and original orchestral score.',
    category: 'Entertainment',
    coverImage: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(46, 18, 30),
    endDateTime: createDate(46, 21, 30),
    registrationDeadline: createDate(45, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Prithvi Theatre, Juhu, Mumbai',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 650,
    requireApproval: false,
    capacity: 100,
    statusOverride: null
  },

  // ==========================================
  // 5. MUSIC (8 events)
  // ==========================================
  {
    eventName: 'Symphony Orchestra: Classical Masterpieces',
    description: 'Fifty-piece symphony orchestra performing Beethoven, Mozart, and contemporary film scores with world-class violin soloists.',
    category: 'Music',
    coverImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(10, 19, 0),
    endDateTime: createDate(10, 21, 30),
    registrationDeadline: createDate(9, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'NCPA Opera House, Nariman Point, Mumbai',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 1200,
    requireApproval: false,
    capacity: 300,
    statusOverride: null
  },
  {
    eventName: 'Sunset Jazz & Soul Jam Session',
    description: 'Improvised saxophone, smooth basslines, and soulful vocalists at sunset. Bring friends for artisanal tapas and relaxing jazz rhythms.',
    category: 'Music',
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(15, 17, 30),
    endDateTime: createDate(15, 21, 0),
    registrationDeadline: createDate(15, 14, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Windmills Craftworks, Whitefield, Bangalore',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 750,
    requireApproval: false,
    capacity: 70,
    statusOverride: null
  },

  // ==========================================
  // 6. SPORTS & FITNESS (8 events)
  // ==========================================
  {
    eventName: 'Morning Yoga, Mindfulness & Breathwork',
    description: 'Sunrise Vinyasa flow, pranayama breathwork, sound bowl healing, and guided mindfulness meditation in peaceful lush green surroundings.',
    category: 'Sports & Fitness',
    coverImage: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(2, 6, 30),
    endDateTime: createDate(2, 8, 30),
    registrationDeadline: createDate(1, 21, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Lalbagh Botanical Gardens Pavilion, Bangalore',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 60,
    statusOverride: null
  },
  {
    eventName: 'City Marathon: 10K & Half-Marathon Run',
    description: 'Certified timing chips, hydration stations, finisher medals, and energized route entertainment. Run for fitness and charity causes.',
    category: 'Sports & Fitness',
    coverImage: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(14, 5, 30),
    endDateTime: createDate(14, 10, 0),
    registrationDeadline: createDate(12, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Marine Drive Promenade, Mumbai',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 499,
    requireApproval: false,
    capacity: 800,
    statusOverride: null
  },

  // ==========================================
  // 7. NETWORKING (8 events)
  // ==========================================
  {
    eventName: 'Tech & Product Professionals Mixer',
    description: 'Connect with senior software engineers, engineering managers, product leads, and tech recruiters over craft beverages and appetizers.',
    category: 'Networking',
    coverImage: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(4, 19, 0),
    endDateTime: createDate(4, 22, 0),
    registrationDeadline: createDate(4, 17, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'WeWork Galaxy Lounge, Residency Road, Bangalore',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 299,
    requireApproval: false,
    capacity: 75,
    statusOverride: null
  },

  // ==========================================
  // 8. DESIGN (8 events)
  // ==========================================
  {
    eventName: 'Design Systems & Figma Component Mastery',
    description: 'Build enterprise-grade token systems, variables, auto-layout variants, accessible color palettes, and responsive web component libraries in Figma.',
    category: 'Design',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(8, 14, 0),
    endDateTime: createDate(8, 18, 0),
    registrationDeadline: createDate(7, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://meet.google.com/figma-mastery-sprint',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 399,
    requireApproval: false,
    capacity: 50,
    statusOverride: null
  },

  // ==========================================
  // 9. GAMING (8 events)
  // ==========================================
  {
    eventName: 'Valorant & Counter-Strike Esports LAN Championship',
    description: '16 top collegiate teams battle it out on high-refresh 240Hz rigs. Live commentary shoutcasting, merchandise giveaways, and grand prize pool.',
    category: 'Gaming',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(6, 11, 0),
    endDateTime: createDate(7, 20, 0),
    registrationDeadline: createDate(5, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Arena Esports Cafe, Sector 18, Noida',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 249,
    requireApproval: false,
    capacity: 120,
    statusOverride: null
  },

  // ==========================================
  // 10. EDUCATION (8 events)
  // ==========================================
  {
    eventName: 'Higher Studies & Overseas Scholarship Symposium',
    description: 'Guidance on Ivy League and European university applications, GRE/IELTS prep, winning full-ride scholarship essays, and visa interview strategies.',
    category: 'Education',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(12, 11, 0),
    endDateTime: createDate(12, 15, 0),
    registrationDeadline: createDate(11, 20, 0),
    timeZone: 'GMT+05:30',
    locationType: 'online',
    locationValue: 'https://zoom.us/j/global-scholars-symposium',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 250,
    statusOverride: null
  }
];

// Special Test Events specifically designated to test "Sold Out" state
const SOLD_OUT_EVENTS = [
  {
    eventName: 'Exclusive VIP Tech Dinner & Founder Circle',
    description: 'An intimate VIP gathering for venture-backed founders and unicorn tech leaders. High-caliber strategic discussions and closed-door insights.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
    calendarType: 'personal',
    visibility: 'public',
    startDateTime: createDate(3, 19, 0),
    endDateTime: createDate(3, 22, 0),
    registrationDeadline: createDate(2, 23, 59),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Private Dining Suite, Four Seasons Hotel, Bangalore',
    theme: 'minimal',
    ticketType: 'paid',
    ticketPrice: 3499,
    requireApproval: true,
    capacity: 2, // Low capacity to fill for testing Sold Out filter
    makeSoldOut: true
  },
  {
    eventName: 'Hands-on VR & AR Metaverse Developer Lab',
    description: 'Learn Unity and Unreal Engine spatial computing for Vision Pro and Meta Quest 3. Hands-on coding and immersive scene testing.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?auto=format&fit=crop&w=800&q=80',
    calendarType: 'team',
    visibility: 'public',
    startDateTime: createDate(6, 14, 0),
    endDateTime: createDate(6, 18, 0),
    registrationDeadline: createDate(5, 20, 0),
    timeZone: 'GMT+05:30',
    locationType: 'offline',
    locationValue: 'Virtual Reality Lab, Cyber Hub, Gurgaon',
    theme: 'minimal',
    ticketType: 'free',
    ticketPrice: 0,
    requireApproval: false,
    capacity: 1, // Sold out test event
    makeSoldOut: true
  }
];

async function seedDatabase() {
  console.log('====================================================');
  console.log('🌱 EventSync Comprehensive Events Seeder');
  console.log('====================================================');

  if (!process.env.MONGO_URI) {
    console.error('\n❌ ERROR: MONGO_URI is missing in your environment configuration!');
    console.error('👉 Please configure MONGO_URI in your backend/.env file.');
    process.exit(1);
  }

  // Check if URI is still the placeholder example
  if (process.env.MONGO_URI.includes('cluster0.mongodb.net') || process.env.MONGO_URI.includes('<username>')) {
    console.error('\n❌ ERROR: MONGO_URI in backend/.env is currently using the placeholder string:');
    console.error(`   ${process.env.MONGO_URI}`);
    console.error('\n👉 What is missing:');
    console.error('   Please replace this placeholder with your actual MongoDB Atlas connection string');
    console.error('   or your local MongoDB instance (e.g. mongodb://127.0.0.1:27017/event_management).\n');
    process.exit(1);
  }

  try {
    console.log('📡 Connecting to MongoDB...');
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB successfully!\n');

    // Create or find a dummy seed user to populate registrations for sold-out testing
    let dummyUser = await User.findOne({ email: 'seed.tester@eventsync.dev' });
    if (!dummyUser) {
      dummyUser = await User.create({
        fullName: 'Seed Tester User',
        email: 'seed.tester@eventsync.dev',
        password: 'password123',
        role: 'user'
      });
    }

    const allEventsToSeed = [...DUMMY_EVENTS, ...SOLD_OUT_EVENTS];
    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of allEventsToSeed) {
      const { makeSoldOut, ...eventPayload } = item;
      
      const existing = await Event.findOne({ eventName: eventPayload.eventName });

      let savedEvent;
      if (!existing) {
        savedEvent = await Event.create({
          ...eventPayload,
          createdBy: DEFAULT_ADMIN_ID
        });
        insertedCount++;
      } else {
        // Update existing to ensure consistent category, pricing, and dates
        Object.assign(existing, eventPayload);
        savedEvent = await existing.save();
        updatedCount++;
      }

      // If designated as Sold Out, ensure registrations match capacity
      if (makeSoldOut && savedEvent.capacity) {
        const currentRegs = await EventRegistration.countDocuments({ event: savedEvent._id });
        for (let i = currentRegs; i < savedEvent.capacity; i++) {
          await EventRegistration.create({
            event: savedEvent._id,
            user: dummyUser._id,
            status: 'approved',
            paymentStatus: 'not_required'
          });
        }
      }
    }

    console.log('----------------------------------------------------');
    console.log(`✨ Seeding Complete!`);
    console.log(`📥 Newly inserted events: ${insertedCount}`);
    console.log(`🔄 Updated existing events: ${updatedCount}`);
    console.log(`📊 Total events in catalogue: ${await Event.countDocuments({ visibility: 'public' })}`);
    console.log('----------------------------------------------------');

    // Print breakdown per category
    const categoriesCount = await Event.aggregate([
      { $match: { visibility: 'public' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('📚 Category Breakdown:');
    categoriesCount.forEach(c => {
      console.log(`   • ${c._id || 'Unassigned'}: ${c.count} events`);
    });

    console.log('\n🚀 All events are now ready for testing on http://localhost:5173/events!');
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Seeding failed with error:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

seedDatabase();
