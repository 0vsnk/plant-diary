const http = require('http')
const fs = require('fs')
const path = require('path')

const BASE = __dirname
const PORT = 3456
const TYPES = {
  html: 'text/html; charset=utf-8',
  css: 'text/css',
  js: 'application/javascript',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  json: 'application/json',
}

http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0]
  const filePath = path.join(BASE, urlPath === '/' ? 'index.html' : urlPath)
  const ext = path.extname(filePath).slice(1)
  const ct = TYPES[ext] || 'text/plain'

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': ct })
    res.end(data)
  })
}).listen(PORT, () => console.log(`Plant Diary server running on http://localhost:${PORT}`))
