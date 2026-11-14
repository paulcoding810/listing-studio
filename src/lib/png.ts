const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i)
  out.set(data, 8)
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)))
  return out
}

async function zlib(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('deflate'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export function rgbScanlines(rgba: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const row = width * 3 + 1
  const raw = new Uint8Array(row * height)
  for (let y = 0; y < height; y++) {
    raw[y * row] = 0
    for (let x = 0; x < width; x++) {
      const s = (y * width + x) * 4
      const d = y * row + 1 + x * 3
      raw[d] = rgba[s]
      raw[d + 1] = rgba[s + 1]
      raw[d + 2] = rgba[s + 2]
    }
  }
  return raw
}

/** Encodes an opaque canvas as a 24-bit PNG with no alpha channel. */
export async function encodeRgbPng(canvas: HTMLCanvasElement): Promise<Blob> {
  const { width, height } = canvas
  const rgba = canvas.getContext('2d')!.getImageData(0, 0, width, height).data
  const ihdr = new Uint8Array(13)
  const v = new DataView(ihdr.buffer)
  v.setUint32(0, width)
  v.setUint32(4, height)
  ihdr.set([8, 2, 0, 0, 0], 8)
  const idat = await zlib(rgbScanlines(rgba, width, height))
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
  return new Blob([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', new Uint8Array())] as BlobPart[], { type: 'image/png' })
}
