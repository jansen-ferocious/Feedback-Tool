import * as esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function build() {
  try {
    // Build the widget
    await esbuild.build({
      entryPoints: [path.join(__dirname, 'widget.js')],
      bundle: true,
      minify: true,
      outfile: path.join(__dirname, '..', 'public', 'widget.min.js'),
      format: 'iife',
      target: ['es2015'],
    })

    console.log('Widget built successfully: public/widget.min.js')

    // Get file size
    const stats = fs.statSync(path.join(__dirname, '..', 'public', 'widget.min.js'))
    console.log(`Bundle size: ${(stats.size / 1024).toFixed(2)} KB`)

  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

build()
