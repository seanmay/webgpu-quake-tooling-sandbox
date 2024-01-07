// VertexInput -> vertex-shader ->
//  Bridge ->
//    fragment-shader -> FragmentOutput -> screen


@group(0) @binding(0) var nearest_sampler: sampler;
@group(0) @binding(1) var albedo: texture_2d<f32>;


struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) uv: vec2<f32>,
}

struct Bridge {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
}

struct FragmentOutput {
  @location(0) color: vec4<f32>,
}



@vertex
fn vertex_main (input: VertexInput) -> Bridge {
  let position = vec4<f32>(input.position, 1.0);
  let output = Bridge(position, input.uv);
  return output;
}

@fragment
fn fragment_main (input: Bridge) -> FragmentOutput {
  let uv = input.uv;
  let color = textureSample(albedo, nearest_sampler, input.uv);
  let output = FragmentOutput(color);
  return output;
}
