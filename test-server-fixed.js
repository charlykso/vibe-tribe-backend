import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 8082 // Different port to avoid conflicts

// Serve static files from current directory
app.use(express.static(__dirname))

// Serve the test page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-twitter-oauth.html'))
})

app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`)
  console.log(`📄 Test page: http://localhost:${PORT}/test-twitter-oauth.html`)
})
