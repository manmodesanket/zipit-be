"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js");
const body_parser_1 = __importDefault(require("body-parser"));
const uuid_1 = require("uuid");
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
const port = process.env.PORT || 3000;
app.get("/", (_, res) => {
    res.send("Hello, TypeScript with Express!");
});
const retrieveShortUrl = (longUrl) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabase
        .from("urls")
        .select("short")
        .eq("long", longUrl)
        .single();
    return { data, error };
});
// Route to shorten a URL
app.post("/make-short", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const longUrl = req.body.longUrl;
    // Generate a short URL using UUID
    const shortUrl = (0, uuid_1.v4)().slice(0, 8);
    try {
        // Insert the short URL and long URL into the Supabase database
        const { error } = yield supabase.from("urls").insert({
            short: shortUrl,
            long: longUrl,
        });
        // if the error code is 23505, it means the short URL already exists
        if (error && error.code !== "23505") {
            res.status(400).json({ error: error.message });
        }
        else if (error && error.code === "23505") {
            // if the short URL already exists, retrieve the short URL from the database
            const { data } = yield retrieveShortUrl(longUrl);
            res.status(200).json({ shortUrl: data === null || data === void 0 ? void 0 : data.short });
        }
        else
            res.status(201).json({ shortUrl });
    }
    catch (error) {
        res.status(500).json(error);
    }
}));
app.get("/:shortUrl", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const shortUrl = req.params.shortUrl;
    try {
        // Retrieve the long URL from the Supabase database
        const { data, error } = yield supabase
            .from("urls")
            .select("long")
            .eq("short", shortUrl)
            .single();
        if (!error)
            res.status(200).json({ longUrl: data === null || data === void 0 ? void 0 : data.long });
        else
            res.status(404).json({ error: error.message });
    }
    catch (error) {
        res.status(404).json(error);
    }
}));
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
