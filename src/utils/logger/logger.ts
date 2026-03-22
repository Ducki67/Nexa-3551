import chalk from "chalk";

function timestamp() {
  return chalk.gray(new Date().toISOString());
}

function padLabel(label: string, width = 7) {
  const s = label.toUpperCase();
  if (s.length >= width) return s;
  const pad = Math.max(0, width - s.length);
  return s + " ".repeat(pad);
}

function formatArgs(args: unknown[]) {
  return args.map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg))).join(" ");
}

export default {
  backend(...messages: unknown[]) {
    const label = chalk.bgBlue.black(` ${padLabel("BACKEND")} `);
    console.log(`${timestamp()} ${label} ${chalk.cyan(formatArgs(messages))}`);
  },

  debug(...messages: unknown[]) {
    const label = chalk.bgWhite.black(` ${padLabel("DEBUG")} `);
    console.log(`${timestamp()} ${label} ${chalk.magenta(formatArgs(messages))}`);
  },

  info(...messages: unknown[]) {
    const label = chalk.bgGreen.black(` ${padLabel("INFO")} `);
    console.log(`${timestamp()} ${label} ${chalk.green(formatArgs(messages))}`);
  },

  warn(...messages: unknown[]) {
    const label = chalk.bgYellow.black(` ${padLabel("WARN")} `);
    console.log(`${timestamp()} ${label} ${chalk.yellow(formatArgs(messages))}`);
  },

  error(...args: unknown[]) {
    const label = chalk.bgRed.white(` ${padLabel("ERROR")} `);
    console.log(`${timestamp()} ${label} ${chalk.red(formatArgs(args))}`);
  },
};