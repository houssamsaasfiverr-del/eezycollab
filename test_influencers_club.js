const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoyMzg2MzE3MjQ3LCJpYXQiOjE3ODE1MTcyNDcsImp0aSI6IjJiYTc3OGYxZTc1MzRlNzg5NmZmMTU4ZjgzNGY2MGViIiwidXNlcl9pZCI6MjcyMDF9.llEamvkkyBJqIgR-16rP3-G1hfTgHCPzrpPPsxtL-Uc";
const BASE_URL = "https://api-dashboard.influencers.club";

const targets = [
  {
    name: "Enrich Handle Full - Instagram (n1ckwilkins)",
    url: `${BASE_URL}/public/v1/creators/enrich/handle/full/`,
    body: { platform: "instagram", handle: "n1ckwilkins" }
  },
  {
    name: "Enrich Handle Full - YouTube (mrbeast - handle)",
    url: `${BASE_URL}/public/v1/creators/enrich/handle/full/`,
    body: { platform: "youtube", handle: "mrbeast" }
  },
  {
    name: "Enrich Handle Raw - YouTube (mrbeast - handle)",
    url: `${BASE_URL}/public/v1/creators/enrich/handle/raw/`,
    body: { platform: "youtube", handle: "mrbeast" }
  },
  {
    name: "Enrich Handle Full - YouTube (MrBeast Channel ID)",
    url: `${BASE_URL}/public/v1/creators/enrich/handle/full/`,
    body: { platform: "youtube", handle: "UCX6OQ3DkcsbYNE6H8uQQuVA" }
  },
  {
    name: "Enrich Handle Raw - YouTube (MrBeast Channel ID)",
    url: `${BASE_URL}/public/v1/creators/enrich/handle/raw/`,
    body: { platform: "youtube", handle: "UCX6OQ3DkcsbYNE6H8uQQuVA" }
  }
];

async function fetchWithTimeout(url, options, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function runProbes() {
  console.log("=== RUNNING INFLUENCERS CLUB API TESTS WITH TIMEOUTS ===");
  
  for (const target of targets) {
    try {
      console.log(`\n-----------------------------------------`);
      console.log(`Testing: [${target.name}]`);
      console.log(`URL: ${target.url}`);
      console.log(`Payload: ${JSON.stringify(target.body)}`);
      
      const options = {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(target.body)
      };
      
      const response = await fetchWithTimeout(target.url, options, 8000);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        console.log(`Response keys:`, Object.keys(json));
        if (response.ok) {
          console.log(`Full Response:`);
          console.log(JSON.stringify(json, null, 2));
        } else {
          console.error(`API Error:`, json);
        }
      } catch (e) {
        console.log(`Response is not JSON. Text snippet: ${text.substring(0, 300)}`);
      }
      
    } catch (e) {
      console.error(`💥 Request Error/Timeout:`, e.message);
    }
  }
  
  console.log("\n================ TESTS DONE ================");
}

runProbes();
