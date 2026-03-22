import { Hono } from "hono";
import path from "node:path";
import { loadRoutes } from "./utils/startup/loadRoutes";
import { Nexa } from "./utils/handlers/errors";
import logger from "./utils/logger/logger";
import http from "node:http";
import { cors } from "hono/cors";
import config from "./utils/config";
import "./utils/ws/matchmaker";

const PORT = Number(process.env.PORT || config.get("General.Port") || 5353);
const app = new Hono({ strict: false });

app.use("*", cors());

app.notFound((c) => c.json(Nexa.basic.notFound, 404));

app.use(async (c, next) => {
  if (c.req.path === "/images/icons/gear.png" || c.req.path === "/favicon.ico") await next();
  else {
    await next();

    logger.backend(`${c.req.path} | ${c.req.method} | Status ${c.res.status}`);
  }
});

async function start() {
  const waterStormEnabled = config.getBoolean("TimeLine.WaterStorm", config.getBoolean("WaterStorm", false));
  // clear the terminal so any runtime banners (bun) are removed
  try { process.stdout.write('\x1Bc'); } catch (e) { /* ignore */ }

  const asciiArt = [
  // print startup banner
    " .-----------------. .----------------.  .----------------.  .----------------. ",
    "| .--------------. || .--------------. || .--------------. || .--------------. |",
    "| | ____  _____  | || |  _________   | || |  ____  ____  | || |      __      | |",
    "| ||_   \\|_   _| | || | |_   ___  |  | || | |_  _||_  _| | || |     /  \\     | |",
    "| |  |   \\ | |   | || |   | |_  \\_|  | || |   \\ \\  / /   | || |    / /\\ \\    | |",
    "| |  | |\\ \\| |   | || |   |  _|  _   | || |    > `' <    | || |   / ____ \\   | |",
    "| | _| |_\\   |_  | || |  _| |___/ |  | || |  _/ /'`\\ \\_  | || | _/ /    \\ \\_ | |",
    "| ||_____|\\____| | || | |_________|  | || | |____||____| | || ||____|  |____|| |",
    "| |              | || |              | || |              | || |              | |",
    "| '--------------' || '--------------' || '--------------' || '--------------' |",
    " '----------------'  '----------------'  '----------------'  '----------------'   ",
  ].join("\n");

  console.log(asciiArt);
  logger.backend(`Nexa started on port ${PORT}`);

  // load routes after banner so loader logs don't appear before the ASCII art
  await loadRoutes(path.join("src", "routes"), app);

  const devPort = Number(config.get("General.DevelopmentServerPort") || config.get("DevelopmentServerPort") || 0);
  if (devPort) {
    const server = http.createServer(async (req, res) => {
      try {
        // Build a plain headers object from Node's incoming headers (HeadersInit)
        const headersObj: Record<string, string> = {};
        for (const [k, v] of Object.entries(req.headers)) {
          if (v !== undefined) headersObj[k] = Array.isArray(v) ? v.join(",") : String(v);
        }

        const url = `http://127.0.0.1:${PORT}${req.url}`;

        let body: Uint8Array | undefined = undefined;
        if (req.method && req.method !== "GET" && req.method !== "HEAD") {
          const bufs: (Uint8Array | Buffer)[] = [];
          for await (const chunk of req) {
            if (typeof chunk === "string") bufs.push(new TextEncoder().encode(chunk));
            else if (chunk instanceof Uint8Array) bufs.push(chunk);
            else bufs.push(Buffer.from(chunk));
          }
          if (bufs.length) {
            const total = bufs.reduce((s, b) => s + b.length, 0);
            const merged = new Uint8Array(total);
            let offset = 0;
            for (const b of bufs) {
              const arr = b instanceof Uint8Array ? b : new Uint8Array(b);
              merged.set(arr, offset);
              offset += arr.length;
            }
            body = merged;
          }
        }

        const request = new Request(url, { method: req.method, headers: headersObj as any, body: body as any });
        const response = await app.fetch(request as any);

        // Convert response headers to plain object for Node's response
        const respHeaders: Record<string, string> = {};
        response.headers.forEach((v, k) => {
          respHeaders[k] = v;
        });

        res.writeHead(response.status, respHeaders);
        const ab = await response.arrayBuffer();
        res.end(Buffer.from(ab));
      } catch (err) {
        logger.error("Dev server proxy error:", String(err));
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    server.listen(devPort, () => {
      logger.backend(`Development server started on port ${devPort}`);
      logger.backend(`Dev URL: http://localhost:${devPort}`);
    });
  }

  // matchmaker WS is started by importing the module (side-effects)
}

start().catch((e) => {
  console.error("Failed to start application:", e);
  process.exit(1);
});

export default {
  port: PORT,
  fetch: app.fetch,
}