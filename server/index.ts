import path from "path";
import { createServer as createViteServer } from "vite";
import { createApp } from "./app";
import { env } from "./config/env";

export async function startServer() {
  const app = createApp();

  if (env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(app.locals.express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`InterviewMaster server listening at http://localhost:${env.PORT}`);
  });
}
