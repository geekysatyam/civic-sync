/**
 * Run once before seeding:  npx tsx src/seed/uploadSeedImages.ts
 * Uploads one image per issue category + article cover to Cloudinary.
 * Copy the printed SEED_IMAGES block into src/seed/constants.ts
 */
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary env vars. Check Backend/.env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Free Unsplash images — one per category
const SOURCES: Record<string, string> = {
  roads:         'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&q=70',
  roads2:         'https://images.unsplash.com/photo-1758486158509-3134ec0b9ab0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cm9hZCUyMHBvdGhvbGVzfGVufDB8fDB8fHwy',
  roads3:         'https://images.unsplash.com/photo-1779179015285-120aaa822b1b?q=80&w=1073&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  water:         'https://images.unsplash.com/photo-1526898943670-92bfa9f94c12?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
   water2:         'https://images.unsplash.com/photo-1505695715220-3a366d958259?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    water3:         'https://images.unsplash.com/photo-1619107991501-b5b9bddce8a0?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  parks:         'https://images.unsplash.com/photo-1675172299847-5c3a3292c8eb?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YnJva2VuJTIwcGFya3N8ZW58MHx8MHx8fDI%3D',
  parks2:         'https://images.unsplash.com/photo-1697852602314-91761b5e9051?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGJyb2tlbiUyMHBhcmtzfGVufDB8fDB8fHwy',
  parks3:         'https://images.unsplash.com/photo-1644774872851-c6c61470bedf?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YnJva2VuJTIwcGFya3N8ZW58MHx8MHx8fDI%3D',
  electricity:   'https://images.unsplash.com/photo-1621294465978-6b4198a5f2f7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8RUxFQ1RSSUNJVFklMjBQT0xFJTIwRkFVTFR8ZW58MHx8MHx8fDI%3D',
  electricity2:  'https://images.unsplash.com/photo-1532788411214-25d48ce9275a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fEVMRUNUUklDSVRZJTIwUE9MRSUyMEZBVUxUfGVufDB8fDB8fHwy',
  electricity3:  'https://images.unsplash.com/photo-1621294468533-b58ea7fab492?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8RUxFQ1RSSUNJVFklMjBQT0xFJTIwRkFVTFR8ZW58MHx8MHx8fDI%3D',
  sanitation:    'https://images.unsplash.com/photo-1495556650867-99590cea3657?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8UE9PUiUyMFNBTklUQVRJT058ZW58MHx8MHx8fDI%3D',
  sanitation2:   'https://images.unsplash.com/photo-1586880933328-19c7382091a8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fFBPT1IlMjBTQU5JVEFUSU9OfGVufDB8fDB8fHwy',
  sanitation3:   'https://images.unsplash.com/photo-1763401929411-3c748203751a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8UE9PUiUyMFNBTklUQVRJT058ZW58MHx8MHx8fDI%3D',
  public_safety: 'https://images.unsplash.com/photo-1664662568348-24b1482b6354?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y29uc3RydWN0aW9uJTIwc2l0ZSUyMGFjY2lkZW50fGVufDB8fDB8fHwy',
  article_cover: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=70',
};

async function main() {
  console.log('Uploading seed images to Cloudinary...\n');
  const out: Record<string, string> = {};

  for (const [key, url] of Object.entries(SOURCES)) {
    process.stdout.write(`  ${key}... `);
    try {
      const r = await cloudinary.uploader.upload(url, {
        folder: 'civicsync/seed',
        public_id: `seed_${key}`,
        overwrite: true,
      });
      out[key] = r.secure_url;
      console.log('✓');
    } catch (e) {
      console.log(`✗  ${(e as Error).message}`);
      out[key] = '';
    }
  }

  console.log('\n--- Copy this block into the bottom of src/seed/constants.ts ---\n');
  console.log('export const SEED_IMAGES: Record<string, string> = ' + JSON.stringify(out, null, 2) + ';\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
