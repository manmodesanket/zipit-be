import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_PROJECT_URL as string;
const supabaseKey = process.env.SUPABASE_API_KEY as string;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT || 3000;

app.use(cors());

app.get("/", (_, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});

const retrieveShortUrl = async (longUrl: string) => {
  const { data, error } = await supabase
    .from("urls")
    .select("short")
    .eq("long", longUrl)
    .single();
  return { data, error };
};

// Route to shorten a URL
app.post("/make-short", async (req: Request, res: Response) => {
  const longUrl = req.body.longUrl as string;

  // Generate a short URL using UUID
  const shortUrl = uuidv4().slice(0, 8);

  try {
    // Insert the short URL and long URL into the Supabase database
    const { error } = await supabase.from("urls").insert({
      short: shortUrl,
      long: longUrl,
    });

    // if the error code is 23505, it means the short URL already exists
    if (error && error.code !== "23505") {
      res.status(400).json({ error: error.message });
    } else if (error && error.code === "23505") {
      // if the short URL already exists, retrieve the short URL from the database
      const { data } = await retrieveShortUrl(longUrl);
      res.status(200).json({ shortUrl: data?.short });
    } else res.status(201).json({ shortUrl });
  } catch (error) {
    res.status(500).json(error);
  }
});

app.get("/:shortUrl", async (req, res) => {
  const shortUrl = req.params.shortUrl;

  try {
    // Retrieve the long URL from the Supabase database
    const { data, error } = await supabase
      .from("urls")
      .select("long")
      .eq("short", shortUrl)
      .single();
    if (!error) res.status(200).json({ longUrl: data?.long });
    else res.status(404).json({ error: error.message });
  } catch (error) {
    res.status(404).json(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
