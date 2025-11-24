import { buildApp } from "./app";
import { env } from "./config/env";

const startServer = async () => {
  try {
    const app = await buildApp();

    const PORT = Number(env.PORT) || Number(process.env.PORT) || 3000;

    await app.listen({
      port: PORT,
      host: "0.0.0.0", // REQUIRED for Railway/Render/Cyclic/Fly
    });

    console.log(`Server running on http://0.0.0.0:${PORT}`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
