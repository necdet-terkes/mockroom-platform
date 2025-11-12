import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const ENV_PATH =
  process.env.ENV_PATH ||
  "/Users/necdet/dev/mockroom-platform/apps/mockoon-server/environment.json";

const app = express();
app.use(cors());
app.use(express.json());

// ---- helpers ----
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[rand(0, arr.length - 1)];

type Offer = { type: string; name: string; url: string };
type MovieLike = {
  id: string;
  type: "MOVIE" | "SHOW";
  url: string;
  title: string;
  year: number;
  runtime: number;
  photo_url: string[];
  backdrops: string[];
  tmdbId: string;
  imdbId: string;
  jwRating: number;
  tomatoMeter: number | null;
  tomatoCertifiedFresh: boolean | null;
  offers: Offer[];
};

const providers = ["Netflix","Amazon Prime Video","Apple TV","Google Play Movies","YouTube","Plex"];
const kinds = ["RENT SD","RENT HD","BUY SD","BUY HD","FLATRATE SD","FLATRATE HD","FREE SD","FREE HD"];

const jwImg = (slug: string, size: number, kind: "poster" | "backdrop" = "poster") =>
  `https://images.justwatch.com/${kind}/${rand(1_000_000, 399_999_999)}/s${size}/${encodeURIComponent(slug)}.jpg`;

function generateDescription(query: string, count = 8): MovieLike[] {
  const bases = [
    "Primal Fear","The Two Faces of January","Audrey Rose",
    "Diabolique","Bha Ji in Problem","Chi's Sweet Home",
    "The Many Faces of Ito","Trishul",
  ];
  return Array.from({ length: count }).map(() => {
    const title = pick(bases);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const isShow = Math.random() < 0.25;

    const offers: Offer[] = Array.from({ length: rand(3, 8) }).map(() => ({
      type: pick(kinds),
      name: pick(providers),
      url: `https://example.com/${slug}`,
    }));

    return {
      id: `${isShow ? "ts" : "tm"}${rand(10000, 999999)}`,
      type: (isShow ? "SHOW" : "MOVIE"),
      url: `https://justwatch.com/in/${isShow ? "tv-show" : "movie"}/${slug}`,
      title: query ? `${title}` : title,
      year: rand(1950, 2024),
      runtime: isShow ? rand(25, 60) : rand(85, 150),
      photo_url: [592, 332, 166].map((s) => jwImg(slug, s, "poster")),
      backdrops: Array.from({ length: rand(3, 5) }).map(() => jwImg(slug, 1920, "backdrop")),
      tmdbId: `${rand(100, 500000)}`,
      imdbId: `tt${rand(1_000_000, 9_999_999)}`,
      jwRating: Math.random(),
      tomatoMeter: Math.random() < 0.7 ? rand(35, 98) : null,
      tomatoCertifiedFresh: Math.random() < 0.5 ? true : Math.random() < 0.5 ? false : null,
      offers,
    };
  });
}

// ---- ENV yazıcı: route'u bulur, yoksa oluşturur, body/content ikisini de destekler ----
function upsertMockoonMoviesRoute(payload: any) {
  const raw = fs.readFileSync(ENV_PATH, "utf-8");
  const env = JSON.parse(raw);

  env.routes = Array.isArray(env.routes) ? env.routes : [];

  // endpoint eşleştirmeyi biraz esnek yap: /api/movies veya .../movies
  let route = env.routes.find(
    (r: any) =>
      typeof r?.endpoint === "string" &&
      /\/api\/movies$|\/movies$/.test(r.endpoint) &&
      String(r.method || "").toLowerCase() === "get"
  );

  if (!route) {
    // yoksa minimal bir GET /api/movies route’u oluştur
    route = {
      uuid: `auto-${Date.now()}`,
      method: "get",
      endpoint: "/api/movies",
      responses: [
        {
          uuid: `resp-${Date.now()}`,
          statusCode: 200,
          latency: 0,
          headers: [],
          body: "",
          bodyType: "INLINE"
        }
      ]
    };
    env.routes.push(route);
  }

  const headers = [
    { key: "Content-Type", value: "application/json; charset=utf-8" },
    { key: "Access-Control-Allow-Origin", value: "*" },
    { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
    { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With" }
  ];
  const jsonText = JSON.stringify(payload, null, 2);

  if (!Array.isArray(route.responses) || !route.responses.length) {
    route.responses = [{ statusCode: 200, headers: [], bodyType: "INLINE", body: "" }];
  }

  route.responses[0].statusCode = 200;
  route.responses[0].headers = headers;

  // Hem eski "body" hem yeni "content" şemasını destekle
  if (route.responses[0].content) {
    route.responses[0].content = { type: "application/json", data: jsonText };
    delete route.responses[0].body;
    delete route.responses[0].bodyType;
  } else {
    route.responses[0].bodyType = "INLINE";
    route.responses[0].body = jsonText;
  }

  fs.writeFileSync(ENV_PATH, JSON.stringify(env, null, 2));
  const fd = fs.openSync(ENV_PATH, "r");
  fs.fsyncSync(fd);
  fs.closeSync(fd);
}

app.get("/health", (_req, res) => {
  try {
    const stat = fs.statSync(ENV_PATH);
    res.json({ ok: true, envPath: ENV_PATH, mtime: stat.mtime });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message, envPath: ENV_PATH });
  }
});

app.get("/api/movies", (req: Request, res: Response) => {
  const query = String(req.query.q ?? "");
  const description = generateDescription(query, 8);
  const payload = {
    source: "imdb.iamidiotareyoutoo.com",
    query,
    results: { ok: true, error_code: 200, description }
  };

  try {
    upsertMockoonMoviesRoute(payload);
    const stat = fs.statSync(ENV_PATH);
    res.json({ updated: true, envPath: ENV_PATH, envMTime: stat.mtime, payload });
  } catch (e: any) {
    console.error("Failed to update Mockoon env:", e?.message);
    res.status(500).json({ ok: false, error: e?.message, envPath: ENV_PATH });
  }
});

const PORT = Number(process.env.PORT) || 5500;
app.listen(PORT, () => {
  console.log(`🎭 Mock Generator API http://localhost:${PORT}`);
  console.log(`🔧 ENV_PATH -> ${ENV_PATH}`);
});