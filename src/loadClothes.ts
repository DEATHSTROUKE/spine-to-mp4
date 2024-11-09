import fs from 'fs'
import { PNG } from 'pngjs'
export const loadImageData = (imagePath: string): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        reject(new Error(`Failed to load image data from path: ${imagePath}`))
        return
      }

      try {
        const png = PNG.sync.read(data) // Read the PNG data
        const { data: rgba } = png // Get the pixel data

        // Check if the image is in the expected format
        if (png.width === 0 || png.height === 0) {
          reject(new Error(`Invalid image dimensions for: ${imagePath}`))
          return
        }
        const arrayBuffer = new Uint8Array(
          rgba.buffer,
          rgba.byteOffset,
          rgba.byteLength
        )

        resolve(arrayBuffer) // Return the pixel data (RGBA)
      } catch (parseError) {
        reject(new Error(`Failed to parse image data: ${parseError}`))
      }
    })
  })
}
