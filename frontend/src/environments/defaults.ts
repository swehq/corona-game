export enum LocalStorageKey {
  CONFIG = 'config',
  DEBUG_MODE = 'debugMode',
  SAVED_GAME_IDS = 'savedGameIds',
  LAST_GAME_DATA = 'lastGameData',
}

export interface Environment {
  production: boolean;
  baseTitle: string;
  baseUrl: string;
  facebookAppId: string;
}

export const environment: Environment = {
  production: false,
  baseTitle: 'Korona Hra',
  baseUrl: 'https://korona.swehq.com',
  facebookAppId: '243325407327390',
};
