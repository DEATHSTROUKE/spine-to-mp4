import {
  loadSkeletonData,
  loadTextureAtlas,
  RegionAttachment,
  SkeletonDrawable,
  SkeletonRenderer,
} from '@esotericsoftware/spine-canvaskit'

import CanvasKitInit, { CanvasKit } from 'canvaskit-wasm'
import fs from 'fs'
import path from 'path'
import { PNG } from 'pngjs/browser'
import { fileURLToPath } from 'url'

import { ffbinary } from './ffbinary'

const FPS = 60

export const loadSingleTexture = async (ck: CanvasKit, assetPath: string) => {
  const fakeAtlasPath = path.join(path.dirname(assetPath), 'fake.atlas')

  const clothesAtlas = await loadTextureAtlas(
    ck,
    fakeAtlasPath,
    async (path) => {
      console.info(path)

      if (path.endsWith('atlas')) {
        // TODO: необходимо считать из файла размер изображения и подставить в данный файл
        const atlas =
          'sheep_hat.png\nsize: 300,300\nformat: RGBA8888\nfilter: Linear,Linear\nbase\n  size: 300, 300'
        return Buffer.from(atlas, 'utf8')
      }
      return fs.readFileSync(path)
    }
  )
  return clothesAtlas
}

export const generateImage = async (): Promise<{ status: true }> => {
  const ck = await CanvasKitInit()

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const atlas = await loadTextureAtlas(
    ck,
    __dirname + '/assets/phoenix.atlas',
    async (path) => fs.readFileSync(path)
  )

  const clothesPath = path.join(__dirname, 'assets', 'clothes.atlas')
  const clothesTexture = await loadSingleTexture(ck, clothesPath)

  const skeletonData = await loadSkeletonData(
    __dirname + '/assets/phoenix.json',
    atlas,
    async (path) => fs.readFileSync(path)
  )

  const drawable = new SkeletonDrawable(skeletonData)
  drawable.skeleton.setSkinByName('legendary')
  drawable.skeleton.x = 230
  drawable.skeleton.y = 450
  drawable.skeleton.scaleX = drawable.skeleton.scaleY = 0.5

  const hatBaseSlot = drawable.skeleton.findSlot('hat_base')
  drawable.skeleton.setSkinByName('legendary')

  if (hatBaseSlot) {
    let newHeadAttachment = hatBaseSlot?.getAttachment()?.copy()
    // @ts-ignore
    newHeadAttachment.region = clothesTexture.regions[0]
    // @ts-ignore
    newHeadAttachment?.updateRegion()
    // @ts-ignore
    hatBaseSlot.setAttachment(newHeadAttachment)
  }

  const animationState = drawable.animationState
  animationState.setAnimation(0, 'idle', true)

  const surface = ck.MakeSurface(500, 500)
  if (!surface) throw new Error()

  const renderer = new SkeletonRenderer(ck)

  const animationDuration = skeletonData.findAnimation('idle')?.duration ?? 0
  const FRAME_TIME = 1 / FPS
  let deltaTime = 0
  const frames = []
  const imageInfo = {
    width: 500,
    height: 500,
    colorType: ck.ColorType.RGBA_8888,
    alphaType: ck.AlphaType.Unpremul,
    colorSpace: ck.ColorSpace.SRGB,
  }
  const pixelArray = ck.Malloc(
    Uint8Array,
    imageInfo.width * imageInfo.height * 4
  )

  for (let time = 0; time <= animationDuration; time += deltaTime) {
    const canvas = surface.getCanvas()
    canvas.clear(ck.WHITE)
    drawable.update(deltaTime)
    renderer.render(canvas, drawable)
    canvas.readPixels(0, 0, imageInfo, pixelArray)
    frames.push(new Uint8Array(pixelArray.toTypedArray()).buffer.slice(0))
    deltaTime = FRAME_TIME
  }

  if (frames.length === 0) {
    throw new Error('No frames generated.')
  }

  console.info('frames length', frames.length)

  const buffers = frames.map((frame) => {
    return Buffer.from(frame)
  })

  // TODO: для теста
  const png = new PNG({
    width: 500,
    height: 500,
    colorType: 6,
    inputColorType: 6,
    inputHasAlpha: true,
  })

  png.data = buffers[0]

  const chunks: Uint8Array[] = []
  png
    .pack()
    .on('data', (chunk: Buffer) => {
      chunks.push(new Uint8Array(chunk))
    })
    .on('end', () => {
      const pngBuffer = Buffer.concat(chunks)
      const outputFile = path.resolve(__dirname, './output/image.png')

      fs.writeFileSync(outputFile, pngBuffer)
    })

  // const outputDirectory = path.resolve(__dirname, "./photos");

  // await saveImagesFromBufferArray(buffers, outputDirectory);

  console.info('buffer len', buffers.length)

  const arrPngBuffers: Buffer[] = await Promise.all(
    buffers.map((buf) => {
      return new Promise<Buffer>((resolve) => {
        const png = new PNG({
          width: 500,
          height: 500,
          colorType: 6,
          inputColorType: 6,
          inputHasAlpha: true,
        })

        png.data = buf

        const chunks: Uint8Array[] = []
        png
          .pack()
          .on('data', (chunk: Buffer) => {
            chunks.push(new Uint8Array(chunk))
          })
          .on('end', () => {
            const pngBuffer = Buffer.concat(chunks)
            resolve(pngBuffer)
          })
      })
    })
  )

  await ffbinary(arrPngBuffers)
  return { status: true }
}
