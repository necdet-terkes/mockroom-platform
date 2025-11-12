import express, { Request, Response } from 'express'
import axios from 'axios'
import cors from 'cors'

const app = express()
const PORT = 4001

// ✅ CORS aktif et (React UI erişimi için)
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET'],
}))

/**
 * Example:
 * GET http://localhost:4001/api/movies?q=Lord+Of+The+Rings
 */
app.get('/api/movies', async (req: Request, res: Response) => {
  const query = req.query.q || 'The Matrix'

  try {
    const { data } = await axios.get(
      `https://imdb.iamidiotareyoutoo.com/justwatch?q=${encodeURIComponent(String(query))}`
    )

    res.json({
      source: 'imdb.iamidiotareyoutoo.com',
      query,
      results: data,
    })
  } catch (err: any) {
    console.error('❌ Error fetching movie data:', err.message)
    res.status(500).json({
      error: 'Failed to fetch movie data',
      details: err.message,
    })
  }
})

app.listen(PORT, () =>
  console.log(`🎬 Dummy Product API proxy running at http://localhost:${PORT}`)
)
