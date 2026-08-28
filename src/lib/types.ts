// ============ CORE TYPES ============

export interface TravellerProfileData {
  country?: string;
  language?: string;
  currency?: string;
  travelStyle?: "solo" | "couple" | "family" | "group";
  interests?: string[];
  dietaryPrefs?: string;
  mobilityNeeds?: string;
  emergencyContact?: string;
}

export interface TripInput {
  title: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  arrivalAirport?: string;
  departureAirport?: string;
  totalBudget?: number;
  currency?: string;
  travellers?: number;
  interests?: string[];
  travelStyle?: string;
}

export interface TransportOption {
  id: string;
  mode: "bus" | "train" | "flight" | "launch" | "rickshaw" | "car";
  operator?: string;
  from: string;
  to: string;
  departurePoint?: string;
  arrivalPoint?: string;
  duration?: string;
  durationMinutes?: number;
  distanceKm?: number;
  fare?: { min?: number; max?: number; economy?: number; business?: number };
  comfort?: "budget" | "standard" | "premium";
  schedule?: string;
  frequency?: string;
  recommendation?: "cheapest" | "fastest" | "recommended";
  dataStatus: "LIVE" | "ESTIMATED" | "VERIFIED" | "LAST_UPDATED";
  lastUpdated?: Date;
}

export interface HotelRecommendation {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  address?: string;
  starRating?: number;
  priceRange?: { min?: number; max?: number };
  amenities?: string[];
  rating?: number;
  location?: { lat: number; lng: number };
  dataStatus: "LIVE" | "ESTIMATED" | "VERIFIED" | "LAST_UPDATED";
}

export interface DestinationDetail {
  id: string;
  name: string;
  slug: string;
  division: string;
  description: string;
  shortDesc?: string;
  imageUrl?: string;
  location: { lat: number; lng: number };
  category: string;
  bestTimeToVisit?: string;
  estimatedCost?: number;
  stayDuration?: string;
  safetyRating?: number;
  isHiddenGem: boolean;
  tags: string[];
  attractions?: AttractionBrief[];
  hotels?: HotelBrief[];
  restaurants?: RestaurantBrief[];
  transport?: TransportBrief[];
}

export interface AttractionBrief {
  id: string;
  name: string;
  type: string;
  entryFee?: number;
  openingHours?: string;
  rating?: number;
}

export interface HotelBrief {
  id: string;
  name: string;
  starRating?: number;
  priceRange?: { min?: number; max?: number };
  rating?: number;
}

export interface RestaurantBrief {
  id: string;
  name: string;
  cuisine?: string;
  priceRange?: string;
  rating?: number;
}

export interface TransportBrief {
  id: string;
  mode: string;
  to: string;
  duration?: string;
  fare?: { min?: number; max?: number };
}

export interface ActivityPlan {
  id: string;
  title: string;
  description?: string;
  type: "transport" | "hotel" | "food" | "attraction" | "other";
  startTime?: string;
  endTime?: string;
  cost?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  order: number;
}

export interface DayPlan {
  dayNumber: number;
  date?: Date;
  location?: string;
  activities: ActivityPlan[];
  notes?: string;
}

export interface TripPlan {
  title: string;
  description: string;
  days: DayPlan[];
  totalEstimatedCost: number;
  budgetRemaining: number;
  currency: string;
  transportOptions: TransportOption[];
  hotelSuggestions: HotelRecommendation[];
  foodSuggestions: string[];
  safetyTips: string[];
  dataStatus: "LIVE" | "ESTIMATED" | "VERIFIED" | "LAST_UPDATED";
  generatedAt: Date;
}

export interface BudgetBreakdown {
  transport: number;
  accommodation: number;
  food: number;
  activities: number;
  shopping: number;
  other: number;
  total: number;
  currency: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  type: "hospital" | "police" | "fire" | "embassy" | "ambulance";
  address?: string;
  phone: string;
  alternatePhone?: string;
  location?: { lat: number; lng: number };
  district?: string;
  is24Hours: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  context?: ChatContext;
}

export interface ChatContext {
  currentPage?: string;
  currentTrip?: string;
  currentDestination?: string;
  userPreferences?: Partial<TravellerProfileData>;
}

export interface MapMarker {
  id: string;
  name: string;
  type: "attraction" | "hotel" | "restaurant" | "hospital" | "police" | "atm" | "airport" | "station";
  lat: number;
  lng: number;
  description?: string;
}

export interface NearbyResult {
  id: string;
  name: string;
  type: string;
  distance?: number;
  lat: number;
  lng: number;
  rating?: number;
}

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: Date;
}

export interface WeatherInfo {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  forecast: WeatherForecast[];
  dataStatus: "LIVE" | "ESTIMATED" | "VERIFIED" | "LAST_UPDATED";
}

export interface WeatherForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  description: string;
  icon: string;
  precipitation: number;
}
