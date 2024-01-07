import { u16, u32, u8 } from "../byte-reader.js";
import { ascii } from "../text-reader.js";

const WAD_HEADER_SIZE = 12;
const WAD_DIRECTORY_SIZE = 32;

const reader_type = {
  "@": "palette",
  "D": "indexed",
};

export const read_header = (wad_view) => {
  const header = {
    callsign: ascii.vector(wad_view, 0, 4),
    entry_count: u32.scalar(wad_view, 4),
    directory_offset: u32.scalar(wad_view, 8),
  };

  return header;
};

export const read_directory_entry = (wad_view, offset) => {
  const entry = {
    offset: u32.scalar(wad_view, offset + 0),
    disksize: u32.scalar(wad_view, offset + 4),
    size: u32.scalar(wad_view, offset + 8),
    type: ascii.scalar(wad_view, offset + 12),
    compressed: u8.scalar(wad_view, offset + 13),
    __empty__: u16.scalar(wad_view, offset + 14),
    name: ascii.vector(wad_view, offset + 16, 16),
  };

  return entry;
};

export const read_directory_entries = (wad_view, offset, count) => {
  let entries = new Array(count);
  for (let i = 0; i < count; i += 1) {
    const entry_offset = offset + i * WAD_DIRECTORY_SIZE;
    entries[i] = read_directory_entry(wad_view, entry_offset);
  }

  return entries;
};

export const read_palette_texture = (wad_view, entry) => {
  const texture = {
    type: "palette",
    byteLength: entry.disksize,
    name: entry.name,
    data: u8.vector(wad_view, entry.offset, entry.size),
  };

  return texture;
};

export const read_indexed_texture = (wad_view, entry) => {
  const offset = entry.offset;
  const texture = {
    type: "indexed",
    byteLength: entry.disksize,
    name: entry.name,
    // TODO: separate function for looking up dimensions *without* copying whole texture
    // TODO: determine whether `new Uint8Array(array_buffer, 10, 15)` creates a copy, or is a view over `array_buffer`
    width: u32.scalar(wad_view, offset + 16),
    height: u32.scalar(wad_view, offset + 20),
    mip_offsets: u32.vector(wad_view, offset + 24, 4),
    data: u8.vector(wad_view, offset + 40, entry.size),
  };

  return texture;
};


export const read_texture = (wad_view, entry) => {
  const type = reader_type[entry.type];
  const texture = readers[type]?.(wad_view, entry);
  return texture;
};

export const read_wad = (wad_view) => {
  const header = read_header(wad_view);
  const entries = read_directory_entries(wad_view, header.directory_offset, header.entry_count);
  const textures = Object.fromEntries(entries.map(entry => [entry.name, read_texture(wad_view, entry)]));

  const wad = {
    header,
    entries,
    textures,
  };

  return wad;
};


const read_palette_descriptor = (wad_view, entry) => ({
  name: entry.name,
  type: reader_type[entry.type],
  size: { width: Math.sqrt(entry.disksize / 3), height: Math.sqrt(entry.disksize / 3) },
  byteLength: entry.size,
});

const read_indexed_descriptor = (wad_view, entry) => ({
  name: entry.name,
  type: reader_type[entry.type],
  size: {
    width: u32.scalar(wad_view, entry.offset + 16),
    height: u32.scalar(wad_view, entry.offset + 20),
  },
  flags: {
    sky: entry.name.startsWith("sky"),
    fluid: entry.name.startsWith("*"),
    animated: entry.name.startsWith("+"),
  },
  byteLength: entry.size,
  pointers: { wad: wad_view, entry }, // Consider Replacing this with some GUIDs for WAD/Entry
});

// TextureDescriptor = PaletteDescriptor | IndexedDescriptor
export const read_texture_descriptor = (wad_view, entry) => {
  const read_descriptor = descriptors[reader_type[entry.type]];
  const descriptor = read_descriptor(wad_view, entry);
  return descriptor;
};

export const read_wad_descriptors = (wad_view) => {
  const header = read_header(wad_view);
  const entries = read_directory_entries(wad_view, header.directory_offset, header.entry_count);
  const descriptors = entries.map((entry) => read_texture_descriptor(wad_view, entry));
  return descriptors;
};

const descriptors = {
  palette: read_palette_descriptor,
  indexed: read_indexed_descriptor,
};

const readers = {
  palette: read_palette_texture,
  indexed: read_indexed_texture,
};
