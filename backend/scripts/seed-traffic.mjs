/**
 * LogWatch Traffic Seeder
 * 
 * Fires 30 rounds of requests to the API Gateway to simulate user activity.
 * Useful for triggering error spikes and latency alerts in CloudWatch.
 * 
 * Usage: 
 *   API_URL=https://your-api.execute-api.region.amazonaws.com node scripts/seed-traffic.mjs
 */

const API_URL = process.env.API_URL;
if (!API_URL) {
  console.error("\x1b[31m❌ Error: API_URL environment variable is required.\x1b[0m");
  process.exit(1);
}

const TOTAL_ROUNDS = 30;
const ENDPOINTS = ["/login", "/upload", "/payment"];

async function main() {
  console.log(`\n\x1b[36m\x1b[1mLogWatch Traffic Seeder\x1b[0m`);
  console.log(`\x1b[90mTarget: ${API_URL}\x1b[0m\n`);

  for (let i = 1; i <= TOTAL_ROUNDS; i++) {
    const results = await Promise.all(
      ENDPOINTS.map(async (ep) => {
        try {
          const res = await fetch(`${API_URL}${ep}`, { method: "POST" });
          const color = res.status < 400 ? "\x1b[32m" : "\x1b[31m";
          return `${ep}: ${color}${res.status}\x1b[0m`;
        } catch (err) {
          return `${ep}: \x1b[31mERR\x1b[0m`;
        }
      })
    );

    process.stdout.write(`  Round ${i.toString().padStart(2, " ")}/${TOTAL_ROUNDS}  —  ${results.join("  ")} \r`);
    
    // Tiny delay between rounds
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n\n\x1b[32m✅ Traffic seeding complete. Data should appear in CloudWatch shortly.\x1b[0m\n`);
}

main();
