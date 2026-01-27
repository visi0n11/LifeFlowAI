
import { GoogleGenAI } from "@google/genai";

/**
 * Local knowledge base for blood donation FAQs.
 * This allows the chatbot to function for common queries without an internet connection.
 */
const LOCAL_FAQ = [
  {
    keywords: ["who", "can", "eligible", "donate", "requirement", "criteria", "age", "weight"],
    response: "To be eligible to donate blood, you generally need to be between 18 and 65 years old, weigh at least 50kg (110 lbs), and be in good general health. You should not have any active infections on the day of donation."
  },
  {
    keywords: ["safe", "danger", "risk", "hurt", "pain"],
    response: "Blood donation is very safe. We use sterile, single-use needles for every donor, which are disposed of immediately after use. You might feel a small pinch, but the process is quick and saves up to three lives!"
  },
  {
    keywords: ["eat", "drink", "before", "after", "preparation", "breakfast", "meal"],
    response: "Before donating: Have a healthy, low-fat meal and drink plenty of water. Avoid alcohol for 24 hours prior. After donating: Rest for a few minutes, have a snack, and keep hydrated for the next 48 hours."
  },
  {
    keywords: ["how", "often", "frequently", "wait", "time", "gap"],
    response: "You can typically donate whole blood every 56 days (8 weeks). This gives your body enough time to replenish its red blood cells."
  },
  {
    keywords: ["universal", "donor", "recipient", "o-", "ab+"],
    response: "O Negative (O-) is the universal donor—it can be given to patients of any blood type in emergencies. AB Positive (AB+) is the universal recipient—people with this type can receive blood from any group."
  },
  {
    keywords: ["vaghu", "aayan", "akash", "shreyash", "team", "members"],
    response: "The core LifeFlow cluster includes: Vaghu (O+), Aayan (B-), Akash (AB+), and Shreyash (O+). They are our featured active donors in the system."
  },
  {
    keywords: ["tattoo", "piercing", "ink"],
    response: "If you've recently had a tattoo or piercing, you may need to wait 4 to 12 months before donating, depending on whether the facility was state-regulated and used sterile equipment. Check with our medical staff for local regulations."
  },
  {
    keywords: ["medication", "medicine", "antibiotics", "aspirin", "pill"],
    response: "Most medications won't disqualify you, but you should finish any course of antibiotics at least 7 days before donating. If you've taken aspirin, you may be deferred from platelet donation for 48 hours, but whole blood is usually fine."
  },
  {
    keywords: ["travel", "malaria", "abroad", "vacation"],
    response: "Traveling to certain regions (like those with malaria, Zika, or other endemics) may require a waiting period of 1 to 12 months. Please provide details of your recent travel to our staff during screening."
  },
  {
    keywords: ["exercise", "gym", "lifting", "workout", "sports"],
    response: "Avoid heavy lifting or vigorous exercise for at least 24 hours after donating to prevent dizziness and allow your body to recover its fluid volume."
  },
  {
    keywords: ["alcohol", "smoking", "beer", "wine", "smoke"],
    response: "Do not consume alcohol for 24 hours before and after donation. Avoid smoking for at least 2 hours after donating to prevent feeling faint or dizzy."
  },
  {
    keywords: ["benefit", "why", "good", "health"],
    response: "Donating blood helps save lives! Additionally, you get a free mini-physical (checking pulse, blood pressure, temperature, and hemoglobin) and it can help reduce harmful iron stores in some individuals."
  },
  {
    keywords: ["faint", "dizzy", "weak", "unconscious"],
    response: "A small number of donors may feel lightheaded. This is usually due to a drop in blood pressure. Drinking plenty of water and eating a good meal beforehand significantly reduces this risk."
  },
  {
    keywords: ["hi", "hello", "hey", "help", "who are you"],
    response: "Hello! I am LifeFlow AI, your smart blood bank assistant. I can help you with eligibility rules, compatibility charts, or system information. How can I help you save a life today?"
  }
];

/**
 * Checks if the user message matches any local FAQ entries.
 */
const getLocalResponse = (message: string): string | null => {
  const lowerMsg = message.toLowerCase();
  for (const entry of LOCAL_FAQ) {
    if (entry.keywords.some(k => lowerMsg.includes(k))) {
      return entry.response;
    }
  }
  return null;
};

/**
 * Communicates with Gemini AI to get contextual responses for the Blood Bank Assistant.
 */
export const getAIChatResponse = async (userMessage: string) => {
  // 1. Try local FAQ (Offline-ready)
  const localMatch = getLocalResponse(userMessage);
  if (localMatch) return localMatch;

  // 2. Check for internet connectivity
  if (!navigator.onLine) {
    return "I'm currently offline. I can answer general questions about donation eligibility, tattoos, medications, and safety, but I need an internet connection for more advanced AI assistance.";
  }

  // 3. Fallback to Gemini AI
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "System Configuration Error: API key not found. Please ensure the project environment is correctly set up.";
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction: `You are LifeFlow AI, an intelligent assistant for a blood bank system. 
        Context: The system serves a specific team: Vaghu (O+), Aayan (B-), Akash (AB+), and Shreyash (O+).
        
        Guidelines:
        1. Eligibility: Donors must be 18-65 years old, weigh at least 50kg, and be in good health.
        2. Compatibility: O- is the universal donor; AB+ is the universal recipient.
        3. Care: Advise hydration, iron-rich meals, and rest before/after donation.
        4. Tone: Empathetic, professional, and encouraging. 
        5. Safety: Always refer complex medical conditions or specific patient cases to a doctor.
        
        Keep your responses helpful, concise, and focused on blood bank operations.`,
        temperature: 0.7,
      },
    });
    
    return response.text?.trim() || "I processed your request but couldn't generate a clear answer.";
  } catch (error: any) {
    console.error("LifeFlow AI Service Error:", error);
    return "The AI assistant is temporarily unavailable. Please try again in a few moments or use my offline help by asking about donation eligibility, tattoos, or medications.";
  }
};
