import dotenv from "dotenv";
import mongoose from "mongoose";
import Snippet from "../src/models/Snippet";
import User from "../src/models/User";

dotenv.config();

const TOTAL = parseInt(process.env.SEED_COUNT || "1000000");
const BATCH = 10_000;

const LANGUAGES = ["javascript", "typescript", "python", "go", "rust", "java", "css", "html", "sql", "bash", "c", "cpp", "ruby", "php", "swift"];
const VISIBILITIES = ["public", "unlisted", "private"] as const;
const ADJECTIVES = ["fast", "clean", "lazy", "async", "typed", "secure", "minimal", "recursive", "simple", "modular"];
const NOUNS = ["parser", "formatter", "validator", "router", "handler", "builder", "cache", "worker", "loader", "fetcher"];

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const makeSnippet = (userId: mongoose.Types.ObjectId) => ({
  title: `${pick(ADJECTIVES)} ${pick(NOUNS)}`,
  language: pick(LANGUAGES),
  description: `A ${pick(ADJECTIVES)} ${pick(NOUNS)} implementation`,
  code: `// ${pick(ADJECTIVES)} ${pick(NOUNS)}\nfunction main() {\n  return ${rand(0, 9999)};\n}`,
  tags: [pick(ADJECTIVES), pick(NOUNS)],
  visibility: pick(VISIBILITIES),
  userId,
});

async function seed() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/devflow";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  const user = await User.findOne({ isGuest: false });
  if (!user) throw new Error("No user found — create a user account first");

  const userId = user._id as mongoose.Types.ObjectId;
  const batches = TOTAL / BATCH;

  console.log(`Seeding ${TOTAL.toLocaleString()} snippets in ${batches} batches of ${BATCH.toLocaleString()}...`);
  const start = Date.now();

  for (let i = 0; i < batches; i++) {
    const docs = Array.from({ length: BATCH }, () => makeSnippet(userId));
    await Snippet.insertMany(docs, { ordered: false });

    if ((i + 1) % 10 === 0) {
      const pct = Math.round(((i + 1) / batches) * 100);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  ${pct}% — ${((i + 1) * BATCH).toLocaleString()} docs — ${elapsed}s`);
    }
  }

  const total = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Done. ${TOTAL.toLocaleString()} snippets inserted in ${total}s`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
