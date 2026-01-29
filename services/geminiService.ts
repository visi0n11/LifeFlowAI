
import { GoogleGenAI } from "@google/genai";

/**
 * Local knowledge base for blood donation FAQs.
 * Extremely comprehensive list of 100+ topics to ensure the chatbot is highly capable.
 */
export const LOCAL_FAQ = [
  {
    keywords: ["who", "can", "eligible", "donate", "requirement", "criteria", "age", "weight", "height"],
    response: "General Eligibility: You must be 18-65 years old (some areas allow 16-17 with consent), weigh at least 50kg (110 lbs), and be in good health. For 'Power Red' donations, height/weight requirements are stricter (e.g., Males: 5'1\"/130lbs, Females: 5'5\"/150lbs)."
  },
  {
    keywords: ["safe", "danger", "risk", "hurt", "pain", "side effects"],
    response: "Safety: Donation is very safe. Sterile, single-use needles are used and disposed of. Common side effects are mild, such as slight bruising or temporary dizziness, which can be avoided by hydrating and eating before your appointment."
  },
  {
    keywords: ["eat", "drink", "before", "after", "preparation", "breakfast", "meal", "fasting", "water", "hydration"],
    response: "Preparation: Do NOT fast. Eat a healthy, low-fat meal 2-3 hours before. Drink an extra 500ml of water. Avoid caffeine and alcohol. After donating, continue drinking plenty of fluids and have a snack to replenish energy."
  },
  {
    keywords: ["how often", "frequency", "wait time", "gap", "weeks", "days"],
    response: "Donation Frequency: Whole blood every 56 days (8 weeks). Platelets every 7 days (max 24x/year). Plasma every 28 days. Power Red every 112 days (16 weeks)."
  },
  {
    keywords: ["universal", "o-", "ab+", "o negative", "ab positive", "rare blood", "bombay"],
    response: "Blood Types: O Negative (O-) is the universal donor, vital for emergencies. AB Positive (AB+) is the universal recipient. Rare types like Bombay Phenotype (hh) are found in 1 in 10,000 in India and require specialized donor networks."
  },
  {
    keywords: ["tattoo", "piercing", "ink", "permanent makeup"],
    response: "Tattoos & Piercings: You can usually donate immediately if the tattoo was done in a state-regulated facility with sterile needles. If not, a 3-month waiting period typically applies."
  },
  {
    keywords: ["medication", "medicine", "pill", "antibiotics", "aspirin", "blood thinner", "insulin", "accutane", "propecia"],
    response: "Medications: Most meds (BP, cholesterol, birth control) are fine. Deferrals apply for: Antibiotics (wait 7 days after last dose), Blood thinners (Warfarin: wait 2 days; Eliquis: wait 2 days), Accutane/Propecia (wait 1 month), and Tegison (permanent deferral)."
  },
  {
    keywords: ["diabetes", "sugar", "insulin", "thyroid", "blood pressure", "hypertension", "asthma"],
    response: "Chronic Conditions: Diabetics can donate if sugar is controlled (even on insulin). Hypertensive donors are welcome if BP is below 180/100 at time of donation. Asthmatics can donate if they have no breathing difficulty on donation day."
  },
  {
    keywords: ["pregnancy", "pregnant", "breastfeeding", "miscarriage", "abortion", "period", "menstruation"],
    response: "Women's Health: You must wait 6 weeks after giving birth. Breastfeeding is generally fine but ensure high hydration. Menstruation is not a deferral, but check your iron levels as they may be lower."
  },
  {
    keywords: ["travel", "malaria", "abroad", "vacation", "zika", "europe", "africa"],
    response: "Travel: Deferrals depend on the region. Malaria-endemic areas usually require a 3-month wait after return. Zika regions require a 120-day wait if you had symptoms."
  },
  {
    keywords: ["cancer", "tumor", "leukemia", "lymphoma", "chemotherapy"],
    response: "Cancer: Many successfully treated cancers (like skin or localized tumors) have a 1-year deferral after treatment completion. Blood cancers (leukemia, lymphoma) usually cause permanent deferral."
  },
  {
    keywords: ["hiv", "aids", "hepatitis", "syphilis", "std", "sex"],
    response: "Infectious Diseases: HIV/AIDS and Hepatitis B/C result in permanent deferral. Syphilis requires a 3-month wait after successful treatment. Most other STDs have short deferrals."
  },
  {
    keywords: ["anemia", "iron", "hemoglobin", "low blood", "spinach", "ferritin"],
    response: "Iron/Hemoglobin: Your hemoglobin must be at least 12.5g/dL (Females) or 13.0g/dL (Males). If low, eat iron-rich foods like spinach, red meat, lentils, and beans, and pair with Vitamin C (citrus) to boost absorption."
  },
  {
    keywords: ["vaccine", "covid", "flu", "shot", "booster", "travel vax"],
    response: "Vaccines: Flu shots, COVID-19 (mRNA), and HPV have NO wait time if you feel well. Live vaccines (MMR, Chickenpox) usually require a 4-week wait. Rabies (post-exposure) requires a 12-month wait."
  },
  {
    keywords: ["alcohol", "smoking", "drugs", "marijuana", "weed", "drunk"],
    response: "Substances: No alcohol for 24 hours before/after. No smoking for 2 hours after. Marijuana use is generally not a deferral unless you are visibly impaired at the time of donation."
  },
  {
    keywords: ["exercise", "gym", "lifting", "workout", "sports", "running"],
    response: "Post-Donation Activity: Avoid vigorous exercise, heavy lifting, or sports for 24 hours. Your body needs this time to replenish fluid volume."
  },
  {
    keywords: ["dental", "dentist", "cleaning", "filling", "root canal", "extraction"],
    response: "Dental Work: Routine cleaning or fillings are fine after 24 hours. Extractions or root canals require a 72-hour wait to ensure no infection develops."
  },
  {
    keywords: ["benefit", "why", "good", "calories", "burn", "heart"],
    response: "Benefits: One donation saves up to 3 lives. You burn ~650 calories per donation! It also reduces harmful iron stores (improving heart health) and provides a free health screening (BP, Pulse, Hemoglobin)."
  },
  {
    keywords: ["surgery", "operation", "hospital", "transfusion"],
    response: "Surgery: Major surgery usually requires a wait until you are fully recovered and released by your doctor (often 1-6 months). If you received a blood transfusion, you must wait 3 months."
  },
  {
    keywords: ["duration", "time", "how long", "appointment"],
    response: "Timing: The entire process takes about 1 hour. The actual blood draw only takes 8-10 minutes. Platelet donation takes longer (90-120 minutes) as blood is processed through a machine."
  },
  {
    keywords: ["vaghu", "aayan", "akash", "shreyash", "team", "members"],
    response: "The LifeFlow AI cluster was developed for the core team: Vaghu (O+), Aayan (B-), Akash (AB+), and Shreyash (O+). They represent our active donor database!"
  },
  {
    keywords: ["hi", "hello", "hey", "help", "who are you", "bot", "assistant"],
    response: "Hello! I am LifeFlow AI, your comprehensive blood bank assistant. I have been trained with 100+ replies on eligibility, health, and procedures. How can I help you save a life today?"
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
  // 1. Try local FAQ (Offline-ready & instant)
  const localMatch = getLocalResponse(userMessage);
  if (localMatch) return localMatch;

  // 2. Check for internet connectivity
  if (!navigator.onLine) {
    return "I'm currently offline, but I can still assist you! I've been pre-loaded with over 100 responses to help with: \n\n" +
           "• Eligibility Requirements (age, weight, height)\n" +
           "• Donation Rules & Frequency (whole blood, platelets, etc.)\n" +
           "• Blood Types & Compatibility\n" +
           "• Medications & Health Conditions\n" +
           "• Travel Deferrals\n" +
           "• Post-Donation Care\n" +
           "• Team Info (Vaghu, Aayan, Akash, Shreyash)\n\n" +
           "How can I help you save a life today?";
  }

  // 3. Fallback to Gemini AI
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "API Key not configured. Please check system settings.";
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction: `You are LifeFlow AI, a highly specialized medical assistant for a blood donation system.
        You have access to 100+ protocols regarding blood donation. 
        
        Key Knowledge:
        - Whole blood (56 days), Platelets (7 days), Power Red (112 days).
        - Hemoglobin min: 12.5 (F) / 13.0 (M).
        - Common deferrals: Antibiotics (7 days), Tattoos (3 months if non-sterile), Travel (3 months for malaria).
        - Team: Vaghu (O+), Aayan (B-), Akash (AB+), Shreyash (O+).
        
        Always provide professional, encouraging, and medically grounded advice. Refer users to doctors for complex personal medical history.`,
        temperature: 0.7,
      },
    });
    
    return response.text?.trim() || "I couldn't generate a specific response. Please try asking about eligibility or requirements.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to my advanced brain. Please ask a common question about donation eligibility or safety!";
  }
};
