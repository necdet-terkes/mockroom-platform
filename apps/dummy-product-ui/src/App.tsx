import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api";
const API_MODE = (import.meta.env.VITE_API_MODE || "real").toLowerCase();

const MOCK_GENERATOR_BASE_URL =
  import.meta.env.VITE_MOCK_GENERATOR_BASE_URL || "http://localhost:5500";

interface Movie {
  title: string;
  year: number;
  photo_url?: string[] | string;
  url?: string;
}

/**
 * Normalizes the payload regardless of whether it comes from the real API, the mock API, or Mockoon.
 */
function normalizeResults(data: unknown): Movie[] {
  const payload = (data ?? {}) as {
    description?: Movie[];
    results?: Movie[] | { description?: Movie[] | undefined } | undefined;
  };

  if (Array.isArray(payload.description)) {
    return payload.description;
  }

  if (
    payload.results &&
    !Array.isArray(payload.results) &&
    typeof payload.results === "object" &&
    payload.results !== null &&
    Array.isArray(payload.results.description)
  ) {
    return payload.results.description;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  return [];
}

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [mockAvailable, setMockAvailable] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) {
      setMovies([]);
      return;
    }

    setMovies([]);
    setLoading(true);

    try {
      const params: Record<string, string | number> = { q };
      if (API_MODE !== "mock") {
        params._ts = Date.now(); // Avoid cached responses for real API calls
      }

      const { data } = await axios.get(`${API_BASE_URL}/movies`, {
        params,
        headers:
          API_MODE === "mock"
            ? {}
            : {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
      });

      const results = normalizeResults(data);
      setMovies([...results]);

      console.log(`✅ Data fetched from ${API_MODE.toUpperCase()} API`, {
        q,
        count: results.length,
      });
    } catch (err) {
      console.error("❌ Error fetching movies:", err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (API_MODE !== "mock") {
      setMockAvailable(false);
      return;
    }

    const checkHealth = async () => {
      try {
        await axios.get(`${MOCK_GENERATOR_BASE_URL}/health`, {
          params: { _ts: Date.now() },
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        setMockAvailable(true);
      } catch {
        setMockAvailable(false);
      }
    };

    checkHealth();
  }, []);

  const handleGenerateMockData = async () => {
    const raw = query.trim();
    const q = raw || "dynamic";

    try {
      console.log("🎭 Calling mock-generator-api with q =", q);
      await axios.get(`${MOCK_GENERATOR_BASE_URL}/api/movies`, {
        params: {
          q,
          _ts: Date.now(),
        },
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      console.log("✅ mock-generator-api call completed");
    } catch (err) {
      console.error("❌ mock-generator-api call failed:", err);
    }
  };

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        backgroundColor: "#1b1b1b",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      <h1>🎬 Dummy Product UI</h1>

      <div style={{ marginBottom: "0.5rem" }}>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#bbb",
            display: "inline-block",
            marginRight: "1rem",
          }}
        >
          Data source: <strong>{API_MODE.toUpperCase()}</strong>
        </p>

        {API_MODE === "mock" && mockAvailable && (
          <button
            onClick={handleGenerateMockData}
            style={{
              padding: "0.3rem 0.8rem",
              backgroundColor: "#f39c12",
              border: "none",
              borderRadius: "4px",
              color: "#1b1b1b",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            🎭 Generate Mock Data
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <input
          type="text"
          placeholder="Search for a movie..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            padding: "0.5rem",
            width: "300px",
            backgroundColor: "#2c2c2c",
            border: "1px solid #555",
            color: "#fff",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: loading ? "#444" : "#4ea1ff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        {movies.map((movie, index) => {
          const imageUrl = Array.isArray(movie.photo_url)
            ? movie.photo_url[0]
            : movie.photo_url;

          return (
            <div
              key={`${movie.title}-${movie.year}-${index}`}
              style={{
                border: "1px solid #333",
                padding: "1rem",
                borderRadius: "8px",
                background: "#222",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(0,0,0,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow =
                  "0 2px 8px rgba(0,0,0,0.3)";
              }}
            >
              <img
                src={
                  imageUrl ||
                  "https://via.placeholder.com/200x300?text=No+Image"
                }
                alt={movie.title}
                style={{
                  width: "100%",
                  borderRadius: "6px",
                  marginBottom: "0.5rem",
                }}
              />
              <h3
                style={{
                  fontSize: "1rem",
                  marginBottom: "0.25rem",
                  color: "#fff",
                }}
              >
                {movie.title}
              </h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#bbb" }}>
                {movie.year}
              </p>
              {movie.url && (
                <a
                  href={movie.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "0.5rem",
                    color: "#4ea1ff",
                    textDecoration: "none",
                  }}
                >
                  🔗 View
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
