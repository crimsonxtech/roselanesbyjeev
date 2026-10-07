/**
 * One-off: copies your 35 hard-coded gallery photos into the database.
 * Their thumb.webp / display.webp already live in R2, so nothing is re-uploaded.
 * These older photos have no stored original, so "Download" serves the display
 * version for them until you replace them from the dashboard.
 *
 * Run once:  npx tsx scripts/seed-portfolio.ts
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const photos = [
  {
    "assetId": "b1689edb-6451-4004-98fd-029017ba59bd",
    "alt": "Bride portrait",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "8aa12ce4-478c-4770-b1a2-1a02bb5b1506",
    "alt": "Bride portrait",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "e6eefe33-7fea-46fa-8f5b-f7cb1f764b5f",
    "alt": "Bride portrait",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "80e0cf8f-1010-4d81-96fd-8ebabebc09b0",
    "alt": "Bride portrait",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "8e858620-ab5c-4931-a2ce-98492b1dcd43",
    "alt": "Bride portrait",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "f693c0e1-17cf-4b91-9040-c0e08ebe93fd",
    "alt": "Bride portrait",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "ff6a532c-bd7f-4a58-9047-f2dbae33e0cf",
    "alt": "Bride portrait",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "6e4b0e2c-7a81-4123-ba75-44aef47106e7",
    "alt": "Bride portrait",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "9a5ba915-c999-4a9a-a848-5080d2c7bb94",
    "alt": "Bride portrait",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "c6be2f22-72fd-4890-9c67-5bbbefca2912",
    "alt": "Bride portrait",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "df1c6991-0522-4527-b407-5196c02aeca4",
    "alt": "Couple photography",
    "width": 1080,
    "height": 1350
  },
  {
    "assetId": "ae906b08-ad84-4dd0-8cd8-624a85084f9e",
    "alt": "Couple photography",
    "width": 1330,
    "height": 2000
  },
  {
    "assetId": "97881ecd-832f-4418-8328-70a19eff3578",
    "alt": "Couple photography",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "e9f8e0ac-2eef-4188-9fb2-50946a4abbcf",
    "alt": "Couple photography",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "51ca6e36-8d88-420e-9e55-c0e12ebedb97",
    "alt": "Couple photography",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "ce043f7f-b9be-412e-9c28-229472e4aa9d",
    "alt": "Couple photography",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "b1d64a15-9752-4929-8838-d22b61b98e19",
    "alt": "Couple photography",
    "width": 951,
    "height": 1426
  },
  {
    "assetId": "a605c776-8380-47f4-86ef-2ced8a79d4d7",
    "alt": "Couple photography",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "80aae8c9-cb60-47ed-b0a2-e5f3477d2378",
    "alt": "Wedding reception",
    "width": 1388,
    "height": 2000
  },
  {
    "assetId": "e9aa4d0c-0a8f-48df-8e59-eb535d1109fc",
    "alt": "Wedding reception",
    "width": 1372,
    "height": 2000
  },
  {
    "assetId": "a5875d88-49bc-4b01-a30d-f5f94bd39f4e",
    "alt": "Wedding reception",
    "width": 2000,
    "height": 1393
  },
  {
    "assetId": "98c1efbb-c422-437e-9719-a6bb01f83ffa",
    "alt": "Wedding reception",
    "width": 1334,
    "height": 2000
  },
  {
    "assetId": "fd98b2a8-4401-4576-b442-a8c83ce40c31",
    "alt": "Wedding reception",
    "width": 1435,
    "height": 2000
  },
  {
    "assetId": "0b152599-aa21-44a2-b450-5301fd1ce95e",
    "alt": "Wedding reception",
    "width": 1356,
    "height": 2000
  },
  {
    "assetId": "a124e500-304c-4b42-8186-65a845b3e1e6",
    "alt": "Wedding reception",
    "width": 1364,
    "height": 2000
  },
  {
    "assetId": "64b98c75-2031-4529-9713-40960e84fdcd",
    "alt": "Wedding photography",
    "width": 1412,
    "height": 2000
  },
  {
    "assetId": "f262efc8-5670-42aa-b0c2-36afa24e9cf4",
    "alt": "Wedding photography",
    "width": 2000,
    "height": 1333
  },
  {
    "assetId": "5f1f3b67-a5ba-474d-80a2-4fd424fcaef5",
    "alt": "Wedding photography",
    "width": 2000,
    "height": 1333
  },
  {
    "assetId": "546a8a91-767c-4236-aadc-06ee684e3e77",
    "alt": "Wedding photography",
    "width": 2000,
    "height": 1381
  },
  {
    "assetId": "7c59df55-fcc9-4b51-ab01-92491668b721",
    "alt": "Wedding photography",
    "width": 1373,
    "height": 2000
  },
  {
    "assetId": "ba0cade9-8954-4a0a-be86-a2235153851a",
    "alt": "Wedding photography",
    "width": 2000,
    "height": 1330
  },
  {
    "assetId": "70616520-7997-4d06-a2f9-3341d01a2142",
    "alt": "Wedding photography",
    "width": 1333,
    "height": 2000
  },
  {
    "assetId": "e563fb51-2448-4bb0-9bb3-9d2d59fe6000",
    "alt": "Wedding photography",
    "width": 1487,
    "height": 2000
  },
  {
    "assetId": "a98c5748-5b2f-4a47-819f-2ddfc610813f",
    "alt": "Wedding photography",
    "width": 2000,
    "height": 1333
  },
  {
    "assetId": "8ab068d2-bb63-4d9e-8eec-883e29e4201f",
    "alt": "Wedding photography",
    "width": 1333,
    "height": 2000
  }
];

async function main() {
  if ((await prisma.portfolioImage.count()) > 0) {
    console.log("Gallery already has photos, skipping seed.");
    return;
  }
  await prisma.portfolioImage.createMany({
    data: photos.map((p, position) => ({ ...p, position })),
  });
  console.log(`Seeded ${photos.length} gallery photos.`);
}

main().finally(() => prisma.$disconnect());