export enum LocalStorageKey {
  CONFIG = 'config',
  DEBUG_MODE = 'debugMode',
}

export interface Environment {
  production: boolean;
}

export const environment: Environment = {
  production: false,
};
