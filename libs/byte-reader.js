export const LITTLE_ENDIAN = true;
export const BIG_ENDIAN = false;

const ByteReader = (TypedArray, endianness = LITTLE_ENDIAN) => {
  // "Uint8Array" -> "Uint8"
  const type = TypedArray.name.replace("Array", "");
  const method = `get${type}`;

  /**
   * @param {DataView} view 
   * @param {number} byte_offset 
   */
  const scalar = (view, byte_offset) =>
    view[method]?.(byte_offset, endianness);

  /**
   * @param {DataView} view 
   * @param {number} byte_offset 
   * @param {number} count 
   */
  const vector = (view, byte_offset, count) =>
    new TypedArray(view.buffer, byte_offset, count);

  return { scalar, vector };
};

export const  u8 = ByteReader(Uint8Array);
export const u16 = ByteReader(Uint16Array);
export const u32 = ByteReader(Uint32Array);
export const  i8 = ByteReader(Int8Array);
export const i16 = ByteReader(Int16Array);
export const i32 = ByteReader(Int32Array);
export const f32 = ByteReader(Float32Array);
