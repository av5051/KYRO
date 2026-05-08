import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres.dbaaawwvsbswdbirnrll:dnAi%3FwZFkW%234!5b@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to search opportunities
  app.post("/api/search-opportunities", async (req, res) => {
    const { query, entityType, state, sector } = req.body;
    
    try {
      const tablesResult = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      const tables = tablesResult.rows.map(r => r.table_name);
      
      let context = "";
      // Check for 'opportunities' or 'grants' or similar
      const targetTable = tables.find(t => t.includes('opportunities') || t.includes('grants') || t.includes('schemes')) || (tables.length > 0 ? tables[0] : null);

      if (targetTable) {
        // List columns to find searchable text columns
        const colsResult = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${targetTable}'`);
        const textCols = colsResult.rows
          .filter(c => ['text', 'character varying'].includes(c.data_type))
          .map(c => c.column_name);

        let searchResults;
        if (textCols.length > 0 && query) {
          // Construct a dynamic ILIKE search across all text columns
          const searchConditions = textCols.map(col => `${col} ILIKE '%${query.replace(/'/g, "''")}%'`).join(' OR ');
          searchResults = await pool.query(`SELECT * FROM ${targetTable} WHERE ${searchConditions} LIMIT 5`);
        } else {
          searchResults = await pool.query(`SELECT * FROM ${targetTable} LIMIT 5`);
        }
        context = JSON.stringify(searchResults.rows);
      } else {
        context = "No relevant database tables found.";
      }

      res.json({ context });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Failed to query database" });
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
    const distPath = path.join(process.cwd(), "dist");
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
