import fs from 'fs';
const base = 'C:\\Users\\admin\\.gemini\\antigravity-ide\\brain\\aff6eb62-d91c-4769-82c5-f574e4419a79\\.system_generated\\steps';
const files = [150,151,152,153,154,155,156,157,158];

files.forEach(f => {
  try {
    const content = fs.readFileSync(`${base}\\${f}\\content.md`, 'utf8');
    const jsonMatch = content.match(/\{"result.*$/s);
    if (jsonMatch) {
      const d = JSON.parse(jsonMatch[0]);
      const manga = d.data[0];
      const coverRel = manga.relationships.find(r => r.type === 'cover_art');
      const title = manga.attributes.title['en'] || manga.attributes.title['ja-ro'] || manga.attributes.title['ja'] || Object.values(manga.attributes.title)[0];
      console.log(`${f}: ID=${manga.id} | Title=${title} | Cover=${coverRel?.attributes?.fileName}`);
    }
  } catch(e) {
    console.log(`${f}: ERROR ${e.message}`);
  }
});
