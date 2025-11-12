import { useState } from "react";
import axios from "axios";

// 🌍 Environment config
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api";
const API_MODE = import.meta.env.VITE_API_MODE || "real";

interface Movie {
  title: string;
  year: number;
  photo_url?: string[];
  url?: string;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

const handleSearch = async () => {
  if (!query.trim()) return;
  setLoading(true);
  try {
    const { data } = await axios.get(`${API_BASE_URL}/movies?q=${encodeURIComponent(query)}`);

    // 🔧 Tüm olasılıkları kapsayalım:
    let results = [];
    if (Array.isArray(data.description)) {
      results = data.description; // 🔹 Mockoon direkt description döner
    } else if (data.results?.description) {
      results = data.results.description; // 🔹 Generator proxy varsa
    } else if (Array.isArray(data.results)) {
      results = data.results;
    }

    setMovies(results);
    console.log(`✅ Data fetched from ${API_MODE.toUpperCase()} API`);
  } catch (err) {
    console.error("❌ Error fetching movies:", err);
    setMovies([]);
  } finally {
    setLoading(false);
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
      <p style={{ fontSize: "0.9rem", color: "#bbb" }}>
        Data source: <strong>{API_MODE.toUpperCase()}</strong>
      </p>

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
        {movies.map((movie) => {
          // 🔧 photo_url hem string hem array olabileceği için normalize ediyoruz
          const imageUrl = Array.isArray(movie.photo_url)
            ? movie.photo_url[0]
            : movie.photo_url;

          return (
            <div
              key={movie.title}
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
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
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
