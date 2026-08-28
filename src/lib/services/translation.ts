// ============ TRANSLATION SERVICE ============
// Bangla-English translation with extensible architecture

interface TranslationEntry {
  en: string;
  bn: string;
  context?: string;
}

const translations: Record<string, TranslationEntry> = {
  // Greetings
  "hello": { en: "Hello", bn: "আসসালামু আলাইকুম", context: "greeting" },
  "welcome": { en: "Welcome", bn: "স্বাগতম", context: "greeting" },
  "goodbye": { en: "Goodbye", bn: "খোদা হাফেজ", context: "greeting" },
  "thank_you": { en: "Thank you", bn: "ধন্যবাদ", context: "greeting" },
  "please": { en: "Please", bn: "দয়া করে", context: "greeting" },
  "sorry": { en: "Sorry", bn: "দুঃখিত", context: "greeting" },
  "yes": { en: "Yes", bn: "হ্যাঁ", context: "general" },
  "no": { en: "No", bn: "না", context: "general" },

  // Common phrases
  "how_are_you": { en: "How are you?", bn: "আপনি কেমন আছেন?", context: "conversation" },
  "what_is_your_name": { en: "What is your name?", bn: "আপনার নাম কি?", context: "conversation" },
  "my_name_is": { en: "My name is", bn: "আমার নাম", context: "conversation" },
  "where_are_you_from": { en: "Where are you from?", bn: "আপনি কোথাকার?", context: "conversation" },
  "i_am_from": { en: "I am from", bn: "আমি এখান থেকে এসেছি", context: "conversation" },
  "i_dont_understand": { en: "I don't understand", bn: "আমি বুঝতে পারছি না", context: "conversation" },

  // Travel phrases
  "how_much": { en: "How much does this cost?", bn: "এটার দাম কত?", context: "shopping" },
  "too_expensive": { en: "Too expensive", bn: "অনেক বেশি দাম", context: "shopping" },
  "can_you_reduce": { en: "Can you reduce the price?", bn: "দাম কমাতে পারবেন?", context: "shopping" },
  "where_is": { en: "Where is", bn: "কোন জায়গায়", context: "direction" },
  "how_far": { en: "How far is it?", bn: "এটা কত দূর?", context: "direction" },
  "go_straight": { en: "Go straight", bn: "সোজা যান", context: "direction" },
  "turn_left": { en: "Turn left", bn: "বামে ঘুরুন", context: "direction" },
  "turn_right": { en: "Turn right", bn: "ডানে ঘুরুন", context: "direction" },

  // Food & Drink
  "i_am_hungry": { en: "I am hungry", bn: "আমার পেট কাঁচছে", context: "food" },
  "i_am_thirsty": { en: "I am thirsty", bn: "আমার তৃষ্ণা পেয়েছে", context: "food" },
  "water": { en: "Water", bn: "পানি", context: "food" },
  "rice": { en: "Rice", bn: "ভাত", context: "food" },
  "fish": { en: "Fish", bn: "মাছ", context: "food" },
  "chicken": { en: "Chicken", bn: "মুরগি", context: "food" },
  "vegetables": { en: "Vegetables", bn: "সবজি", context: "food" },
  "tea": { en: "Tea", bn: "চা", context: "food" },
  "the_bill": { en: "The bill, please", bn: "বিল দিন, দয়া করে", context: "food" },
  "delicious": { en: "Delicious!", bn: "মজার!", context: "food" },
  "not_spicy": { en: "Not spicy, please", bn: "ঝাল কম দিন", context: "food" },

  // Emergency
  "help": { en: "Help!", bn: "সাহায্য!", context: "emergency" },
  "i_need_help": { en: "I need help", bn: "আমার সাহায্য দরকার", context: "emergency" },
  "call_police": { en: "Call the police", bn: "পুলিশ ডাকুন", context: "emergency" },
  "call_ambulance": { en: "Call an ambulance", bn: "অ্যাম্বুলেন্স ডাকুন", context: "emergency" },
  "hospital": { en: "Hospital", bn: "হাসপাতাল", context: "emergency" },
  "i_am_lost": { en: "I am lost", bn: "আমি হারিয়ে গেছি", context: "emergency" },

  // Transport
  "bus": { en: "Bus", bn: "বাস", context: "transport" },
  "train": { en: "Train", bn: "ট্রেন", context: "transport" },
  "rickshaw": { en: "Rickshaw", bn: "রিকশা", context: "transport" },
  "taxi": { en: "Taxi", bn: "ট্যাক্সি", context: "transport" },
  "launch": { en: "Launch/Ship", bn: "লঞ্চ", context: "transport" },
  "airport": { en: "Airport", bn: "বিমানবন্দর", context: "transport" },
  "hotel": { en: "Hotel", bn: "হোটেল", context: "transport" },
  "how_to_get": { en: "How do I get to", bn: "কিভাবে যাব", context: "transport" },

  // Numbers
  "one": { en: "One", bn: "এক", context: "number" },
  "two": { en: "Two", bn: "দুই", context: "number" },
  "three": { en: "Three", bn: "তিন", context: "number" },
  "five": { en: "Five", bn: "পাঁচ", context: "number" },
  "ten": { en: "Ten", bn: "দশ", context: "number" },
  "hundred": { en: "Hundred", bn: "শত", context: "number" },
  "thousand": { en: "Thousand", bn: "হাজার", context: "number" },
};

