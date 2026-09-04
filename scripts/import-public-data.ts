import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

type PublicPoi = {
  id: string;
  name: string;
  name_bn: string;
  name_en: string;
  category: string;
  subtype: string;
  latitude: number;
  longitude: number;
  district: string;
  address: string;
  phone: string;
  website: string;
  opening_hours: string;
  wheelchair: string;
  source: string;
  source_url: string;
};

const prisma = new PrismaClient();
const root = path.resolve(__dirname, "..");

function optional(value: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function main() {
  const [poiText, manifestText] = await Promise.all([
    readFile(path.join(root, "data/public/bangladesh-pois.json"), "utf8"),
    readFile(path.join(root, "data/public/manifest.json"), "utf8"),
  ]);
  const rows = JSON.parse(poiText) as PublicPoi[];
  const manifest = JSON.parse(manifestText) as { retrieved_at: string };
  const retrievedAt = new Date(manifest.retrieved_at);

  const valid = rows.filter(
    (row) =>
      row.id && row.name &&
      Number.isFinite(row.latitude) && Number.isFinite(row.longitude) &&
      row.latitude >= 20.5 && row.latitude <= 26.8 &&
      row.longitude >= 88 && row.longitude <= 92.8
  );
  if (valid.length < 1_000) {
    throw new Error(`Refusing import: only ${valid.length} valid public POIs`);
  }

  const mapped = valid.map((row) => ({
    id: row.id,
    name: row.name.trim(),
    nameBn: optional(row.name_bn),
    nameEn: optional(row.name_en),
    category: row.category,
    subtype: optional(row.subtype),
    latitude: row.latitude,
    longitude: row.longitude,
    district: optional(row.district),
    address: optional(row.address),
    phone: optional(row.phone),
    website: optional(row.website),
    openingHours: optional(row.opening_hours),
    wheelchair: optional(row.wheelchair),
    source: row.source,
    sourceUrl: row.source_url,
    retrievedAt,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.publicPlace.deleteMany();
    for (let index = 0; index < mapped.length; index += 500) {
      await tx.publicPlace.createMany({ data: mapped.slice(index, index + 500) });
    }
  }, { timeout: 120_000 });

  console.log(`Imported ${mapped.length} verified-shape public POIs`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
