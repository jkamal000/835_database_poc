import { Transform } from "stream";

// PeekTransform buffers the first N bytes but passes everything through
export class PeekTransform extends Transform {
  private buffer: Buffer = Buffer.alloc(0);
  private readonly peekBytes: number;
  private peeked = false;

  constructor(peekBytes: number) {
    super();
    this.peekBytes = peekBytes;
  }

  _transform(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
    if (!this.peeked) {
      const combined = Buffer.concat([this.buffer, chunk]);
      if (combined.length >= this.peekBytes) {
        this.buffer = combined.subarray(0, this.peekBytes);
        this.peeked = true;

        // emit an event once we have the peeked bytes
        this.emit("peek", this.buffer);

        // push the entire combined buffer downstream
        this.push(combined);
        return callback();
      } else {
        this.buffer = combined;
        // don’t push anything yet, wait until we have enough to peek
        return callback();
      }
    }

    // after peeking, just pass data through
    this.push(chunk);
    callback();
  }

  _flush(callback: Function) {
    // If stream ended before we got peekBytes
    if (!this.peeked && this.buffer.length > 0) {
      this.emit("peek", this.buffer);
      this.push(this.buffer);
    }
    callback();
  }
}
