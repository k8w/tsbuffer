import { TSBufferProtoGenerator } from "tsbuffer-proto-generator"

let generator = new TSBufferProtoGenerator()

generator.generate("proto.ts").then(v => {
  console.log(JSON.stringify(v, null, 2))
})
