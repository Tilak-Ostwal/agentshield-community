import { expect, test } from "vitest";
import { runLeaderboardCommand } from "./leaderboardCommand.js";

test("leaderboard command fails on unknown subcommand", () => {
  const res = runLeaderboardCommand(["unknown"], process.cwd());
  expect(res.exitCode).toBe(1);
});
