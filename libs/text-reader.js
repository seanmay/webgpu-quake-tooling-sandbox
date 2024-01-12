import { u8 } from "./binary/reader.js";

export const ascii = {
  scalar: (view, byte_offset) => {
    const char = u8.scalar(view, byte_offset);
    return String.fromCharCode(char);
  },

  vector: (view, byte_offset, count) => {
    let str = "";
    for (let i = 0; i < count; i += 1) {
      const char = u8.scalar(view, byte_offset + i);
      if (char === 0) break;
      str += String.fromCharCode(char);
    }
    return str;
  },
};
