# Corona Game

## Development server

### Install
- `cd frontend`
- `npm i`

### Run
- `npm start` for a dev server at `http://localhost:4200/`

## Code scaffolding
Run `npx ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Icons registration
- add new `xxx.svg` file into `src/assets/icons` folder
- run `npm run icons:register`
- use it in code: `<cvd-icon svgIcon="xxx">`

## TODO
- remove temp explicit `any`s
- TSLint's support is discontinued and we're deprecating its support in Angular CLI. See `npm run lint`
