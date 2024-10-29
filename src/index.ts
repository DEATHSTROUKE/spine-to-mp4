import { ffbinary } from "./handlers/ffbinary";
import { generateImage } from "./handlers/generateImage";

async function main() {
  const buffers = await generateImage();
  await ffbinary(buffers);
}

main();
