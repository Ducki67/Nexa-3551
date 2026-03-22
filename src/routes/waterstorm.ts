import { Hono } from "hono";
import waterstorm from "../utils/waterstormController";

export default function (app: Hono) {
  app.get("/waterstorm/status", (c) => {
    return c.json(waterstorm.status());
  });

  app.post("/waterstorm/toggle", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const enable = typeof body.enabled === "boolean" ? body.enabled : !waterstorm.isEnabled();
    const newState = waterstorm.setEnabled(enable);
    return c.json({ enabled: newState });
  });

  app.post("/waterstorm/trigger", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const storm = waterstorm.triggerStorm({ intensity: body.intensity, duration: body.duration });
    if (!storm) return c.json({ ok: false, reason: "disabled" }, 400);
    return c.json({ ok: true, storm });
  });
}
