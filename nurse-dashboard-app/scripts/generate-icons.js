#!/usr/bin/env node
/**
 * Icon Generator Script
 * Run: node scripts/generate-icons.js
 * Requires: npm install sharp (run once)
 *
 * This script takes /public/icons/icon.svg and generates all required PNG sizes.
 * Install sharp first: npm install --save-dev sharp
 */

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (e) {
    console.log('⚠️  sharp not installed. Run: npm install --save-dev sharp');
    console.log('📝 Alternatively, use https://maskable.app/editor to create your icons.');
    console.log('\nManual steps:');
    console.log('1. Open /public/icons/icon.svg in a browser');
    console.log('2. Screenshot at each size OR use an online tool like:');
    console.log('   - https://www.pwabuilder.com/imageGenerator');
    console.log('   - https://maskable.app/editor');
    sizes.forEach(s => console.log(`   → icon-${s}x${s}.png`));
    return;
  }

  const { readFileSync } = await import('fs');
  const { join, dirname } = await import('path');
  const { fileURLToPath } = await import('url');

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const svgPath = join(__dirname, '../public/icons/icon.svg');
  const svgBuffer = readFileSync(svgPath);

  for (const size of sizes) {
    const output = join(__dirname, `../public/icons/icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(output);
    console.log(`✅ Generated icon-${size}x${size}.png`);
  }

  // Also copy as apple-touch-icon
  const apple = join(__dirname, '../public/icons/apple-touch-icon.png');
  await sharp(svgBuffer).resize(180, 180).png().toFile(apple);
  console.log('✅ Generated apple-touch-icon.png');

  console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
