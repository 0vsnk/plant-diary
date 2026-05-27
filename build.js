#!/usr/bin/env node
/**
 * Build script: inlines CSS + JS + bg_image into a single standalone.html
 */
const fs = require('fs')
const path = require('path')

const BASE = __dirname

const css     = fs.readFileSync(path.join(BASE, 'css/style.css'), 'utf8')
const js      = fs.readFileSync(path.join(BASE, 'js/app.js'), 'utf8')
const htmlSrc = fs.readFileSync(path.join(BASE, 'index.html'), 'utf8')
const bgImg   = fs.readFileSync(path.join(BASE, 'img/bg_image.png'))
const bgB64   = bgImg.toString('base64')

// Replace external CSS link with inline style block
let html = htmlSrc.replace(
  '<link rel="stylesheet" href="css/style.css">',
  `<style>\n${css.replace(/url\('\.\.\/img\/bg_image\.png'\)/g, `url('data:image/png;base64,${bgB64}')`)}\n</style>`
)

// Replace external JS with inline script
html = html.replace(
  '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>\n<script src="js/app.js"></script>',
  `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>\n<script>\n${js}\n</script>`
)

// Write standalone.html (local dev convenience)
fs.writeFileSync(path.join(BASE, 'standalone.html'), html, 'utf8')

// Write public/index.html (Vercel deployment target)
const publicDir = path.join(BASE, 'public')
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir)
fs.writeFileSync(path.join(publicDir, 'index.html'), html, 'utf8')

const size = fs.statSync(path.join(BASE, 'standalone.html')).size
console.log(`✅ standalone.html + public/index.html rebuilt — ${(size/1024).toFixed(1)} KB`)
