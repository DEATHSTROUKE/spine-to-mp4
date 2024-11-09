import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ffmpeg from 'fluent-ffmpeg'
import { Readable } from 'stream'

async function createVideoFromImages(imageBuffers: Buffer[], output: string) {
  return new Promise<void>((resolve, reject) => {
    const dataStream = Readable.from(imageBuffers)

    ffmpeg()
      .input(dataStream)
      .inputFormat('image2pipe')
      .videoCodec('libx264')
      .inputOption(['-pix_fmt yuv420p', '-framerate 40']) // Устанавливаем частоту кадров
      .format('mp4')
      .save(output)
      .on('end', () => {
        console.info('Видео успешно создано!')
        resolve()
      })
      .on('error', (err) => {
        console.error('Произошла ошибка при создании видео:', err)
        reject(err)
      })
  })
}

async function createGifFromImages(imageBuffers: Buffer[], output: string) {
  return new Promise<void>((resolve, reject) => {
    const dataStream = Readable.from(imageBuffers)
    const framerate = 10
    ffmpeg()
      .input(dataStream)
      .inputFormat('image2pipe')
      .outputOptions([
        `-framerate ${framerate}`,
        '-pix_fmt yuv420p', // Устанавливаем частоту кадров // Формат вывода GIF
      ])
      .format('gif')
      .save(output)
      .on('end', () => {
        console.info('GIF успешно создан!')
        resolve()
      })
      .on('error', (err) => {
        console.error('Произошла ошибка при создании GIF:', err)
        reject(err)
      })
  })
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function ffbinary(_buffers: Buffer[]) {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const outputFile = path.resolve(__dirname, './output/piu.mp4')
  const outputFile2 = path.resolve(__dirname, './output/piu.gif')

  const imageBuffers = _buffers //await loadImagesFromFolder(inputDirectory)
  await createVideoFromImages(imageBuffers, outputFile)
  await createGifFromImages(imageBuffers, outputFile2)
}

async function loadImagesFromFolder(folderPath: string) {
  const files = await fs.readdirSync(folderPath)
  const imageBuffers: Buffer[] = []

  for (const file of files) {
    const filePath = path.join(folderPath, file)
    const fileBuffer = fs.readFileSync(filePath)
    imageBuffers.push(fileBuffer)
  }

  return imageBuffers
}
