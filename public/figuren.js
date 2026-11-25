// Berufsfiguren (in Blender gerendert, tools/figuren_blender.py). Spielerfarbe = Sockel unter der Figur.
window.Figuren = (function () {
  const list = [{"id":"mechanik","name":"Kfz-Mechaniker/in"},{"id":"koch","name":"Koch/Köchin"},{"id":"friseur","name":"Friseur/in"},{"id":"it","name":"IT-Techniker/in"},{"id":"garten","name":"Gärtner/in"},{"id":"labor","name":"Labortechniker/in"},{"id":"lager","name":"Lagerlogistik"},{"id":"tischler","name":"Tischler/in"},{"id":"elektrik","name":"Elektriker/in"},{"id":"pflege","name":"Pfleger/in"},{"id":"polizei","name":"Polizist/in"},{"id":"feuerwehr","name":"Feuerwehr"},{"id":"maurer","name":"Maurer/in"},{"id":"maler","name":"Maler/in"},{"id":"baecker","name":"Bäcker/in"},{"id":"verkauf","name":"Verkäufer/in"},{"id":"buero","name":"Bürokaufmann/-frau"},{"id":"arzt","name":"Arzt/Ärztin"},{"id":"schweiss","name":"Metalltechniker/in"},{"id":"fahrer","name":"Berufskraftfahrer/in"},{"id":"landwirt","name":"Landwirt/in"},{"id":"kiga","name":"Elementarpädagog/in"}];
  const base = '/assets/figuren/';
  const ok = id => list.some(f => f.id === id) ? id : list[0].id;
  // Fusspunkt (0,0), Figur ca. 100 Einheiten hoch. Bild 256 px = 150 Einheiten, Fuss bei 236 px.
  function svg(id, color) {
    id = ok(id);
    return '<ellipse class="sockel" cx="0" cy="2" rx="38" ry="13" fill="' + color + '" stroke="#fff" stroke-width="4"/>' +
      '<ellipse cx="0" cy="2" rx="38" ry="13" fill="none" stroke="#0006" stroke-width="1.5"/>' +
      '<image class="f-stand" href="' + base + id + '.png" x="-75" y="-138" width="150" height="150"/>' +
      '<image class="f-wink" href="' + base + id + '_winken.png" x="-75" y="-138" width="150" height="150"/>' +
      '<image class="f-jump" href="' + base + id + '_sprung.png" x="-75" y="-138" width="150" height="150"/>';
  }
  function icon(id, color, size) { return '<svg class="figicon" width="' + size + '" height="' + Math.round(size * 1.23) + '" viewBox="-60 -132 120 148">' + svg(id, color) + '</svg>'; }
  function name(id) { const f = list.find(x => x.id === id); return f ? f.name : id; }
  // Bilder vorladen, damit beim ersten Sprung nichts flackert
  if (typeof Image !== 'undefined') list.forEach(f => ['', '_winken', '_sprung'].forEach(s => { const i = new Image(); i.src = base + f.id + s + '.png'; }));
  return { list, svg, icon, name };
})();
