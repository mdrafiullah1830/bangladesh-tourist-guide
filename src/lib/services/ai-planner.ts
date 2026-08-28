import { prisma } from "@/lib/prisma";
import type { TripInput, TripPlan, DayPlan, TransportOption, HotelRecommendation } from "@/lib/types";

// ============ AI TRIP PLANNING ENGINE ============
// Uses a sophisticated rule-based engine that can be enhanced with LLM APIs

export async function generateTripPlan(
  tripInput: TripInput,
  profile?: { interests?: string[]; travelStyle?: string; country?: string }
): Promise<TripPlan> {
  const { startDate, endDate, totalBudget, currency = "BDT", travellers = 1, interests = [], travelStyle } = tripInput;
  
  const days = startDate && endDate 
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 
    : 5;
  
  const dailyBudget = totalBudget ? totalBudget / days : 3000;
  
  // Generate day-by-day plan
  const dayPlans: DayPlan[] = [];
  let runningCost = 0;

  for (let i = 1; i <= days; i++) {
    const dayPlan = generateDayPlan(i, dailyBudget, interests, travelStyle, travellers, days, startDate);
    dayPlans.push(dayPlan);
    runningCost += dayPlan.activities.reduce((sum, a) => sum + (a.cost || 0), 0);
  }

  // Generate transport options from arrival
  const transportOptions = generateTransportOptions(tripInput);
  
  // Get hotel suggestions
  const hotelSuggestions = await getHotelSuggestions(tripInput, dailyBudget);

  return {
    title: tripInput.title || `${days}-Day Bangladesh Adventure`,
    description: `A ${days}-day journey through Bangladesh tailored for ${travelStyle || "explorers"} interested in ${interests.join(", ") || "culture, nature, and food"}.`,
    days: dayPlans,
    totalEstimatedCost: runningCost * travellers,
    budgetRemaining: totalBudget ? totalBudget - (runningCost * travellers) : 0,
    currency,
    transportOptions,
    hotelSuggestions,
    foodSuggestions: generateFoodSuggestions(interests),
    safetyTips: generateSafetyTips(profile?.country),
    dataStatus: "ESTIMATED",
    generatedAt: new Date(),
  };
}

function generateDayPlan(
  dayNum: number,
  dailyBudget: number,
  interests: string[],
  travelStyle: string | undefined,
  travellers: number,
  totalDays: number,
  startDate?: Date
): DayPlan {
  const activities: DayPlan["activities"] = [];
  let cost = 0;

  // Morning activity
  const morningActivities = getActivitiesForInterests(interests, "morning");
  const morning = morningActivities[dayNum % morningActivities.length];
  activities.push({
    id: `day${dayNum}-morning`,
    title: morning.title,
    description: morning.description,
    type: morning.type,
    startTime: "09:00",
    endTime: "12:00",
    cost: morning.cost,
    location: morning.location,
    order: 1,
  });
  cost += morning.cost;

  // Lunch
  const lunchOptions = [
    { title: "Local Bengali Thali", desc: "Rice, dal, fish curry, vegetables", cost: 200 },
    { title: "Street Food Lunch", desc: "Fuchka, chotpoti, jhalmuri", cost: 100 },
    { title: "Restaurant Lunch", desc: "Biryani or kebab set", cost: 350 },
  ];
  const lunch = lunchOptions[dayNum % lunchOptions.length];
  activities.push({
    id: `day${dayNum}-lunch`,
    title: lunch.title,
    description: lunch.desc,
    type: "food",
    startTime: "12:30",
    endTime: "13:30",
    cost: lunch.cost,
    order: 2,
  });
  cost += lunch.cost;

  // Afternoon activity
  const afternoonActivities = getActivitiesForInterests(interests, "afternoon");
  const afternoon = afternoonActivities[dayNum % afternoonActivities.length];
  activities.push({
    id: `day${dayNum}-afternoon`,
    title: afternoon.title,
    description: afternoon.description,
    type: afternoon.type,
    startTime: "14:30",
    endTime: "17:00",
    cost: afternoon.cost,
    location: afternoon.location,
    order: 3,
  });
  cost += afternoon.cost;

  // Dinner
  const dinnerOptions = [
    { title: "Local Restaurant Dinner", desc: "Fresh river fish, bhuna khichuri", cost: 400 },
    { title: "Traditional Bengali Dinner", desc: "Hilsha fish, prawn curry, panta bhat", cost: 500 },
    { title: "Rooftop Dining", desc: "BBQ and continental with city views", cost: 600 },
  ];
  const dinner = dinnerOptions[dayNum % dinnerOptions.length];
  activities.push({
    id: `day${dayNum}-dinner`,
    title: dinner.title,
    description: dinner.desc,
    type: "food",
    startTime: "19:00",
    endTime: "20:30",
    cost: dinner.cost,
    order: 4,
  });
  cost += dinner.cost;

  return {
    dayNumber: dayNum,
    date: startDate ? new Date(startDate.getTime() + (dayNum - 1) * 86400000) : undefined,
    location: "Dhaka",
    activities,
    notes: dayNum === 1 ? "Arrival day - take it easy" : dayNum === totalDays ? "Departure day" : "Full exploration day",
  };
}

