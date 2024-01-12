export const LITTLE_ENDIAN = true;
export const BIG_ENDIAN = false;

const ByteWriter = (TypedArray, endianness = LITTLE_ENDIAN) => {
  const name = TypedArray.name.replace("Array", "");
  const BYTES_PER_ELEMENT = TypedArray.BYTES_PER_ELEMENT;

  const setData = `set${name}`;

  /**
   * @param {DataView} view 
   * @param {number} data 
   * @param {number} offset 
   * @returns {DataView}
  */
 const scalar = (view, data, offset) => {
   view[setData](offset, data, endianness);
   return view;
  };

  /**
   * @param {DataView} view 
   * @param {Iterable<number>} data 
   * @param {number} offset 
   * @param {number} count 
   * @returns {DataView} 
   */
  const vector = (view, data, offset, count) => {
    for (let i = 0; i < count; i += 1) {
      let position = offset + i * BYTES_PER_ELEMENT;
      view[setData](position, data, endianness);
    }
    return view;
  };

  return { scalar, vector };
};

export const  u8 = ByteWriter(Uint8Array  );
export const u16 = ByteWriter(Uint16Array );
export const u32 = ByteWriter(Uint32Array );
export const  i8 = ByteWriter(Int8Array   );
export const i16 = ByteWriter(Int16Array  );
export const i32 = ByteWriter(Int32Array  );
export const f32 = ByteWriter(Float32Array);

export default { u8, u16, u32, i8, i16, i32, f32 };
