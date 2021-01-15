export enum LocalStorageKey {
  CONFIG = 'config',
  DEBUG_MODE = 'debugMode',
  SAVED_GAME_IDS = 'savedGameIds',
  LAST_GAME_DATA = 'lastGameData',
}

export interface Environment {
  production: boolean;
}

export const environment: Environment = {
  production: false,
};
