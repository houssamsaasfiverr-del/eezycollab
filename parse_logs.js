import fs from 'fs';

const logPath = 'C:\\Users\\kisho\\.gemini\\antigravity-ide\\brain\\6b474f8b-e56d-459b-879d-ea8635eb0569\\.system_generated\\tasks\\task-116.log';

function parseLogs() {
  if (!fs.existsSync(logPath)) {
    console.error("Log file does not exist at:", logPath);
    return;
  }

  const content = fs.readFileSync(logPath, 'utf8');
  const blocks = content.split('-----------------------------------------');
  
  console.log("=== PARSED INFLUENCERS CLUB API RESULTS ===\n");
  
  for (const block of blocks) {
    if (!block.trim()) continue;
    
    const nameMatch = block.match(/Testing: \[(.*?)\]/);
    if (!nameMatch) continue;
    
    const name = nameMatch[1];
    console.log(`🔹 TEST: ${name}`);
    
    const statusMatch = block.match(/Status: (\d+ \w+)/);
    if (statusMatch) {
      console.log(`  Status: ${statusMatch[1]}`);
    }
    
    if (block.includes('💥 Request Error/Timeout:')) {
      console.log(`  Result: TIMEOUT/ERROR\n`);
      continue;
    }
    
    // Find Response keys or Full Response: as a boundary to find the response JSON
    const responseStart = block.indexOf('Response keys:');
    if (responseStart !== -1) {
      const firstBrace = block.indexOf('{', responseStart);
      const lastBrace = block.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = block.substring(firstBrace, lastBrace + 1).trim();
        try {
          const data = JSON.parse(jsonStr);
          const result = data.result;
          
          if (!result) {
            console.log("  Result: No result field found\n");
            continue;
          }
          
          console.log(`  Credits Cost: ${data.credits_cost}`);
          
          if (result.email) {
            console.log(`  📧 Email (root): ${result.email}`);
          } else {
            console.log(`  📧 Email (root): Not found`);
          }
          
          const platforms = ['instagram', 'youtube', 'twitter', 'tiktok'];
          for (const platform of platforms) {
            if (result[platform]) {
              const acc = result[platform];
              console.log(`  📸 ${platform.toUpperCase()} Account:`);
              console.log(`     - Username: @${acc.username || acc.handle || ''}`);
              console.log(`     - Full Name: ${acc.full_name || acc.fullname || acc.title || ''}`);
              console.log(`     - Followers: ${(acc.follower_count || acc.followers || acc.subscriber_count || 0).toLocaleString()}`);
              if (acc.biography || acc.description) {
                const bio = (acc.biography || acc.description).replace(/\n/g, ' ').substring(0, 100);
                console.log(`     - Bio: ${bio}...`);
              }
              if (acc.email) {
                console.log(`     - Email: ${acc.email}`);
              }
              if (acc.email_from_video_desc) {
                console.log(`     - Emails from Video Description: ${JSON.stringify(acc.email_from_video_desc)}`);
              }
            }
          }
        } catch (e) {
          console.log(`  Error parsing JSON: ${e.message}`);
        }
      }
    }
    console.log("");
  }
}

parseLogs();
