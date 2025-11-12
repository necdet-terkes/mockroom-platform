import express from 'express'
import fs from 'fs-extra'
import { execSync } from 'child_process'

const app = express()
app.use(express.json())

const ENV_PATH = './apps/mockoon-server/environment.json'

app.post('/mocks', async (req, res) => {
  const mock = req.body
  try {
    const env = await fs.readJSON(ENV_PATH)
    env.routes.push(mock)
    await fs.writeJSON(ENV_PATH, env, { spaces: 2 })
    execSync('pnpm --filter mockoon-server start', { stdio: 'inherit' })
    res.status(201).json({ success: true, added: mock.endpoint })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update Mockoon environment', details: String(err) })
  }
})

app.listen(4004, () => console.log('⚙️ Mock Generator API running on http://localhost:4004'))
