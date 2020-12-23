import {readdirSync, readFileSync, writeFileSync} from 'fs';

const iconFilePattern = /^([a-z,0-9,_,\-]+)\.svg$/;

const registerIcons = (path = './', fileName = 'icons.ts', maxSize = 1_024) => {
  const icons: Record<string, string | null> = {};

  const files = readdirSync(path);
  const list = files.filter(filename => iconFilePattern.test(filename));

  list.forEach(filename => {
    const name = filename.match(iconFilePattern)![1];
    const source = readFileSync(path + filename, 'utf8');
    icons[name] = (source.length > maxSize) ? null : source;
  });

  const code = `/* tslint:disable:object-literal-key-quotes */
/* tslint:disable:quotemark */
export const ICONS = ` + JSON.stringify(icons, null, 2) + ';\n';

  writeFileSync(fileName, code, 'utf8');

  // tslint:disable-next-line:no-console
  console.log(`${Object.keys(icons).length} icons from ${path} registered in ${fileName}`);
  if (list.length < files.length) console.warn(`${files.length - list.length} files in directory does not match rule ${iconFilePattern}`);
};

registerIcons(
  process.argv.length > 2 ? process.argv[2] : './',
  process.argv.length > 3 ? process.argv[3] : 'icons.ts',
  process.argv.length > 4 ? Number(process.argv[4]) : 1_024,
);
