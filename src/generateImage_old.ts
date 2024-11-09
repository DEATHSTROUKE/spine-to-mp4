import {
  loadSkeletonData,
  loadTextureAtlas,
  SkeletonDrawable,
  SkeletonRenderer,
} from '@esotericsoftware/spine-canvaskit'
import { loadImage } from '@napi-rs/canvas'
import CanvasKitInit from 'canvaskit-wasm'
import fs from 'fs'
import path from 'path'
import { PNG } from 'pngjs/browser'
import { fileURLToPath } from 'url'

import { ffbinary } from './ffbinary'

const FPS = 60

export const generateImage = async (): Promise<{ status: true }> => {
  const ck = await CanvasKitInit()

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const atlas = await loadTextureAtlas(
    ck,
    __dirname + '/assets/phoenix.atlas',
    async (path) => fs.readFileSync(path)
  )

  const skeletonData = await loadSkeletonData(
    __dirname + '/assets/phoenix.json',
    atlas,
    async (path) => fs.readFileSync(path)
  )

  const drawable = new SkeletonDrawable(skeletonData)
  drawable.skeleton.setSkinByName('legendary')
  drawable.skeleton
  drawable.skeleton.x = 180
  drawable.skeleton.y = 380
  drawable.skeleton.scaleX = 0.3
  drawable.skeleton.scaleY = 0.3
  console.info('drawable.skeleton')
  const attachment = drawable.skeleton.getAttachmentByName(
    'hat_base',
    'hat_base'
  )
  //загрузка одежды
  // Define the function to load the sheep hat attachment

  // Create an instance of AssetManagerBase with the texture loading function

  const imagePath = path.join(__dirname, 'assets', 'sheep_hat.png')
  // Make sure the path is correct
  //const attachment2 = AttachmentLoader().newRegionAttachment
  // Ensure the image is loaded before using it
  const img = await loadImage(imagePath)
  // Define the region for the attachment
  const region = {
    texture: img, // Use the Image directly for the texture
    u: 0,
    v: 0,
    u2: 1,
    v2: 1,
    width: img.width,
    height: img.height,
    degrees: 0,
    offsetX: 0,
    offsetY: 0,
    originalWidth: img.width,
    originalHeight: img.height,
  }

  // const attachment = new RegionAttachment(
  //   'hat_base',
  //   __dirname + '/assets/sheep_hat.png',
  // )
  // attachment.region = region
  // console.info('attac', attachment.region) // Find the bone and set the attachment

  // // Update the skeleton to reflect changes
  // drawable.skeleton.updateWorldTransform(2)

  // const animationState = drawable.animationState
  //animationState.setAnimation(0, 'idle', true)

  const surface = ck.MakeSurface(700, 700)
  if (!surface) throw new Error()

  const renderer = new SkeletonRenderer(ck)

  const animationDuration = skeletonData.findAnimation('idle')?.duration ?? 0
  const FRAME_TIME = 1 / FPS
  let deltaTime = 0
  const frames = []
  const imageInfo = {
    width: 400,
    height: 400,
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

  // const outputDirectory = path.resolve(__dirname, "./photos");

  // await saveImagesFromBufferArray(buffers, outputDirectory);

  console.info('buffer len', buffers.length)

  const arrPngBuffers: Buffer[] = await Promise.all(
    buffers.map((buf) => {
      return new Promise<Buffer>((resolve) => {
        const png = new PNG({
          width: 400,
          height: 400,
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
