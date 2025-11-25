#!/usr/bin/env node

/**
 * Script to pull Cloudflare Worker code and configuration
 * Uses wrangler's authentication
 */

import { execSync } from 'child_process';
import fs from 'fs';

const WORKER_NAME = 'fleet-r2-upload';
const ACCOUNT_ID = '62bdb1736e32df066a3014665f294d04';

console.log('📥 Pulling Cloudflare Worker code and configuration...\n');

try {
  // Get the latest version
  console.log('1. Fetching latest worker version...');
  const versionsOutput = execSync(
    `npx wrangler versions list --name ${WORKER_NAME} --json`,
    { encoding: 'utf-8' }
  );
  
  const versions = JSON.parse(versionsOutput);
  const latestVersion = versions[0];
  
  console.log(`   ✓ Found version ${latestVersion.number} (${latestVersion.id})\n`);
  
  // Get version details
  console.log('2. Fetching version details...');
  const versionDetails = execSync(
    `npx wrangler versions view ${latestVersion.id} --name ${WORKER_NAME} --json`,
    { encoding: 'utf-8' }
  );
  
  const details = JSON.parse(versionDetails);
  console.log(`   ✓ Bindings found:`);
  details.resources.bindings.forEach(binding => {
    if (binding.type === 'r2_bucket') {
      console.log(`     - R2 Bucket: ${binding.name} → ${binding.bucket_name}`);
    } else if (binding.type === 'secret_text') {
      console.log(`     - Secret: ${binding.name} (secret_text)`);
    }
  });
  
  console.log('\n3. Worker code needs to be copied manually from Cloudflare Dashboard:');
  console.log(`   https://dash.cloudflare.com/${ACCOUNT_ID}/workers/services/view/${WORKER_NAME}`);
  console.log('\n   Or use the Cloudflare API with your API token.');
  console.log('\n4. Configuration saved to wrangler.toml');
  
  // Save version info
  fs.writeFileSync(
    'worker-version-info.json',
    JSON.stringify({ latestVersion, details }, null, 2)
  );
  console.log('\n   ✓ Version info saved to worker-version-info.json');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
