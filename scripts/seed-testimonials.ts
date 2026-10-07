/**
 * One-off: copies your 6 hard-coded testimonials into the database,
 * reusing the images already in your bucket.
 *
 * Run once:  npx tsx scripts/seed-testimonials.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const BASE = "https://images.roselanesbyjeev.in/";
const P = "roselanesbyjeev/portfolio/testimonials/"; // full path on the CDN

const rows = [
  ["44c2f01d-a233-4025-b9a5-d70e96bbf1e2", "Aisha & Rohan", 5, "Jeevan captured our wedding like he'd known us for years. Every candid moment felt effortless, and the final gallery still gives us goosebumps."],
  ["d903e39f-3d67-4ef2-8054-99ab0d905c92", "Meera & Karan", 4, "We didn't even notice him shooting half the time — that's how natural everything felt. The pre-wedding shoot alone made us cry happy tears."],
  ["54a31885-fdd9-4f5b-9b2e-9569c9767b07", "Sana & Dev", 4, "Professional, warm, and endlessly patient with our chaotic families. The photos turned out more beautiful than we imagined possible."],
  ["0e6912e2-e21a-4951-8bc0-9acd6654ec42", "Priya & Arjun", 5, "Booking him was the easiest decision of our entire wedding planning. Fast turnaround, stunning edits, and such a calming presence on the day."],
  ["3ce71027-b7df-465a-8de5-703c22e7da50", "Neha & Vikram", 5, "He has an eye for the tiny, fleeting moments — the ones you'd never think to ask for but end up loving the most."],
  ["16fc9c11-32ce-4cb2-b86e-8393cfc4f26b", "Ritu & Sameer", 5, "From the first call to the final delivery, everything felt thoughtful. Worth every rupee for the memories we'll keep forever."],
] as const;

async function main() {
  if ((await prisma.testimonial.count()) > 0) {
    console.log("Testimonials already exist — skipping seed.");
    return;
  }
  for (const [i, [uuid, name, rating, review]] of rows.entries()) {
    // imageKey is relative to R2_BASE_PATH (what lib/r2.ts expects)
    const imageKey = `portfolio/testimonials/${uuid}.webp`;
    await prisma.testimonial.create({
      data: { name, rating, review, imageUrl: `${BASE}${P}${uuid}.webp`, imageKey, position: i },
    });
  }
  console.log(`Seeded ${rows.length} testimonials.`);
}

main().finally(() => prisma.$disconnect());