function getActivitiesForInterests(interests: string[], timeOfDay: string) {
  const activities = [
    { title: "Heritage Walk", description: "Explore historical sites and monuments", type: "attraction" as const, cost: 150, location: "Old Dhaka" },
    { title: "Boat Ride", description: "River cruise through the city", type: "attraction" as const, cost: 300, location: "Buriganga River" },
    { title: "Market Exploration", description: "Visit local bazaars and artisan shops", type: "attraction" as const, cost: 100, location: "Sadarghat" },
    { title: "Museum Visit", description: "Discover Bangladesh's rich history", type: "attraction" as const, cost: 50, location: "Bangladesh National Museum" },
    { title: "Park & Garden", description: "Relax in beautiful botanical gardens", type: "attraction" as const, cost: 30, location: "Baldha Garden" },
    { title: "Food Tour", description: "Guided culinary exploration", type: "food" as const, cost: 800, location: "Old Dhaka" },
    { title: "Art & Culture", description: "Visit galleries and cultural centers", type: "attraction" as const, cost: 100, location: "Shilpakala Academy" },
    { title: "Religious Heritage", description: "Visit temples, mosques, and churches", type: "attraction" as const, cost: 0, location: "Star Mosque" },
  ];

  // Filter/reorder based on interests
  if (interests.includes("food")) {
    activities.sort((a, b) => a.type === "food" ? -1 : 1);
  }
  if (interests.includes("nature")) {
    activities.unshift(
      { title: "Nature Walk", description: "Explore lush green spaces", type: "attraction" as const, cost: 0, location: "Ramna Park" },
      { title: "Lake Visit", description: "Serene lake with bird watching", type: "attraction" as const, cost: 50, location: "Crescent Lake" }
    );
  }

  return activities;
}

