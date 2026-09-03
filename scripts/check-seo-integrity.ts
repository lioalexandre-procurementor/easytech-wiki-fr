import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors: string[] = [];

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const nonWc4EditorialRoutes = [
  "app/[locale]/great-conqueror-rome/guides",
  "app/[locale]/great-conqueror-rome/mises-a-jour",
  "app/[locale]/european-war-6/guides",
  "app/[locale]/european-war-6/mises-a-jour",
];

for (const directory of nonWc4EditorialRoutes) {
  for (const relative of ["page.tsx", "[slug]/page.tsx"]) {
    const file = path.join(directory, relative);
    const content = read(file);
    if (/[@/]lib\/(guides|updates)|load(Guide|Update)/.test(content)) {
      errors.push(`${file} must not load WC4 editorial content`);
    }
  }
}

const updateDir = path.join(root, "data", "wc4", "updates");
const updates = fs.readdirSync(updateDir).filter((file) => file.endsWith(".json"));
for (const file of updates) {
  const data = JSON.parse(fs.readFileSync(path.join(updateDir, file), "utf8")) as {
    slug?: string;
    version?: string;
    sourceUrl?: string;
  };
  if (!data.slug || file !== `${data.slug}.json`) errors.push(`${file} has a mismatched slug`);
  if (!/^3\./.test(data.version ?? "")) errors.push(`${file} uses an unsupported WC4 version series`);
  if (!/^https:\/\//.test(data.sourceUrl ?? "")) errors.push(`${file} needs an HTTPS primary source`);
}

const sitemap = read("app/sitemap.ts");
for (const pathFragment of [
  "/great-conqueror-rome/guides\"",
  "/great-conqueror-rome/mises-a-jour\"",
  "/european-war-6/guides\"",
  "/european-war-6/mises-a-jour\"",
]) {
  if (sitemap.includes(pathFragment)) errors.push(`Noindex editorial hub leaked into sitemap: ${pathFragment}`);
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`SEO integrity checks passed (${updates.length} verified WC4 update records).`);
