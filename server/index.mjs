import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchLedBoard } from './led.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 8787)
const HOST = process.env.HOST || '0.0.0.0'

let cache = null
let cacheAt = 0
const TTL_MS = 45_000

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

async function getBoard() {
  const now = Date.now()
  if (cache && now - cacheAt < TTL_MS) return cache
  cache = await fetchLedBoard({ when: '0' })
  cacheAt = now
  return cache
}

function sendJson(res, status, body) {
  const raw = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  })
  res.end(raw)
}

function safeJoin(base, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0])
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '')
  const full = path.join(base, cleaned)
  if (!full.startsWith(base)) return null
  return full
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const type = MIME[ext] || 'application/octet-stream'
  const data = fs.readFileSync(filePath)
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400',
  })
  res.end(data)
}

function tryStatic(req, res, pathname) {
  if (!fs.existsSync(DIST)) return false

  let filePath = safeJoin(DIST, pathname === '/' ? '/index.html' : pathname)
  if (!filePath) return false

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html')
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(res, filePath)
    return true
  }

  // SPA fallback for client routes
  if (!pathname.startsWith('/api') && req.method === 'GET') {
    const index = path.join(DIST, 'index.html')
    if (fs.existsSync(index)) {
      sendFile(res, index)
      return true
    }
  }
  return false
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {})
      return
    }

    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`)

    if (url.pathname === '/health') {
      sendJson(res, 200, { status: 'ok', service: 'aerodesk' })
      return
    }

    if (url.pathname === '/api/v1/flights' && req.method === 'GET') {
      const board = await getBoard()
      const q = (url.searchParams.get('q') || '').trim().toLowerCase().replace(/\s+/g, '')
      const airline = (url.searchParams.get('airline') || '').trim().toUpperCase()
      let flights = board.flights
      if (airline) {
        if (airline === 'SU') {
          flights = flights.filter((f) => f.airline.code === 'SU' || f.airline.code === 'FV')
        } else {
          flights = flights.filter((f) => f.airline.code === airline)
        }
      }
      if (q) {
        flights = flights.filter((f) => {
          const num = f.flightNumber.toLowerCase().replace(/\s+/g, '')
          return (
            num.includes(q) ||
            f.airline.code.toLowerCase() === q ||
            f.route.from.code.toLowerCase().includes(q) ||
            f.route.to.code.toLowerCase().includes(q) ||
            f.route.from.cityRu.toLowerCase().includes(q) ||
            f.route.to.cityRu.toLowerCase().includes(q)
          )
        })
      }
      sendJson(res, 200, {
        flights,
        airlines: board.airlines,
        source: board.source,
        airport: board.airport,
        updatedAt: board.updatedAt,
        count: flights.length,
        live: true,
      })
      return
    }

    if (url.pathname.startsWith('/api/v1/flights/') && req.method === 'GET') {
      const id = decodeURIComponent(url.pathname.slice('/api/v1/flights/'.length))
      const board = await getBoard()
      const flight = board.flights.find((f) => f.id === id)
      if (!flight) {
        sendJson(res, 404, { error: 'Flight not found' })
        return
      }
      sendJson(res, 200, flight)
      return
    }

    if (tryStatic(req, res, url.pathname)) return

    sendJson(res, 404, { error: 'Not found' })
  } catch (err) {
    console.error('[aerodesk]', err)
    sendJson(res, 502, { error: 'Upstream board failed', detail: String(err?.message || err) })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`AeroDesk http://${HOST}:${PORT}`)
})
