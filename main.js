/// <Reference path="./types/webgpu.d.ts" />

import { load_buffer, load_text } from "./libs/loaders.js";
import { f32, u8, u16 } from "./libs/byte-reader.js";
import { ascii } from "./libs/text-reader.js";
import { read_directory_entries, read_directory_entry, read_header, read_wad, read_wad_descriptors } from "./libs/wad/reader.js";


const start_buffer = await load_buffer("./assets/start.wad");
const prototype_buffer = await load_buffer("./assets/prototype_basic_1_3.wad");

const start_wad_descriptors = read_wad_descriptors(new DataView(start_buffer));

const wad_files = await Promise.all([
  load_buffer("./assets/start.wad").then(wad => ["start", read_wad(new DataView(wad))]),
  load_buffer("./assets/prototype_basic_1_3.wad").then(wad => ["prototype", read_wad(new DataView(wad))])
]).then(entries => Object.fromEntries(entries));


const palette = document.createElement("canvas");
palette.width = 256;
palette.height = 256;

const palette_context = palette.getContext("2d");

for (let y = 0; y < 16; y += 1) {
  for (let x = 0; x < 16; x += 1) {
    const index = 3 * (y * 16 + x);
    const r = wad_files.start.textures.PALETTE.data[index + 0];
    const g = wad_files.start.textures.PALETTE.data[index + 1];
    const b = wad_files.start.textures.PALETTE.data[index + 2];

    const color = `rgb(${r}, ${g}, ${b})`;
    palette_context.fillStyle = color;
    palette_context.fillRect(x * 16, y * 16, 16, 16);
  }
}



document.body.append(palette);

const texture_canvas = document.createElement("canvas");
const texture_context = texture_canvas.getContext("2d", { willReadFrequently: true });

const texture_palette = wad_files.start.textures.PALETTE;
const quake_texture = wad_files.start.textures["quake"];
texture_canvas.width = quake_texture.width;
texture_canvas.height = quake_texture.height;

const image_data = texture_context.getImageData(0, 0, texture_canvas.width, texture_canvas.height);

const palettize_texture = (palette, indices, image_data) => {
  for (let i = 0; i < indices.byteLength; i += 1) {
    const texture_index = indices[i];
    const palette_index = 3 * texture_index;
    const pixel_index = 4 * i;

    const r = palette[palette_index + 0];
    const g = palette[palette_index + 1];
    const b = palette[palette_index + 2];
    const a = 255;

    image_data.data[pixel_index + 0] = r;
    image_data.data[pixel_index + 1] = g;
    image_data.data[pixel_index + 2] = b;
    image_data.data[pixel_index + 3] = a;
  }

  return image_data;
};

palettize_texture(texture_palette.data, quake_texture.data, image_data);
texture_context.putImageData(image_data, 0, 0);
document.body.append(texture_canvas);


const gpu = navigator.gpu;
const adapter = await gpu.requestAdapter({ powerPreference: "high-performance" });
const device = await adapter.requestDevice();
const format = gpu.getPreferredCanvasFormat();



const shader_text = await load_text("./opaque-triangle.wgsl");
const shader = device.createShaderModule({
  label: "Shader Module: Opaque Triangle Shader",
  code: shader_text
});


const texture_bindgroup_layout = device.createBindGroupLayout({
  label: "Bind Group Layout: Textured Triangle",
  entries: [
    { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
    { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
  ]
});

/** @type {GPUPipelineLayoutDescriptor} */
const textured_triangle_pipeline_layout = {
  layout: "Pipeline Layout: Textured Triangle",
  bindGroupLayouts: [texture_bindgroup_layout],
};

const textured_triangle_pipeline = device.createRenderPipeline({
  label: "Pipeline: Opaque Textured Triangle",
  layout: device.createPipelineLayout(textured_triangle_pipeline_layout),
  vertex: {
    entryPoint: "vertex_main",
    module: shader,
    buffers: [
      { arrayStride: 3 * 4, attributes: [{ shaderLocation: 0, format: "float32x3", offset: 0 }] },
      { arrayStride: 2 * 4, attributes: [{ shaderLocation: 1, format: "float32x2", offset: 0 }] },
    ]
  },
  fragment: {
    entryPoint: "fragment_main",
    module: shader,
    targets: [{ format }],
  },
  primitive: {
    cullMode: "back",
    frontFace: "cw",
  }
});


// These are data, not part of the rendering code
const vertices = Float32Array.of(
  -1.0, -1.0, 0.0,
  -1.0,  1.0, 0.0,
   1.0,  1.0, 0.0,

  -1.0, -1.0, 0.0,
   1.0,  1.0, 0.0,
   1.0, -1.0, 0.0,
);

const uvs = Float32Array.of(
   0.0,  1.0,
   0.0,  0.0,
   1.0,  0.0,

   0.0,  1.0,
   1.0,  0.0,
   1.0,  1.0,
);
// /data


// Owned by GPU Asset Manager
const vertex_buffer = device.createBuffer({
  label: "Buffer: Triangle Vertex",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

const uv_buffer = device.createBuffer({
  label: "Buffer: Triangle UV",
  size: uvs.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertex_buffer, 0, vertices);
device.queue.writeBuffer(uv_buffer, 0, uvs);


/** @type {GPURenderPassDescriptor} */
let render_pass_descriptor = {
  label: "Render Pass Descriptor: Textured Triangle Pass",
  colorAttachments: [
    {
      loadOp: "clear",
      storeOp: "store",
      clearValue: [0.75, 0.25, 0.75, 1],
      view: null,
    }
  ]
};


// This junk should be handled at app init
const canvas = document.createElement("canvas");
const context = canvas.getContext("webgpu");


canvas.width = quake_texture.width * 2;
canvas.height = quake_texture.height * 2;
context.configure({ device, format });

document.body.append(canvas);


// Hang on to this one; used everywhere
const texture_sampler = device.createSampler({
  magFilter: "nearest",
  minFilter: "nearest",
  mipmapFilter: "linear",
});


const gpu_texture = device.createTexture({
  label: "Texture: Textured Triangle Albedo",
  format: "rgba8unorm",
  size: [quake_texture.width, quake_texture.height, 1],
  mipLevelCount: 4,
  usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
});


const bind_group = device.createBindGroup({
  label: "Bind Group: Textured Triangle",
  layout: texture_bindgroup_layout,
  entries: [
    { binding: 0, resource: texture_sampler },
    { binding: 1, resource: gpu_texture.createView() }
  ]
});

device.queue.copyExternalImageToTexture(
  { source: texture_canvas  },
  { texture: gpu_texture },
  [texture_canvas.width, texture_canvas.height],
);
// /init



// This should be part of the GPU Library
const encoder = device.createCommandEncoder();
// Render Pass
render_pass_descriptor.colorAttachments[0].view =
  context.getCurrentTexture().createView();
const render_pass = encoder.beginRenderPass(render_pass_descriptor);
render_pass.setPipeline(textured_triangle_pipeline);
render_pass.setBindGroup(0, bind_group);
render_pass.setVertexBuffer(0, vertex_buffer);
render_pass.setVertexBuffer(1, uv_buffer);
render_pass.draw(6);
render_pass.end();

device.queue.submit([encoder.finish()]);
