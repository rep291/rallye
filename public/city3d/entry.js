// Einstieg, wird nach public/city3d/stadt.js gebündelt (ohne CDN).
// Neu bündeln, wenn sich diese Quellen ändern:
//   esbuild public/city3d/entry.js --bundle --format=iife --outfile=public/city3d/stadt.js --legal-comments=eof
import { mountCity, webglAvailable } from './city.js';

globalThis.City3D = { mount: mountCity, webglAvailable };
