import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import { fetchLedBoard } from './led.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT || 8787)
const HOST = process.env.HOST || '0.0.0.0'
// Пароль на весь сайт (кроме /health): задайте SITE_PASSWORD в настройках Render → Environment.
// Логин в окне браузера — любой, проверяется только пароль. Без переменной сайт открыт.
const SITE_PASSWORD = process.env.SITE_PASSWORD || ''

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

function authorized(req) {
  if (!SITE_PASSWORD) return true
  const [scheme, value] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Basic' || !value) return false
  const decoded = Buffer.from(value, 'base64').toString('utf8')
  const pass = Buffer.from(decoded.slice(decoded.indexOf(':') + 1))
  const want = Buffer.from(SITE_PASSWORD)
  return pass.length === want.length && crypto.timingSafeEqual(pass, want)
}

const COMPRESSIBLE = new Set(['.html', '.js', '.css', '.json', '.svg', '.map'])
const gzipCache = new Map()

function sendFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const type = MIME[ext] || 'application/octet-stream'
  const stat = fs.statSync(filePath)
  const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`
  const headers = {
    'Content-Type': type,
    ETag: etag,
    Vary: 'Accept-Encoding',
    // Only Vite's hashed bundles in dist/assets are safe to cache long-term;
    // public/ files (e.g. ops/airline-guides.json) keep the same name across deploys.
    'Cache-Control': filePath.startsWith(path.join(DIST, 'assets'))
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  }
  // no-cache + ETag: браузер перепроверяет файл, но скачивает заново только если он изменился
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers)
    res.end()
    return
  }
  let data = fs.readFileSync(filePath)
  if (COMPRESSIBLE.has(ext) && /gzip/.test(req.headers['accept-encoding'] || '')) {
    const key = filePath + etag
    if (!gzipCache.has(key)) gzipCache.set(key, zlib.gzipSync(data))
    data = gzipCache.get(key)
    headers['Content-Encoding'] = 'gzip'
  }
  res.writeHead(200, headers)
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
    sendFile(req, res, filePath)
    return true
  }

  // SPA fallback for client routes
  if (!pathname.startsWith('/api') && req.method === 'GET') {
    const index = path.join(DIST, 'index.html')
    if (fs.existsSync(index)) {
      sendFile(req, res, index)
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

    if (!authorized(req)) {
      res.writeHead(401, {
        'WWW-Authenticate': 'Basic realm="AeroDesk", charset="UTF-8"',
        'Content-Type': 'text/plain; charset=utf-8',
      })
      res.end('Нужен пароль AeroDesk')
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
