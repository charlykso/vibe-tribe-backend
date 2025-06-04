#!/usr/bin/env node

import { spawn, exec } from 'child_process'
import net from 'net'

const TARGET_PORT = 3001
const BACKEND_SCRIPT = 'simple-backend.cjs'

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer()

    server.listen(port, () => {
      server.once('close', () => {
        resolve(true)
      })
      server.close()
    })

    server.on('error', () => {
      resolve(false)
    })
  })
}

/**
 * Find processes using a specific port (Windows)
 */
function findProcessOnPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error || !stdout) {
        resolve([])
        return
      }

      const lines = stdout.split('\n').filter((line) => line.trim())
      const pids = lines
        .map((line) => {
          const parts = line.trim().split(/\s+/)
          return parts[parts.length - 1]
        })
        .filter((pid) => pid && pid !== '0')
        .filter((pid, index, arr) => arr.indexOf(pid) === index) // unique

      resolve(pids)
    })
  })
}

/**
 * Kill processes by PID
 */
function killProcesses(pids) {
  return Promise.all(
    pids.map((pid) => {
      return new Promise((resolve) => {
        exec(`taskkill //F //PID ${pid}`, (error) => {
          if (error) {
            console.log(`⚠️  Could not kill process ${pid}: ${error.message}`)
          } else {
            console.log(`✅ Killed process ${pid}`)
          }
          resolve()
        })
      })
    })
  )
}

/**
 * Start the backend server
 */
function startBackend() {
  console.log(`🚀 Starting VibeTribe Backend on port ${TARGET_PORT}...`)

  const backend = spawn('node', [BACKEND_SCRIPT], {
    stdio: 'inherit',
    env: { ...process.env, PORT: TARGET_PORT },
  })

  backend.on('error', (err) => {
    console.error('❌ Failed to start backend:', err)
    process.exit(1)
  })

  backend.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Backend exited with code ${code}`)
      process.exit(code)
    }
  })

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down backend...')
    backend.kill('SIGINT')
  })

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down backend...')
    backend.kill('SIGTERM')
  })
}

/**
 * Main function
 */
async function main() {
  console.log(`🔍 Checking if port ${TARGET_PORT} is available...`)

  const available = await isPortAvailable(TARGET_PORT)

  if (available) {
    console.log(`✅ Port ${TARGET_PORT} is available`)
    startBackend()
    return
  }

  console.log(`⚠️  Port ${TARGET_PORT} is in use`)
  console.log(`🔍 Finding processes using port ${TARGET_PORT}...`)

  const pids = await findProcessOnPort(TARGET_PORT)

  if (pids.length === 0) {
    console.log(`❌ Could not find processes using port ${TARGET_PORT}`)
    console.log(`💡 Please manually free port ${TARGET_PORT} and try again`)
    process.exit(1)
  }

  console.log(
    `📋 Found ${pids.length} process(es) using port ${TARGET_PORT}: ${pids.join(
      ', '
    )}`
  )
  console.log(`🔄 Attempting to kill conflicting processes...`)

  await killProcesses(pids)

  // Wait a moment for processes to fully terminate
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Check if port is now available
  const nowAvailable = await isPortAvailable(TARGET_PORT)

  if (!nowAvailable) {
    console.log(
      `❌ Port ${TARGET_PORT} is still in use after killing processes`
    )
    console.log(`💡 Please manually free port ${TARGET_PORT} and try again`)
    process.exit(1)
  }

  console.log(`✅ Port ${TARGET_PORT} is now available`)
  startBackend()
}

// Run the main function
main().catch((error) => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})
