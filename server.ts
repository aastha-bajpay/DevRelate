import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    const { platform, user, content } = req.body;
    const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        platform,
        user,
        content,
        status: "pending",
        timestamp: new Date().toISOString(),
    };
    state.questions.unshift(newEvent);
    res.json(newEvent);
  });

  app.post("/api/draft-pr", (req, res) => {
    const { id } = req.body;
    const question = state.questions.find(q => q.id === id) as any;
    if (question) {
      question.pr_drafted = true;
      res.json({ success: true, question });
    } else {
      res.status(404).json({ error: "Question not found" });
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
