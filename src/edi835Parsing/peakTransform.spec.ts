import { Readable } from "stream";
import { PeekTransform } from "./peakTransform";
import { X12parser } from "x12-parser";
import { expect } from "chai";

describe("Peak Transform", () => {
  it("should allow peaking of first N bytes", async () => {
    const edi =
      "ISA*00*          *00*          *ZZ*a       *ZZ*a       *190827*0212*^*00501*191511902*0*P*:~" +
      "GS*HP*ABCD*ABCD*20190827*12345678*12345678*X*005010X221A1~" +
      "ST*835*35681~";

    const readableStream = Readable.from(edi);
    const peakStream = new PeekTransform(4);
    let peakedChar: string | undefined;

    peakStream.on("peek", (buffer: Buffer) => {
      peakedChar = buffer.toString("utf-8")[3];
    });

    const parser = new X12parser();

    const ediStream = readableStream.pipe(peakStream).pipe(parser);
    let isa = false;

    for await (const data of ediStream) {
      if (data.name == "ISA") isa = true;
    }

    expect(isa).to.be.true;

    expect(peakedChar).equals("*");
  });

  it("should push peak if buffer too long", async () => {
    const edi = "ISA";

    const readableStream = Readable.from(edi);
    const peakStream = new PeekTransform(4);
    let str: string | undefined;

    peakStream.on("peek", (buffer: Buffer) => {
      str = buffer.toString("utf-8");
    });

    const ediStream = readableStream.pipe(peakStream);

    for await (const _ of ediStream) {
    }
    expect(str).equals("ISA");
  });
});
