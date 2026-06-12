import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import { readJournal, recordResult } from "../src/core/journal.js";

const path = "/tmp/pharos-settlement-journal-test.jsonl";

describe("journal", () => {
  afterEach(async () => rm(path, { force: true }));

  it("serializes bigint transaction fields", async () => {
    process.env.PHAROS_JOURNAL_PATH = path;
    await recordResult({
      actionId: `0x${"11".repeat(32)}`,
      status: "proposed",
      simulation: { value: 1n },
    });
    expect(await readJournal()).toMatchObject([{ simulation: { value: "1" } }]);
  });
});
