import { spawn } from "node:child_process";

const rawArgs = process.argv.slice(2);
const fresh = rawArgs.includes("--fresh");
const args = rawArgs.filter((arg) => arg !== "--fresh");

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, ["tauri", ...args], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    ...(fresh ? { VITE_TUBESTACK_FRESH: "1" } : {}),
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
