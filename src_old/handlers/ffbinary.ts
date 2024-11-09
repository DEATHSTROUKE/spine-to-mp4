import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";

async function createVideoFromImages(imageBuffers: Buffer[], output: string) {
  return new Promise<void>((resolve, reject) => {
    // Передаем каждый Buffer как входной поток в FFmpeg
    // imageBuffers.forEach((buffer) => {
    //   //@ts-ignore
    //   ffmpegCommand.input(buffer);
    // });

    const dataStream = Readable.from(imageBuffers);

    // видео из
    ffmpeg()
      .input(dataStream)
      .inputFormat("image2pipe")
      .videoCodec("libx264")
      .inputOption(["-pix_fmt yuv420p", "-framerate 60"]) // Устанавливаем частоту кадров
      .format("mp4")
      .save(output)
      .on("end", () => {
        console.log("Видео успешно создано!");
        resolve();
      })
      .on("error", (err) => {
        console.error("Произошла ошибка при создании видео:", err);
        reject(err);
      });
  });
}

export async function ffbinary(buffers: Buffer[]) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const inputDirectory = path.resolve(__dirname, "./photos");
  const inputFile = path.resolve(__dirname, "./input/huiOrigin.mp4");
  const outputFile = path.resolve(__dirname, "./output/hui.mp4");

  const imageBuffers = await loadImagesFromFolder(inputDirectory);
  await createVideoFromImages(imageBuffers, outputFile);
}

async function loadImagesFromFolder(folderPath: string) {
  const files = await fs.readdirSync(folderPath);
  const imageBuffers: Buffer[] = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const fileBuffer = fs.readFileSync(filePath);
    imageBuffers.push(fileBuffer);
  }

  return imageBuffers;
}
