export enum LocalStorageKey {
  CONFIG = 'config',
}

export interface Environment {
  production: boolean;
}

export const environment: Environment = {
  production: false,
};
