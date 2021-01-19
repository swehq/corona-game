import {Environment, environment as defaults} from './defaults';

export const environment: Environment = {
  ...defaults,
  production: true,
  baseUrl: 'https://koronahra.cz/',
};
