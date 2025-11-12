import { useState } from 'react'
import axios from 'axios'

interface Movie {
  title: string
  year: number
  photo_url?: string[]
  url?: string
}

export default function App() {
  const [query, setQuery] = useState('')
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const { data } = await axios.get(`http://localhost:4001/api/movies?q=${encodeURIComponent(query)}`)
      setMovies(data.results.description || [])
    } catch (err) {
      console.error('Error fetching movies:', err)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🎬 Dummy Product UI</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search for a movie..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ padding: '0.5rem', width: '300px' }}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {movies.map(movie => (
          <div key={movie.title} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
            <img
              src={movie.photo_url?.[0] || 'https://via.placeholder.com/200x300?text=No+Image'}
              alt={movie.title}
              style={{ width: '100%', borderRadius: '6px' }}
            />
            <h3>{movie.title}</h3>
            <p>{movie.year}</p>
            {movie.url && (
              <a href={movie.url} target="_blank" rel="noreferrer">
                🔗 View
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
