# WAD2

WAD files in Quake are used in two different places:
  - during gameplay
  - during map-authoring

While the two usecases use the same file format, the data held within them is vastly different.

## In-Game WAD

WADs are stored in PAK files, their purpose is to hold all sprite information; HUD sprites, modal screens (quit / purchase / etc), font sprites, et cetera.

Each of these types of data has its own distinct struct format and usage.

## Mapping WAD

WADs for mapping are made to hold atlases of any textures available to be used in the map.
During the regular BSP compile process, the textures actually used in the map are copied from the WAD and placed into the BSP directly, hence why in-game WADs do not contain textures.

## Types

```ts
type Plural<type, length extends number> =
  length extends 1 ? type : type[];

// Size: 1 byte * length
type ascii<length = 1> = string;

// Size: 1 byte * length
type u8<length = 1> = Plural<number, length>;

// Size: 4 bytes * length
type u32<length = 1> = Plural<number, length>;

// Size: 12 bytes
type WadHeader = {
  callsign: ascii<4>; // "WAD2"
  entry_count: u32; // # of files in wad
  directory_offset: u32; // byte offset to the start of the directory
};

type WadEntryType =
  | "@" // WadTexturePalette
  | "D" // WadMapTexture

// Size: 32 bytes
type WadDirectoryEntry = {
  offset: u32; // byte offset to start of file
  disksize: u32; // size in WAD (might be compressed; probably isn't)
  size: u32; // size when decompressed (size == disksize in Quake)
  type: WadEntryType; // type of file to extract at this position
  compressed: u8; // 0 = false (practically always 0)
  __empty__: u16; // unused space
  name: ascii<16>; // texture name
};

// Size: 3 bytes * length
type RGB<length = 1> = Plural<u8<3>, length>;

// Size: 768 bytes
type WadTexturePalette = RGB<256>;

// Size: 1 byte * (width * height) / 2^mip-level
type TextureMip<length = 1> = Plural<u8<number>, length>;

type WadMapTexture = {
  name: ascii<16>; // texture name
  width: u32; // texture width
  height: u32; // texture height
  mip_offsets: u32<4>; // byte offsets for each mip-level starting from largest (mip-0)
  mips: TextureMip<4>; // each mip holds indices into the texture palette, per pixel
};

```



## References
- [Quake runtime WAD2 format](https://www.gamers.org/dEngine/quake/spec/quake-spec34/qkspec_7.htm#CWADF)
- [Half-Life WAD3 format](https://hlbsp.sourceforge.net/index.php?content=waddef#textures)


## Resources
[Slipgate Sightseer : Prototype WAD](https://www.slipseer.com/index.php?resources/prototype-wad.263/)
