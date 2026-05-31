import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("No VITE_GEMINI_API_KEY found!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function run() {
  const prompt = `You are an influencer marketing expert. Recommend 150 real Instagram influencers for a campaign with this description: "@chloetg" and hashtags: "@chloetg".
Return ONLY a valid JSON array of objects with these keys: "handle" (e.g. "@username"), "displayName", "bio" (short 1-sentence description), "followers" (estimated number), "email" (business email if available, format: name@domain.com). Do not include markdown formatting or backticks.`;

  try {
    console.log("Calling Gemini 2.5 Flash for chloetg prompt...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("Raw response text length:", text.length);
    console.log("Raw text response:\n", text);
  } catch (error) {
    console.error("❌ Error running test:", error);
  }
}

run();
