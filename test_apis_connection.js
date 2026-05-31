import dotenv from 'dotenv';

dotenv.config();

const phylloClientId = process.env.VITE_PHYLLO_CLIENT_ID;
const phylloClientSecret = process.env.VITE_PHYLLO_CLIENT_SECRET;
const zernioApiKey = process.env.VITE_ZERNIO_API_KEY;

console.log("=== API CONFIGURATION ===");
console.log(`Phyllo Client ID: ${phylloClientId ? "CONFIGURED (starts with " + phylloClientId.substring(0, 5) + ")" : "MISSING"}`);
console.log(`Phyllo Client Secret: ${phylloClientSecret ? "CONFIGURED (starts with " + phylloClientSecret.substring(0, 5) + ")" : "MISSING"}`);
console.log(`Zernio API Key: ${zernioApiKey ? "CONFIGURED (starts with " + zernioApiKey.substring(0, 8) + ")" : "MISSING"}`);
console.log("==========================\n");

// Global fetch fallback (Node 18+ has native fetch)
const fetchFn = typeof fetch === 'function' ? fetch : globalThis.fetch;

async function testPhyllo() {
  if (!phylloClientId || !phylloClientSecret) {
    console.log("❌ Skipping Phyllo tests because credentials are not configured.\n");
    return;
  }

  const basicAuth = Buffer.from(`${phylloClientId}:${phylloClientSecret}`).toString('base64');

  const targets = [
    {
      name: "Phyllo Sandbox Users List",
      url: "https://api.sandbox.getphyllo.com/v1/users",
      method: "GET"
    },
    {
      name: "Phyllo Staging Users List",
      url: "https://api.staging.getphyllo.com/v1/users",
      method: "GET"
    },
    {
      name: "Phyllo Production Users List",
      url: "https://api.getphyllo.com/v1/users",
      method: "GET"
    },
    {
      name: "Phyllo Sandbox Creator Search",
      url: "https://api.sandbox.getphyllo.com/v1/creators/search",
      method: "POST",
      body: { platform: "YOUTUBE", query: "tech", limit: 5 }
    },
    {
      name: "Phyllo Staging Creator Search",
      url: "https://api.staging.getphyllo.com/v1/creators/search",
      method: "POST",
      body: { platform: "YOUTUBE", query: "tech", limit: 5 }
    },
    {
      name: "Phyllo Production Creator Search",
      url: "https://api.getphyllo.com/v1/creators/search",
      method: "POST",
      body: { platform: "YOUTUBE", query: "tech", limit: 5 }
    }
  ];

  console.log("--- Testing Phyllo API Connections ---");
  for (const target of targets) {
    try {
      console.log(`Testing [${target.name}] to ${target.url}...`);
      const options = {
        method: target.method,
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        }
      };
      if (target.body) {
        options.body = JSON.stringify(target.body);
      }

      const res = await fetchFn(target.url, options);
      console.log(`  Response Status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (res.ok) {
          console.log(`  ✅ SUCCESS! Data length/keys: ${Object.keys(json).join(', ')}`);
        } else {
          console.log(`  ❌ FAILED: ${json.error?.message || json.message || JSON.stringify(json)}`);
        }
      } catch {
        console.log(`  ❌ FAILED (Invalid JSON): ${text.substring(0, 200)}`);
      }
    } catch (err) {
      console.error(`  💥 Request Error:`, err.message);
    }
    console.log("");
  }
}

async function testZernio() {
  if (!zernioApiKey) {
    console.log("❌ Skipping Zernio tests because API Key is not configured.\n");
    return;
  }

  const targets = [
    {
      name: "Zernio Production Search (zernio.com)",
      url: "https://zernio.com/api/v1/search?platform=youtube&q=tech"
    },
    {
      name: "Zernio Production Search (api.zernio.com)",
      url: "https://api.zernio.com/v1/search?platform=youtube&q=tech"
    },
    {
      name: "Zernio Production Accounts (zernio.com)",
      url: "https://zernio.com/api/v1/accounts"
    },
    {
      name: "Zernio Production Accounts (api.zernio.com)",
      url: "https://api.zernio.com/v1/accounts"
    }
  ];

  console.log("--- Testing Zernio API Connections ---");
  for (const target of targets) {
    try {
      console.log(`Testing [${target.name}] to ${target.url}...`);
      const res = await fetchFn(target.url, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${zernioApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`  Response Status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        if (res.ok) {
          console.log(`  ✅ SUCCESS! Data keys: ${Object.keys(json).join(', ')}`);
        } else {
          console.log(`  ❌ FAILED: ${json.error?.message || json.message || JSON.stringify(json)}`);
        }
      } catch {
        console.log(`  ❌ FAILED (Invalid JSON): ${text.substring(0, 200)}`);
      }
    } catch (err) {
      console.error(`  💥 Request Error:`, err.message);
    }
    console.log("");
  }
}

async function runTests() {
  await testPhyllo();
  await testZernio();
  console.log("=== TESTS COMPLETE ===");
}

runTests();
