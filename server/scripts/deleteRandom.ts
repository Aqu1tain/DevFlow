import dotenv from "dotenv";
import mongoose from "mongoose";
import Snippet from "../src/models/Snippet";

dotenv.config();

const TARGET = 1_000_000;
const BATCH = 10_000;

async function deleteRandom() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/devflow");

  const total = await Snippet.estimatedDocumentCount();
  console.log(`Total snippets: ${total.toLocaleString()}`);

  if (total < TARGET) {
    console.log("Not enough snippets to delete 1M.");
    return void (await mongoose.disconnect());
  }

  console.log(`Fetching all IDs...`);
  const all = await Snippet.find({}, "_id").lean().exec();

  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  const toDelete = all.slice(0, TARGET).map((d) => d._id);
  const batches = Math.ceil(toDelete.length / BATCH);

  console.log(`Deleting ${TARGET.toLocaleString()} snippets in ${batches} batches...`);
  const start = Date.now();

  for (let i = 0; i < batches; i++) {
    const batch = toDelete.slice(i * BATCH, (i + 1) * BATCH);
    await Snippet.deleteMany({ _id: { $in: batch } });

    if ((i + 1) % 10 === 0) {
      const pct = Math.round(((i + 1) / batches) * 100);
      console.log(`  ${pct}% — ${((i + 1) * BATCH).toLocaleString()} deleted — ${((Date.now() - start) / 1000).toFixed(1)}s`);
    }
  }

  const remaining = await Snippet.estimatedDocumentCount();
  console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s. Remaining: ${remaining.toLocaleString()}`);
  await mongoose.disconnect();
}

deleteRandom().catch((err) => {
  console.error(err);
  process.exit(1);
});
