export enum ApplicationLanguage {
  CZECH = 'cs',
  ENGLISH = 'en',
}

export enum LocalStorageKey {
  CONFIG = 'config',
  DEBUG_MODE = 'debugMode',
  SAVED_GAMES = 'savedGames',
  LAST_GAME_DATA = 'lastGameData',
  LANGUAGE = 'language',
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
