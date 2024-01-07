export const load_buffer = (path) => fetch(path)
  .then(response => response.arrayBuffer());

export const load_text = (path) => fetch(path)
  .then(response => response.text());

export const load_blob = (path) => fetch(path)
  .then(response => response.blob());

export const load_json = (path) => fetch(path)
  .then(response => response.json());

export const load_bitmap = (path) => fetch(path)
  .then(response => response.blob())
  .then(createImageBitmap);
