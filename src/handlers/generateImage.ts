import {
  loadSkeletonData,
  loadTextureAtlas,
  SkeletonDrawable,
  SkeletonRenderer,
  Skin,
} from "@esotericsoftware/spine-canvaskit";
import CanvasKitInit from "canvaskit-wasm";
import path, { resolve } from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs/browser";

import fs from "fs";

const FPS = 60;

export const generateImage = async (): Promise<Buffer[]> => {
  const ck = await CanvasKitInit();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const atlas = await loadTextureAtlas(
    ck,
    __dirname + "/assets/axolotl.atlas",
    async (path) => fs.readFileSync(path)
  );

  const skeletonData = await loadSkeletonData(
    __dirname + "/assets/axolotl.json",
    atlas,
    async (path) => fs.readFileSync(path)
  );

  const drawable = new SkeletonDrawable(skeletonData);
  drawable.skeleton.setSkinByName("rare");
  drawable.skeleton.x = 150;
  drawable.skeleton.y = 300;
  drawable.skeleton.scaleX = drawable.skeleton.scaleY = 0.5;

  const animationState = drawable.animationState;
  animationState.setAnimation(0, "idle", true);

  const surface = ck.MakeSurface(500, 500);
  if (!surface) throw new Error();

  const renderer = new SkeletonRenderer(ck);

  const animationDuration = skeletonData.findAnimation("idle")?.duration ?? 0;
  const FRAME_TIME = 1 / FPS;
  let deltaTime = 0;
  const frames = [];
  const imageInfo = {
    width: 350,
    height: 350,
    colorType: ck.ColorType.RGBA_8888,
    alphaType: ck.AlphaType.Unpremul,
    colorSpace: ck.ColorSpace.SRGB,
  };
  const pixelArray = ck.Malloc(
    Uint8Array,
    imageInfo.width * imageInfo.height * 4
  );

  for (let time = 0; time <= animationDuration; time += deltaTime) {
    const canvas = surface.getCanvas();
    canvas.clear(ck.WHITE);
    drawable.update(deltaTime);
    renderer.render(canvas, drawable);
    canvas.readPixels(0, 0, imageInfo, pixelArray);
    frames.push(new Uint8Array(pixelArray.toTypedArray()).buffer.slice(0));
    deltaTime = FRAME_TIME;
  }

  if (frames.length === 0) {
    throw new Error("No frames generated.");
  }

  console.info("frames length", frames.length);

  const buffers = frames.map((frame) => {
    return Buffer.from(frame);
  });

  // const outputDirectory = path.resolve(__dirname, "./photos");

  // await saveImagesFromBufferArray(buffers, outputDirectory);

  console.info("buffer len", buffers.length);

  await Promise.all(
    buffers.map((buf, index) => {
      return new Promise<void>((resolve) => {
        const png = new PNG({
          width: 350,
          height: 350,
          colorType: 6,
          inputColorType: 6,
          inputHasAlpha: true,
        });

        png.data = buf;

        png
          .pack()
          .pipe(
            fs.createWriteStream(
              path.resolve(__dirname, `./photos/image-${index}.png`)
            )
          )
          .on("close", () => resolve());
      });
    })
  );

  return buffers;
};

async function saveImagesFromBufferArray(
  bufferArray: Buffer[],
  folderPath: string
) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  bufferArray.forEach((buffer, index) => {
    const fileName = `image_${index + 1}.png`;
    const filePath = path.join(folderPath, fileName);

    fs.writeFileSync(filePath, buffer);
    console.log(`Image saved as ${filePath}`);
  });
}
