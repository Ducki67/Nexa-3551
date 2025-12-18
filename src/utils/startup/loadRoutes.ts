import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { Hono } from "hono";
import logger from "../logger/logger";
import { fileURLToPath } from "url";

function getBaseDir(): string {
    if (typeof Bun !== "undefined" && Bun.main) {
        return dirname(Bun.main);
    }
    return dirname(fileURLToPath(import.meta.url));
}

async function loadRoute(directory: string, file: string, app: Hono): Promise<void> {
    try {
        const RouteModule = await import(join(directory, file));
        const defaultExport = RouteModule.default;

        if (defaultExport && typeof defaultExport === "function") {
            defaultExport(app);
        } else {
            logger.error(`${file} does not export a valid route initializer`);
        }
    } catch (error) {
        logger.error(`Error loading route ${file}: ${(error as Error).message}`);
    }
}

export async function loadRoutes(directory: string, app: Hono): Promise<void> {
    try {
        const baseDir = getBaseDir();
        const routesPath = join(baseDir, directory);

        const files = await readdir(routesPath);
        const routedFiles = files.filter((name) => name.endsWith(".ts") || name.endsWith(".js"));

        await Promise.all(routedFiles.map((file) => loadRoute(routesPath, file, app)));
    } catch (error) {
        logger.error(`Failed to load routes: ${error}`);
    }
}