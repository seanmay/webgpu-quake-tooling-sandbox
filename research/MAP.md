
// Terminology:
//
//   ENTITY
//    - A "thing" in the game
//    - virtually everything is an entity, or belongs to an entity
//
//   ATTRIBUTE
//    - a key-value pair that represents some data about an entity
//    - every entity must have a "classname" attribute declaring the type
//
//   BRUSH
//    - in-game geometry; if it's part of a level, it's likely a brush
//    - brushes are owned by entities
//    - static brushes are almost always owned by worldspawn
//
//   WORLDSPAWN
//    - a unique entity in a map
//    - contains most brushes in the game, by default
//    - contains the list of WADs in the "wad" attribute
//    - contains attributes regarding map name, music to play, etc
//
//   WAD
//    - binary file, containing list of textures, and their image data
//






// Syntax Examples:
//
// { } denotes an entity
//
// { "x" "y" } denotes an attribute in an entity
// 
// { { } } denotes a "Brush" (block of geometry) in an entity
//
// the following lines denote a brush face
// [        *1           ] [*2] [       *3        ] [ *4]
// (x y z) (x y z) (x y z) abcd [x y z u] [x y z v] a x y
//
// *1 (x y z) (x y z) (x y z)
//    - defines a triangle on the same plane as the face of the block
//    - the normal of the triangle = the normal of the face
//    - planes can be defined in (point, normal) form
//
//
// *2 abcd
//    - defines name of texture
//    - this texture is defined inside of WADs
//    - no way of telling which WAD contains the texture
//    - the list of WADs is ";" separated
//      - found in the "wad" attribute of the "worldspawn" entity
// 
// *3 [x y z u] [x y z v]
//    - [(x y z)(u)]
//      - x, y, z is bitangent to the normal
//      - u is the offset from origin
//    - [x y z u] represents "right"
//    - [x y z v] represents "up"
//    - these are needed to lay out the wallpaper from a specific point
//
// *4 a x y
//    - a is rotation in degrees
//    - x is scale in the "right" direction
//    - y is scale in the "up" direction
//
