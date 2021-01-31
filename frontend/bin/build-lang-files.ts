import * as yargs from 'yargs';
import * as path from 'path';
import {readdirSync, readFileSync, writeFileSync} from 'fs';

const argv = yargs
  .usage('Usage: $0 -d <directory>')
  .demandOption('d')
  .alias('d', 'directory')
  .help('h')
  .alias('h', 'help')
  .parse(process.argv)

const langs = {} as Record<string, any>;

const extractDir = path.join(argv.directory as string, 'extract');
readdirSync(extractDir).forEach(langFile => {
  if (langFile.endsWith('.json')) {
    const lang = langFile.slice(0, -5);
    langs[lang] = JSON.parse(readFileSync(path.join(extractDir, langFile), 'utf8'));
  }
});

const pagesDir = path.join(argv.directory as string, 'pages');
readdirSync(pagesDir).forEach(pageFile => {
  const lang = pageFile.slice(-7, -5);
  const pageName = pageFile.slice(0, -8);
  const pageData = readFileSync(path.join(pagesDir, pageFile), 'utf8');
  langs[lang][pageName + '.html'] = pageData.replace(/\n/g, ' ');
});


for (const lang in langs) {
  writeFileSync(path.join(argv.directory as string, lang + '.json'), JSON.stringify(langs[lang], null, '  '), 'utf8');
}
