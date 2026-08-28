# 🇧🇩 AI-Powered Smart Tourist Guide System for Bangladesh

A comprehensive, intelligent travel companion for tourists exploring Bangladesh — from planning to departure.

## 🌟 Features

### Core AI Features
- **AI Trip Planner** - Generate complete multi-day itineraries based on preferences, budget, and interests
- **AI Chat Assistant** - Contextual conversation for travel queries, recommendations, and assistance
- **Smart Recommendations** - Personalized destination, hotel, and food suggestions
- **Budget Optimizer** - AI-powered budget allocation and expense tracking

### Travel Planning
- **Traveller Onboarding** - Country, language, travel style, interests, dietary preferences
- **Multi-day Itinerary Generator** - Day-by-day activity planning with cost estimates
- **Airport Arrival Assistant** - Step-by-step guidance for new arrivals
- **Weather-aware Planning** - Integration with weather data for itinerary optimization

### Transport Intelligence
- **Multi-modal Transport Planner** - Compare bus, train, flight, launch options
- **Fare Comparison** - Cheapest, Fastest, Recommended options
- **Route Information** - Duration, distance, departure points, schedules

### Discovery & Exploration
- **Interactive Map** - Points of interest, hospitals, police, airports, stations
- **Destination Pages** - Detailed info, attractions, food, transport, safety
- **Nearby Discovery** - GPS-based nearby services and attractions
- **Hidden Gem Recommendations** - Off-the-beaten-path destinations

### Safety & Emergency
- **Emergency Center** - Quick access to 999, hospitals, police, embassies
- **Safety Tips** - Solo/women traveler safety, health, transport safety
- **Travel Alerts** - Weather, safety, transport advisories
- **Important Contacts** - Embassy, tourist police, medical services

### Budget & Finance
- **Budget Calculator** - Tier-based budget planning (budget/mid/premium)
- **Expense Tracker** - Log and categorize trip expenses
- **Currency Converter** - BDT to USD/EUR/GBP/INR conversion

### Additional Features
- **Bangla-English Translation** - Common phrases with phonetic guides
- **Voice Assistant** - Browser-based speech synthesis for Bangla phrases
- **Culture & Etiquette** - Local customs and travel tips
- **Travel Diary** - Record trip memories and experiences
- **Admin Dashboard** - CRUD for destinations, transport, hotels, alerts

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite (dev) / PostgreSQL (prod) via Prisma ORM
- **Authentication:** NextAuth.js (ready to integrate)
- **Validation:** Zod
- **Maps:** Leaflet (ready for integration)
- **Weather:** Open-Meteo API (free, no key required)

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # Homepage with hero & trip planner
│   ├── plan/                 # AI Trip Planner
│   ├── destinations/         # Destination discovery & detail
│   ├── transport/            # Transport comparison
│   ├── budget/               # Budget planner & expense tracker
│   ├── map/                  # Interactive map
│   ├── emergency/            # Safety & emergency center
│   ├── auth/                 # Login & registration
│   └── admin/                # Admin dashboard
├── components/
│   ├── ui/                   # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   └── layout/               # Layout components
│       ├── Navbar.tsx
│       └── ChatAssistant.tsx
├── lib/
│   ├── prisma.ts             # Database client
│   ├── utils.ts              # Utility functions
│   ├── types.ts              # TypeScript types
│   ├── data/
│   │   └── bangladesh.ts     # Bangladesh destination data
│   └── services/
│       ├── ai-planner.ts     # AI trip planning engine
│       ├── transport.ts      # Transport search & data
│       ├── budget.ts         # Budget calculation engine
│       ├── weather.ts        # Weather service (Open-Meteo)
│       └── translation.ts    # Bangla-English translation
└── prisma/
    ├── schema.prisma         # Database schema (20+ models)
    └── seed.ts               # Sample data seeder
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd bangladesh-tourist-guide

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize database
npx prisma db push

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
OPENAI_API_KEY=""          # Optional - falls back to built-in AI engine
OPENWEATHER_API_KEY=""     # Optional - uses Open-Meteo by default
```

### Demo Credentials
- **Admin:** admin@bdguide.com / admin123
- **Demo User:** demo@example.com / demo123

## 📊 Data Status Labels

All data in the system is clearly labeled:
- **LIVE** - Real-time data from APIs
- **ESTIMATED** - Approximate values based on historical data
- **VERIFIED** - Confirmed information from reliable sources
- **LAST_UPDATED** - Timestamped data that may change

## 🏗️ Architecture

### Service Layer Separation
- **UI Layer** - React components, pages, layouts
- **Business Logic** - Services for planning, budget, transport
- **AI Service** - Rule-based engine (extensible to LLM APIs)
- **Data Layer** - Prisma ORM with SQLite/PostgreSQL
- **External APIs** - Weather, maps, translation (all free/open-source)

### Database Models (20+)
User, TravellerProfile, Trip, TripDay, Activity, Destination, Attraction, TransportRoute, Hotel, Restaurant, EmergencyService, Expense, Favourite, Review, TravelAlert, DiaryEntry, Account, Session

## 🔌 API Integration Points

The system is designed with adapter patterns for easy API integration:

| Service | Current | Future Integration |
|---------|---------|-------------------|
| Weather | Open-Meteo (free) | OpenWeatherMap |
| AI | Rule-based engine | OpenAI / Claude |
| Maps | Static visualization | Leaflet/MapBox |
| Translation | Built-in dictionary | Google Translate |
| Transport | Mock data | 12Go.asia, BD Rail |
| Hotels | Mock data | Booking.com API |

## 🎨 Design Principles

- **Mobile-first** responsive design
- **Premium tourism-product** aesthetic
- **Accessible** UI with proper contrast and focus states
- **Dark/light-friendly** color scheme
- **Loading/error/empty states** for all data views
- **Bangladesh-focused** imagery and branding

## 🔒 Security

- Password hashing with bcrypt
- Input validation with Zod
- Environment variables for secrets
- SQL injection prevention via Prisma
- XSS protection via React

## 📝 Limitations & Future Roadmap

### Current Limitations
- Mock transport/hotel data (ready for real API integration)
- Rule-based AI (LLM integration ready but requires API key)
- Static map visualization (Leaflet integration ready)
- Demo authentication (NextAuth fully configured but simplified for demo)

### Roadmap
- [ ] Real transport API integration (12Go.asia, BD Rail)
- [ ] LLM-powered AI assistant (OpenAI/Claude)
- [ ] Interactive Leaflet maps with real markers
- [ ] Mobile app (React Native)
- [ ] Offline-first PWA support
- [ ] Multi-language support (Bangla, Hindi, Arabic)
- [ ] Booking integration
- [ ] Social features (reviews, photos, sharing)
- [ ] Real-time weather alerts
- [ ] Voice recognition for hands-free assistance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to verify
5. Submit a pull request

## 📄 License

MIT License - feel free to use for educational and commercial purposes.

---

**⚠️ Disclaimer:** This is a demonstration project. All transport fares, schedules, and hotel prices are estimated. Always verify critical information locally before travel. Emergency numbers and safety information should be confirmed upon arrival.
