import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bdguide.com" },
    update: {},
    create: {
      email: "admin@bdguide.com",
      name: "Admin User",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("✅ Admin user created");

  // Create demo user
  const demoPassword = await bcrypt.hash("demo123", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo Traveler",
      password: demoPassword,
      role: "traveller",
      profile: {
        create: {
          country: "United States",
          language: "en",
          currency: "USD",
          travelStyle: "solo",
          interests: JSON.stringify(["nature", "heritage", "food", "photography"]),
          emergencyContact: "+1 555-0123",
        },
      },
    },
  });
  console.log("✅ Demo user created");

  // Seed destinations
  const destinations = [
    {
      name: "Dhaka",
      slug: "dhaka",
      division: "Dhaka",
      district: "Dhaka",
      description: "The vibrant capital city of Bangladesh, known for its rich Mughal history, bustling streets, and the iconic Lalbagh Fort.",
      shortDesc: "Capital city with Mughal heritage and vibrant culture",
      latitude: 23.8103,
      longitude: 90.4125,
      category: "city",
      bestTimeToVisit: "October to March",
      estimatedCost: 3000,
      stayDuration: "2-3 days",
      safetyRating: 3.5,
      isHiddenGem: false,
      tags: JSON.stringify(["heritage", "culture", "food", "shopping", "history"]),
    },
    {
      name: "Chattogram",
      slug: "chattogram",
      division: "Chattogram",
      district: "Chattogram",
      description: "The main port city and second largest city of Bangladesh. Known for nearby Cox's Bazar beach and hill tracts.",
      shortDesc: "Port city with beaches and hill tracts",
      latitude: 22.3569,
      longitude: 91.7832,
      category: "beach",
      bestTimeToVisit: "November to February",
      estimatedCost: 2500,
      stayDuration: "2-3 days",
      safetyRating: 3.5,
      isHiddenGem: false,
      tags: JSON.stringify(["port", "beach", "hill", "nature"]),
    },
    {
      name: "Cox's Bazar",
      slug: "coxs-bazar",
      division: "Chattogram",
      district: "Cox's Bazar",
      description: "Home to the world's longest natural sea beach stretching 120km with stunning sunsets and fresh seafood.",
      shortDesc: "World's longest natural sea beach",
      latitude: 21.4272,
      longitude: 92.0058,
      category: "beach",
      bestTimeToVisit: "November to March",
      estimatedCost: 2000,
      stayDuration: "2-4 days",
      safetyRating: 4.0,
      isHiddenGem: false,
      tags: JSON.stringify(["beach", "sunset", "seafood", "nature"]),
    },
    {
      name: "Sylhet",
      slug: "sylhet",
      division: "Sylhet",
      district: "Sylhet",
      description: "The tea capital of Bangladesh, surrounded by lush green tea gardens, rolling hills, and waterfalls.",
      shortDesc: "Tea capital with rolling hills and gardens",
      latitude: 24.8949,
      longitude: 91.8687,
      category: "nature",
      bestTimeToVisit: "October to March",
      estimatedCost: 2500,
      stayDuration: "2-3 days",
      safetyRating: 4.0,
      isHiddenGem: false,
      tags: JSON.stringify(["tea", "hills", "nature", "waterfall", "spiritual"]),
    },
    {
      name: "Sundarbans",
      slug: "sundarbans",
      division: "Khulna",
      district: "Satkhira",
      description: "The largest mangrove forest in the world and a UNESCO World Heritage Site, home to the Royal Bengal Tiger.",
      shortDesc: "World's largest mangrove forest, UNESCO site",
      latitude: 21.9497,
      longitude: 89.1833,
      category: "nature",
      bestTimeToVisit: "November to February",
      estimatedCost: 5000,
      stayDuration: "2-3 days",
      safetyRating: 3.5,
      isHiddenGem: false,
      tags: JSON.stringify(["wildlife", "mangrove", "tiger", "nature", "UNESCO"]),
    },
    {
      name: "Bandarban",
      slug: "bandarban",
      division: "Chattogram",
      district: "Bandarban",
      description: "A stunning hill district with indigenous communities, the highest peaks of Bangladesh, and Buddha temples.",
      shortDesc: "Hill district with indigenous culture and peaks",
      latitude: 22.1953,
      longitude: 92.2180,
      category: "mountain",
      bestTimeToVisit: "October to March",
      estimatedCost: 3000,
      stayDuration: "2-3 days",
      safetyRating: 3.5,
      isHiddenGem: true,
      tags: JSON.stringify(["hill", "indigenous", "adventure", "nature"]),
    },
  ];

  for (const dest of destinations) {
    await prisma.destination.upsert({
      where: { slug: dest.slug },
      update: {},
      create: dest,
    });
  }
  console.log(`✅ ${destinations.length} destinations seeded`);

  // Seed attractions
  const attractions = [
    { destinationSlug: "dhaka", name: "Lalbagh Fort", description: "Mughal fort from 1678", type: "historical", entryFee: 20, openingHours: "10:00-18:00", latitude: 23.7187, longitude: 90.3881 },
    { destinationSlug: "dhaka", name: "Ahsan Manzil", description: "Pink palace of the Nawabs", type: "historical", entryFee: 50, openingHours: "09:00-17:00", latitude: 23.7085, longitude: 90.4060 },
    { destinationSlug: "dhaka", name: "Star Mosque", description: "Beautiful mosaic-decorated mosque", type: "religious", entryFee: 0, openingHours: "Open all day", latitude: 23.7146, longitude: 90.4017 },
    { destinationSlug: "coxs-bazar", name: "Cox's Bazar Beach", description: "World's longest natural sea beach", type: "natural", entryFee: 0, openingHours: "Open 24 hours", latitude: 21.4272, longitude: 92.0058 },
    { destinationSlug: "coxs-bazar", name: "Inani Beach", description: "Coral-strewn pristine beach", type: "natural", entryFee: 0, openingHours: "Open 24 hours", latitude: 21.2390, longitude: 92.0485 },
    { destinationSlug: "sylhet", name: "Ratargul Swamp Forest", description: "Freshwater mangrove forest", type: "natural", entryFee: 100, openingHours: "08:00-17:00", latitude: 24.9833, longitude: 91.9167 },
  ];

  for (const attr of attractions) {
    const dest = await prisma.destination.findUnique({ where: { slug: attr.destinationSlug } });
    if (dest) {
      await prisma.attraction.create({
        data: {
          destinationId: dest.id,
          name: attr.name,
          description: attr.description,
          type: attr.type,
          entryFee: attr.entryFee,
          openingHours: attr.openingHours,
          latitude: attr.latitude,
          longitude: attr.longitude,
        },
      });
    }
  }
  console.log(`✅ ${attractions.length} attractions seeded`);

  // Seed emergency services
  const emergencyServices = [
    { name: "National Emergency", type: "ambulance", phone: "999", is24Hours: true, division: "All" },
    { name: "Square Hospital", type: "hospital", phone: "+880 2 8144400", is24Hours: true, district: "Dhaka", division: "Dhaka" },
    { name: "Labaid Hospital", type: "hospital", phone: "+880 2 8610781", is24Hours: true, district: "Dhaka", division: "Dhaka" },
    { name: "United Hospital", type: "hospital", phone: "+880 2 8836000", is24Hours: true, district: "Dhaka", division: "Dhaka" },
    { name: "Gulshan Police Station", type: "police", phone: "+880 2 9882255", is24Hours: true, district: "Dhaka", division: "Dhaka" },
    { name: "Tourist Police", type: "police", phone: "+880 2 8901555", is24Hours: true, district: "Dhaka", division: "Dhaka" },
  ];

  for (const service of emergencyServices) {
    await prisma.emergencyService.create({ data: service });
  }
  console.log(`✅ ${emergencyServices.length} emergency services seeded`);

  // Seed travel alerts
  await prisma.travelAlert.createMany({
    data: [
      {
        title: "Monsoon Season Advisory",
        description: "Heavy rainfall expected in coastal areas. Carry waterproof gear and check forecasts regularly.",
        type: "weather",
        severity: "medium",
        region: "Coastal Areas",
        isActive: true,
      },
      {
        title: "Eid Holiday Travel Rush",
        description: "Book transport 2 weeks in advance during Eid holidays. Expect higher fares and full capacity.",
        type: "transport",
        severity: "low",
        region: "Nationwide",
        isActive: true,
      },
    ],
  });
  console.log("✅ Travel alerts seeded");

  console.log("\n🎉 Database seeded successfully!");
  console.log("\nLogin credentials:");
  console.log("  Admin: admin@bdguide.com / admin123");
  console.log("  Demo:  demo@example.com / demo123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
