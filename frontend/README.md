# Corona Game

## Code scaffolding

Run `npx ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Icons registration

- add new `xxx.svg` file into `src/assets/icons` folder
- run `npm run icons:register`
- use it in code: `<cvd-icon svgIcon="xxx">`

## Extract strings strings for translation
- run `npm run i18n:extract`

## Debug Mode

- You can insert `true` value under `debugMode` key into your LocalStorage to turn on the debug panel

## TODO

- remove temp explicit `any`s
- TSLint's support is discontinued and we're deprecating its support in Angular CLI. See `npm run lint`
