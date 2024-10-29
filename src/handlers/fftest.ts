import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ffmpeg from "fluent-ffmpeg";

export async function fftest() {
  console.info("fftest initialized");

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // const inputFile = path.resolve(__dirname, "./input/ori.gif");
  const inputDirectory = path.resolve(__dirname, "./frames");
  const inputFile = path.resolve(__dirname, "./input/huiOrigin.mp4");
  const outputFile = path.resolve(__dirname, "./output/hui.mp4");

  const inputImageFile = path.resolve(__dirname, "./frames/*.png");
  const outputImageFile = path.resolve(__dirname, "./frames/frame-%04d.png");

  // видео в кадры
  // return new Promise<void>((resolve, reject) => {
  //   ffmpeg()
  //     .input(inputFile)
  //     .outputOption("-framerate 60")
  //     .output(outputImageFile)
  //     .on("start", (cmd) => {
  //       console.info(cmd);
  //     })
  //     .on("end", () => {
  //       console.info("done");
  //       resolve();
  //     })
  //     .on("error", (err) => {
  //       console.error("Error during conversion:", err.message);
  //       reject(err);
  //     })
  //     .run();
  // });

  // кадры в видео
  return new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(inputImageFile)
      .inputOptions(["-framerate 60", "-pattern_type glob"])
      .output(outputFile)
      .on("start", (cmd) => {
        console.info(cmd);
      })
      .on("end", () => {
        console.info("done");
        resolve();
      })
      .on("error", (err) => {
        console.error("Error during conversion:", err.message);
        reject(err);
      })
      .run();
  });
}
