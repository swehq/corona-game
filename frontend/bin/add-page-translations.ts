import * as yargs from 'yargs';
import * as path from 'path';
import {readFileSync, writeFileSync} from 'fs';

const argv = yargs
  .usage('Usage: $0 -i <input_path> -o <output_path>')
  .demandOption('o')
  .alias('o', 'output')
  .describe('o', 'Output path')
  .demandOption('i')
  .alias('i', 'input')
  .describe('i', 'Input path')
  .array('l')
  .require('l')
  .alias('l', 'lang')
  .describe('l', 'Language')
  .array('p')
  .require('p')
  .alias('p', 'page')
  .describe('p', 'page')
  .help('h')
  .alias('h', 'help')
  .parse(process.argv)

argv.lang.forEach(lang => {
  const langFileName = path.join(argv.output as string, lang + '.json');
  const langData = JSON.parse(readFileSync(langFileName, 'utf8'));
  argv.page.forEach(page => {
    const pageFileName = path.join(argv.input as string, page + '.' + lang + '.html');
    const pageData = readFileSync(pageFileName, 'utf8');
    langData[page + '.html'] = pageData.replace(/\n/g, ' ');
  });
  writeFileSync(langFileName, JSON.stringify(langData, null, '  '), 'utf8');
});
