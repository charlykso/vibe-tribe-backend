const express = require('express')
const path = require('path')

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
