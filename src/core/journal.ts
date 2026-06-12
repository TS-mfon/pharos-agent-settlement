import { appendFile, readFile } from "node:fs/promises";
import type { ActionResult } from "./schema.js";

const journalPath = () => process.env.PHAROS_JOURNAL_PATH || "settlement-journal.jsonl";

export async function recordResult(result: ActionResult): Promise<void> {
  await appendFile(journalPath(), `${JSON.stringify(
    { recordedAt: new Date().toISOString(), ...result },
    (_, value) => typeof value === "bigint" ? value.toString() : value,
  )}\n`);
}

export async function readJournal(): Promise<unknown[]> {
  try {
    return (await readFile(journalPath(), "utf8")).trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  } catch (error: any) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}
