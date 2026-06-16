const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoyMzg2MzE3MjQ3LCJpYXQiOjE3ODE1MTcyNDcsImp0aSI6IjJiYTc3OGYxZTc1MzRlNzg5NmZmMTU4ZjgzNGY2MGViIiwidXNlcl9pZCI6MjcyMDF9.llEamvkkyBJqIgR-16rP3-G1hfTgHCPzrpPPsxtL-Uc";
const BASE_URL = "https://api-dashboard.influencers.club";

const targets = [
  {
    name: "Enrich Instagram Handle Full (n1ckwilkins)",
    url: `${BASE_URL}/public/v1/creators/enrich/handle/full/`,
    body: { platform: "instagram", handle: "n1ckwilkins" }
  },
  {
    name: "Enrich YouTube Handle Full (mrbeast)",
    url: `${BASE_URL}/public/v1/creators/enrich/handle/full/`,
    body: { platform: "youtube", handle: "mrbeast" }
  },
  {
    name: "Enrich YouTube Channel ID Full (MrBeast UC ID)",
    url: `${BASE_URL}/public/v1/creators/enrich/handle/full/`,
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

async function run() {
  console.log("=== RUNNING INFLUENCERS CLUB API SUMMARY TESTS ===");
  console.log(`Base URL: ${BASE_URL}\n`);

  for (const target of targets) {
    try {
      console.log(`-----------------------------------------`);
      console.log(`Running: [${target.name}]`);
      
      const options = {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(target.body)
      };

      const response = await fetchWithTimeout(target.url, options, 15000);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errText = await response.text();
        console.error(`Error Response: ${errText}`);
        continue;
      }

      const data = await response.json();
      const result = data.result;
      
      if (!result) {
        console.log("❌ No result block found in response.");
        continue;
      }

      console.log(`✅ Success!`);
      console.log(`   - Credits Used: ${data.credits_cost}`);
      console.log(`   - Trial Searches Left: ${data.trial_searches_left}`);
      
      if (result.email) {
        console.log(`   - Root Email: ${result.email}`);
      } else {
        console.log(`   - Root Email: (none at root)`);
      }

      // Check Instagram details
      if (result.instagram) {
        const ig = result.instagram;
        console.log(`   - Instagram Account:`);
        console.log(`     * Handle: @${ig.username}`);
        console.log(`     * Name: ${ig.full_name}`);
        console.log(`     * Followers: ${ig.follower_count?.toLocaleString()}`);
        if (ig.email) {
          console.log(`     * Account Email: ${ig.email}`);
        }
      }

      // Check YouTube details
      if (result.youtube) {
        const yt = result.youtube;
        console.log(`   - YouTube Account:`);
        console.log(`     * Handle/Custom URL: ${yt.custom_url || yt.handle || 'N/A'}`);
        console.log(`     * Title: ${yt.title}`);
        console.log(`     * Subscribers: ${yt.subscriber_count?.toLocaleString()}`);
        if (yt.email) {
          console.log(`     * Account Email: ${yt.email}`);
        }
        if (yt.email_from_video_desc && yt.email_from_video_desc.length > 0) {
          console.log(`     * Emails from Video Descriptions: ${JSON.stringify(yt.email_from_video_desc)}`);
        }
      }

      // Check Twitter details
      if (result.twitter) {
        const tw = result.twitter;
        console.log(`   - Twitter Account:`);
        console.log(`     * Handle: @${tw.username}`);
        console.log(`     * Followers: ${tw.follower_count?.toLocaleString()}`);
      }

      // Check TikTok details
      if (result.tiktok) {
        const tk = result.tiktok;
        console.log(`   - TikTok Account:`);
        console.log(`     * Handle: @${tk.username}`);
        console.log(`     * Followers: ${tk.follower_count?.toLocaleString()}`);
      }

    } catch (e) {
      console.error(`💥 Error/Timeout: ${e.message}`);
    }
  }

  console.log("\n================ SUMMARY TESTS COMPLETE ================");
}

run();