function generateTransportOptions(tripInput: TripInput): TransportOption[] {
  const airport = tripInput.arrivalAirport || "Hazrat Shahjalal International Airport (DAC)";
  
  return [
    {
      id: "t1",
      mode: "car",
      operator: "Airport Taxi Service",
      from: airport,
      to: "Dhaka City Center",
      departurePoint: "Airport Arrival Terminal",
      arrivalPoint: "Hotel",
      duration: "45-90 mins",
      durationMinutes: 60,
      distanceKm: 25,
      fare: { min: 800, max: 1200 },
      comfort: "standard",
      schedule: "24/7",
      recommendation: "recommended",
      dataStatus: "ESTIMATED",
      lastUpdated: new Date(),
    },
    {
      id: "t2",
      mode: "bus",
      operator: "Airport Bus Service",
      from: airport,
      to: "Dhaka City Center",
      departurePoint: "Airport Bus Stand",
      arrivalPoint: "Motijheel/Gulistan",
      duration: "60-120 mins",
      durationMinutes: 90,
      distanceKm: 25,
      fare: { min: 50, max: 100 },
      comfort: "budget",
      schedule: "Every 30 mins, 6AM-10PM",
      recommendation: "cheapest",
      dataStatus: "ESTIMATED",
      lastUpdated: new Date(),
    },
    {
      id: "t3",
      mode: "rickshaw",
      operator: "Local Rickshaw",
      from: airport,
      to: "Nearby Areas Only",
      departurePoint: "Airport Exit",
      arrivalPoint: "Motijheel Area",
      duration: "90-150 mins",
      durationMinutes: 120,
      distanceKm: 25,
      fare: { min: 300, max: 500 },
      comfort: "budget",
      schedule: "Available on request",
      dataStatus: "ESTIMATED",
      lastUpdated: new Date(),
    },
  ];
}

async function getHotelSuggestions(tripInput: TripInput, dailyBudget: number): Promise<HotelRecommendation[]> {
  const budgetHotel = dailyBudget < 2000;
  
  return [
    {
      id: "h1",
      name: budgetHotel ? "Hotel Paradise (3★)" : "Pan Pacific Sonargaon (5★)",
      description: budgetHotel ? "Comfortable budget hotel in city center" : "Luxury hotel with river views",
      address: "Dhaka City Center",
      starRating: budgetHotel ? 3 : 5,
      priceRange: budgetHotel ? { min: 1500, max: 3000 } : { min: 8000, max: 15000 },
      amenities: budgetHotel ? ["WiFi", "AC", "Breakfast"] : ["WiFi", "AC", "Pool", "Spa", "Restaurant", "Gym"],
      rating: budgetHotel ? 3.8 : 4.5,
      dataStatus: "ESTIMATED",
    },
    {
      id: "h2",
      name: budgetHotel ? "Hotel Sadria (2★)" : "Hotel Sarina (4★)",
      description: budgetHotel ? "Clean and affordable stay" : "Boutique hotel with modern amenities",
      address: "Dhaka",
      starRating: budgetHotel ? 2 : 4,
      priceRange: budgetHotel ? { min: 800, max: 1500 } : { min: 4000, max: 8000 },
      amenities: budgetHotel ? ["WiFi", "Fan"] : ["WiFi", "AC", "Restaurant", "Room Service"],
      rating: budgetHotel ? 3.5 : 4.2,
      dataStatus: "ESTIMATED",
    },
  ];
}

function generateFoodSuggestions(interests: string[]): string[] {
  const suggestions = [
    "Must try: Biryani from Dhaka's famous Nanna Biryani or Star Kabab",
    "Street food: Fuchka, Chotpoti, and Jhalmuri from Old Dhaka",
    "Traditional: Panta-Ilish (fermented rice with fried Hilsha) during Pohela Boishakh",
    "Sweets: Roshogolla, Sandesh, and Mishtimukna from Sweetmeat shops",
    "Tea: Seven-layer tea from Srimangal or any local tea stall",
    "Seafood: Fresh crab and pomfret from Chattogram",
    "Breakfast: Paratha with curry from any local hotel",
  ];
  
  if (interests.includes("food")) {
    suggestions.unshift("Food tour: Take a guided food walk through Old Dhaka's 300-year-old food lanes");
  }
  
  return suggestions;
}

function generateSafetyTips(touristCountry?: string): string[] {
  const tips = [
    "Keep copies of passport and important documents",
    "Use registered ride-sharing apps (Uber, Pathao) for transport",
    "Drink bottled water and be cautious with street food",
    "Respect local customs - dress modestly at religious sites",
    "Emergency number: 999 (Police, Fire, Ambulance)",
    "Keep your hotel's business card for directions",
    "Avoid traveling alone at night in unfamiliar areas",
    "Use hotel safes for valuables",
  ];
  
  if (touristCountry && touristCountry !== "Bangladesh") {
    tips.unshift("Register with your embassy upon arrival in Bangladesh");
  }
  
  return tips;
}

