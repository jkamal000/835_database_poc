import { X12parser, Schema, X12grouper } from "x12-parser";
import { Readable } from "node:stream";

export interface SegmentInfo {
  name: string;
  [key: string]: string;
}

export async function parseX12(readStream: Readable): Promise<void> {
  const parser = new X12parser();
  const headingSchema = new Schema("005010X221A1", {
    start: "ST",
    name: "Heading",
    terminators: ["N1"],
  });
  const grouper = new X12grouper(headingSchema);

  try {
    const ediStream = readStream.pipe(parser).pipe(grouper);
    for await (const data of ediStream) {
      if (data.isGroup && data.name == "Heading") {
        decodeHeading(data);
      }
    }

    console.log("Successfully finished processing the file.");
  } catch (err) {
    console.error("An error occurred during processing:", err);
  }
}

export function decodeHeading(info: { name: string; data: SegmentInfo[] }) {}

export function decode2000(info: { name: string; data: SegmentInfo[] }) {}
