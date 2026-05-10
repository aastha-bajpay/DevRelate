import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Security Headers
  app.use(helmet());

  // Rate Limiting for API routes
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." }
  });
  app.use("/api/", apiLimiter);

  // Input Validation Schemas
  const simulateEventSchema = z.object({
    platform: z.enum(["discord", "github", "reddit", "stackoverflow"]),
    user: z.string().min(1),
    content: z.string().min(1),
  });

  const draftPrSchema = z.object({
    id: z.string().min(1),
  });

  // Mock database
  const state: any = {
    stats: {
      openQuestions: 12,
      resolvedLast24h: 45,
      avgResponseTime: "4m 12s",
      sentiment: "Positive",
    },
    questions: [
      {
        id: "1",
        platform: "discord",
        user: "dev_jane",
        content: "How do I initialize the client in Python? I keep getting an AuthError.",
        status: "pending",
        timestamp: new Date().toISOString(),
        pr_drafted: false,
      },
      {
        id: "2",
        platform: "github",
        user: "oss_maintainer",
        content: "New issue: Vulnerability in dependency @google/genai",
        status: "auto-resolved",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ai_response: "Identified vulnerability. PR drafted to update to ^1.29.0.",
        pr_drafted: true,
      }
    ],
    contributors: [
      { name: "alex_coder", points: 1250, interactions: 42 },
      { name: "maria_s", points: 980, interactions: 35 },
    ],
    scrapedMentions: [
      {
        id: "m1",
        source: "reddit",
        content: "Just tried the new DevRelate SDK, it's actually pretty clean compared to the old one.",
        sentiment: "positive",
        url: "https://reddit.com/r/webdev/comments/123",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "m2",
        source: "stackoverflow",
        content: "Getting 401 Unauthorized when calling the /v1/ingest endpoint. Anyone else?",
        sentiment: "neutral",
        url: "https://stackoverflow.com/q/9876543",
        timestamp: new Date(Date.now() - 14400000).toISOString(),
      }
    ],
    infrastructure: {
      provider: "Superplane",
      status: "healthy",
      webhooks: {
        discord: true,
        github: true,
      }
    }
  };

  // API Routes
  app.get("/api/dashboard", (req, res) => {
    res.json(state);
  });

  app.post("/api/simulate-event", (req, res) => {
    try {
      const validatedData = simulateEventSchema.parse(req.body);
      const newEvent = {
          id: Math.random().toString(36).substr(2, 9),
          platform: validatedData.platform,
          user: validatedData.user,
          content: validatedData.content,
          status: "pending",
          timestamp: new Date().toISOString(),
      };
      state.questions.unshift(newEvent);
      res.json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: (error as any).errors });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/api/draft-pr", (req, res) => {
    try {
      const validatedData = draftPrSchema.parse(req.body);
      const question = state.questions.find((q: any) => q.id === validatedData.id) as any;
      if (question) {
        question.pr_drafted = true;
        res.json({ success: true, question });
      } else {
        res.status(404).json({ error: "Question not found" });
      }
    } catch (error) {
       if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: (error as any).errors });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