// ============ AI CHAT ASSISTANT ============

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  actions?: { label: string; action: string }[];
  dataStatus: "LIVE" | "ESTIMATED" | "VERIFIED" | "LAST_UPDATED";
}

export async function processChatMessage(
  message: string,
  context?: { currentPage?: string; currentDestination?: string; userPreferences?: Record<string, unknown> }
): Promise<ChatResponse> {
  const lowerMsg = message.toLowerCase();

  // Transport queries
  if (lowerMsg.includes("airport") && (lowerMsg.includes("dhaka") || lowerMsg.includes("landed"))) {
    return {
      message: `Welcome to Bangladesh! 🇧🇩\n\n**Hazrat Shahjalal International Airport (DAC)** is your gateway. Here's what to do next:\n\n1. **Immigration** - Have your passport and visa ready\n2. **SIM Card** - Get a local SIM from Grameenphone/Robi counters (~$3)\n3. **Transport to city**:\n   - Taxi: ৳800-1200 (45-90 mins)\n   - Bus: ৳50-100 (60-120 mins)\n4. **Currency** - Exchange at airport or use ATMs (BDT = Bangladeshi Taka)\n\n💡 **Tip:** Download offline maps and the Pathao app for local transport.\n\n📊 *Data status: ESTIMATED - Verify current rates locally*`,
      suggestions: ["How to get to my hotel?", "Where to exchange currency?", "I need a SIM card"],
      actions: [{ label: "Plan Airport Transfer", action: "navigate:transport" }],
      dataStatus: "ESTIMATED",
    };
  }

  // Budget queries
  if (lowerMsg.includes("budget") || lowerMsg.includes("5000") || lowerMsg.includes("$500")) {
    return {
      message: `Great question about budget planning! Here's a breakdown for Bangladesh:\n\n**💰 Budget Tiers (per person/day):**\n- **Budget Traveler**: ৳1,500-2,500 ($14-23)\n  - Hostels, street food, public transport\n- **Mid-Range**: ৳3,000-5,000 ($28-46)\n  - 3★ hotels, restaurants, AC transport\n- **Comfort**: ৳6,000-10,000 ($55-92)\n  - 4-5★ hotels, private transport, guided tours\n\n**📊 $500 for 7 days = ~৳54,000**\nThis is a **comfortable mid-range budget**! You can:\n- Stay in nice 3★ hotels (৳2,000-3,000/night)\n- Eat at good restaurants daily\n- Take AC bus/train between cities\n- Visit multiple destinations\n\n📊 *Data status: ESTIMATED - Prices vary by season*`,
      suggestions: ["Plan a 7-day trip with $500", "Cheapest transport options", "Budget hotels in Dhaka"],
      actions: [{ label: "Create Budget Plan", action: "navigate:budget" }],
      dataStatus: "ESTIMATED",
    };
  }

  // Transport between cities
  if ((lowerMsg.includes("dhaka") && lowerMsg.includes("chattogram")) || 
      (lowerMsg.includes("dhaka") && lowerMsg.includes("cox")) ||
      (lowerMsg.includes("travel to") && lowerMsg.includes("tomorrow"))) {
    return {
      message: `Here are transport options from **Dhaka to Chattogram**:\n\n**🚌 Bus (Most Popular)**\n- Operators: Green Line, Shohag, Ena, S Alam\n- Fare: ৳600-1,500 (AC/NAC)\n- Duration: 5-7 hours\n- Departure: Sayedabad, Mohakhali\n\n**🚂 Train (Scenic)**\n- Subarna Express, Turna Express, Mail Express\n- Fare: ৳300-1,200 (AC Chair/Shoeon)\n- Duration: 6-8 hours\n- Departure: Kamalapur Railway Station\n\n**✈️ Flight (Fastest)**\n- US-Bangla, Biman, Regent Airways\n- Fare: ৳3,500-6,000\n- Duration: 45 mins\n\n**🏆 Recommended:** Green Line AC Bus (comfortable, reliable)\n\n📊 *Data status: ESTIMATED - Book at 12Go.asia or directly*`,
      suggestions: ["Book transport", "Hotels in Chattogram", "What to do in Chattogram?"],
      actions: [{ label: "View Transport Planner", action: "navigate:transport" }],
      dataStatus: "ESTIMATED",
    };
  }

  // Food queries
  if (lowerMsg.includes("food") || lowerMsg.includes("eat") || lowerMsg.includes("cuisine")) {
    return {
      message: `Bangladesh has an incredible food culture! 🍛\n\n**Must-Try Dishes:**\n1. **Biryani** - Dhaka's layered rice and meat masterpiece\n2. **Hilsha Fish** - National fish, best fried or in curry\n3. **Fuchka** - Crispy shells with tangy tamarind water\n4. **Panta Bhat** - Fermented rice, traditional breakfast\n5. **Tea** - Bangladesh is a top tea producer!\n\n**Food Experiences:**\n- 🍽️ Old Dhaka food walk (300-year-old recipes)\n- 🍵 Srimangal tea garden tasting\n- 🦀 Chattogram seafood feast\n- 🍯 Sweet shops for Roshogolla & Sandesh\n\n**Budget:** Street food ৳50-150, Restaurants ৳300-800\n\n📊 *Data status: VERIFIED - Based on local knowledge*`,
      suggestions: ["Best restaurants in Dhaka", "Street food guide", "Vegetarian options"],
      actions: [{ label: "Food Discovery", action: "navigate:food" }],
      dataStatus: "VERIFIED",
    };
  }

  // Safety queries
  if (lowerMsg.includes("safe") || lowerMsg.includes("emergency") || lowerMsg.includes("sos")) {
    return {
      message: `**Safety Information for Bangladesh:**\n\n**🆘 Emergency Numbers:**\n- Police/Fire/Ambulance: **999**\n- Tourist Police: **+880 2 8901555**\n- Fire Service: **199**\n\n**⚠️ General Safety:**\n- Generally safe for tourists\n- Avoid political demonstrations\n- Use registered transport (Uber/Pathao)\n- Keep valuables secure\n\n**👩 Solo/Women Travelers:**\n- Dress modestly (cover shoulders/knees)\n- Use women-only train/bus compartments where available\n- Stay in well-reviewed hotels\n- Trust your instincts\n\n**🏥 Medical:**\n- Carry basic medications\n- Drink bottled water\n- Major hospitals in Dhaka: Square, Labaid, United\n\n📊 *Data status: VERIFIED - Confirm locally upon arrival*`,
      suggestions: ["Nearest hospital", "Embassy contacts", "Travel insurance tips"],
      actions: [{ label: "Emergency Center", action: "navigate:emergency" }],
      dataStatus: "VERIFIED",
    };
  }

  // Default helpful response
  return {
    message: `I'm your AI travel assistant for Bangladesh! 🇧🇩\n\nI can help you with:\n- 🗺️ **Trip Planning** - Create custom itineraries\n- 🚌 **Transport** - Compare buses, trains, flights\n- 🏨 **Hotels** - Find accommodation by budget\n- 🍛 **Food** - Discover local cuisine\n- 💰 **Budget** - Plan within your means\n- 🆘 **Safety** - Emergency info and tips\n- 🗣️ **Translation** - Bangla phrases\n\nTry asking:\n- "Plan a 5-day trip with ৳20,000"\n- "How to travel from Dhaka to Cox's Bazar?"\n- "Best food to try in Bangladesh"\n- "I need emergency contacts"`,
    suggestions: ["Plan my trip", "Transport options", "Food recommendations", "Safety info"],
    dataStatus: "VERIFIED",
  };
}
