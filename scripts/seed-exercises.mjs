// One-off seed script: imports the hasaneyldrm/exercises-dataset (MIT data,
// Gym visual media used under license) into Supabase.
//
// Usage:
//   git clone https://github.com/hasaneyldrm/exercises-dataset /tmp/exercises-dataset
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/seed-exercises.mjs --source /tmp/exercises-dataset
//
// Requires migration 014_exercise_library.sql to have run first.
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const BUCKET = 'exercise-media'
const CONCURRENCY = 8
const ATTRIBUTION = '© Gym visual — https://gymvisual.com/'

const sourceArg = process.argv.indexOf('--source')
const sourceDir = sourceArg !== -1 ? process.argv[sourceArg + 1] : null
if (!sourceDir) {
  console.error('Usage: node scripts/seed-exercises.mjs --source /path/to/exercises-dataset')
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (buckets?.some((b) => b.name === BUCKET)) return
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: '2MB',
  })
  if (error) throw error
  console.log(`Created public bucket "${BUCKET}"`)
}

async function uploadMedia(localRelPath, storagePath, contentType) {
  const fullPath = path.join(sourceDir, localRelPath)
  const bytes = await readFile(fullPath)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, bytes, { contentType, upsert: true, cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
}

async function seedOne(entry) {
  const imageExt = path.extname(entry.image || '') || '.jpg'
  const gifExt = path.extname(entry.gif_url || '') || '.gif'

  const [imageUrl, gifUrl] = await Promise.all([
    entry.image ? uploadMedia(entry.image, `images/${entry.id}${imageExt}`, 'image/jpeg') : null,
    entry.gif_url ? uploadMedia(entry.gif_url, `gifs/${entry.id}${gifExt}`, 'image/gif') : null,
  ])

  const { error } = await supabase.from('exercises').upsert({
    id: entry.id,
    name: entry.name,
    category: entry.category,
    body_part: entry.body_part,
    equipment: entry.equipment,
    target: entry.target ?? null,
    muscle_group: entry.muscle_group ?? null,
    secondary_muscles: entry.secondary_muscles ?? [],
    instructions: entry.instructions?.en ?? null,
    image_url: imageUrl,
    gif_url: gifUrl,
    attribution: ATTRIBUTION,
  })
  if (error) throw error
}

async function runPool(items, worker, concurrency) {
  let cursor = 0
  let done = 0
  async function next() {
    while (cursor < items.length) {
      const item = items[cursor++]
      try {
        await worker(item)
      } catch (err) {
        console.error(`Failed on ${item.id} (${item.name}):`, err.message ?? err)
      }
      done++
      if (done % 50 === 0 || done === items.length) {
        console.log(`${done}/${items.length}`)
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, next))
}

async function main() {
  await ensureBucket()
  const raw = await readFile(path.join(sourceDir, 'data/exercises.json'), 'utf8')
  const exercises = JSON.parse(raw)
  console.log(`Seeding ${exercises.length} exercises...`)
  await runPool(exercises, seedOne, CONCURRENCY)
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