export function translate(text: string, from: "en" | "bn", to: "en" | "bn"): string {
  const lowerText = text.toLowerCase().trim().replace(/\?/g, "");
  
  // Search for exact match
  for (const entry of Object.values(translations)) {
    if (entry[from].toLowerCase() === lowerText) {
      return entry[to];
    }
  }

  // Partial match
  for (const entry of Object.values(translations)) {
    if (entry[from].toLowerCase().includes(lowerText) || lowerText.includes(entry[from].toLowerCase())) {
      return entry[to];
    }
  }

  return `[${to === "bn" ? "অনুবাদ পাওয়া যায়নি" : "Translation not found"}: ${text}]`;
}

export function getPhrases(category?: string): { en: string; bn: string; phonetic?: string }[] {
  const entries = Object.values(translations);
  const filtered = category ? entries.filter((e) => e.context === category) : entries;
  
  return filtered.map((e) => ({
    en: e.en,
    bn: e.bn,
    phonetic: generatePhonetic(e.bn),
  }));
}

export function getCategories(): { id: string; name: string; count: number }[] {
  const categories = new Map<string, number>();
  Object.values(translations).forEach((e) => {
    const ctx = e.context || "general";
    categories.set(ctx, (categories.get(ctx) || 0) + 1);
  });
  return Array.from(categories.entries()).map(([id, count]) => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    count,
  }));
}

function generatePhonetic(bangla: string): string {
  // Simple phonetic guide - in production, use a proper library
  return bangla
    .replace(/আ/g, "aa")
    .replace(/ই/g, "i")
    .replace(/উ/g, "u")
    .replace(/এ/g, "e")
    .replace(/ও/g, "o")
    .replace(/ক/g, "k")
    .replace(/খ/g, "kh")
    .replace(/গ/g, "g")
    .replace(/চ/g, "ch")
    .replace(/জ/g, "j")
    .replace(/ট/g, "T")
    .replace(/ড/g, "D")
    .replace(/ত/g, "t")
    .replace(/দ/g, "d")
    .replace(/ন/g, "n")
    .replace(/প/g, "p")
    .replace(/ব/g, "b")
    .replace(/ম/g, "m")
    .replace(/য/g, "j")
    .replace(/র/g, "r")
    .replace(/ল/g, "l")
    .replace(/শ/g, "sh")
    .replace(/স/g, "sh")
    .replace(/হ/g, "h");
}

export function speakBangla(text: string): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "bn-BD";
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  }
}
