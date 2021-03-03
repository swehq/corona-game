import {Context, DefaultState} from 'koa';
import Router from 'koa-router';
import {FormattingService} from '../../../frontend/src/app/services/formatting.service';
import {SimpleTranslateService} from '../services/translate.service';
import {GameDataDocument, GameDataModel, InvalidGameDataModel} from './model';
import {validateGame} from '../../../frontend/src/app/services/validate';
import {GameData} from '../../../frontend/src/app/services/game';
import {last, sampleSize} from 'lodash';

export const router = new Router<DefaultState, Context>();

async function processResultsQuery(scenarioName?: string) {
  let data: GameDataDocument[] = [];

  if (scenarioName) {
    data = await GameDataModel.find({scenarioName}, {results: 1, _id: 0});
  } else
    data = await GameDataModel.find({scenarioName}, {results: 1, _id: 0}).hint('results_1');

  return sampleSize(data.map((i: any) => i.results), 5000);
}

router.get('/api/game-data/scenario/:scenario', async (ctx) => ctx.body = processResultsQuery(ctx.params.scenario));

router.get('/api/game-data', async (ctx) => ctx.body = processResultsQuery());

router.get('/api/game-data/:id', async (ctx) => {
  const data = await GameDataModel.findOne({_id: ctx.params.id});
  if (!data) return ctx.status = 404;
  ctx.body = data;
});

router.post('/api/game-data', async (ctx) => {
  const inputData: GameData = ctx.request.body;
  const hostname = ctx.request.hostname;
  const validity = validateGame(inputData).validity;

  if (validity !== 'valid') {
    const saveData = new InvalidGameDataModel({data: inputData, validity, origin: hostname});
    await saveData.save();
    ctx.status = 400;
    ctx.body = genericError();
    return;
  }

  const lastDayData = last(inputData.simulation)!;
  const dead = lastDayData.stats.deaths.total;
  const cost = lastDayData.stats.costs.total;

  const saveData = new GameDataModel({...inputData, results: {dead, cost}, origin: hostname});
  const saveResult = await saveData.save();

  if (saveResult.errors) {
    ctx.status = 400;
    ctx.body = genericError();
    return;
  }

  ctx.body = {id: saveData._id, created: saveData.created};
});

// use data for `/results/:id` path, fallback otherwise
router.get(['/og/results/:id', /\/og($|\/.*)/], async (ctx) => {
  let data: any;
  const formattingService = new FormattingService(new SimpleTranslateService('cs'));

  const res = {
    origin: ensureHttps(ctx.origin),
    url: ensureHttps(`${ctx.protocol}://${ctx.host}${ctx.url.replace(/^\/og/, '')}`),
  }

  try {
    data = await GameDataModel.findOne({_id: ctx.params.id}, {results: 1});
    if (!data) throw Error();
  } catch (e) {
    await ctx.render('results', res);
    return;
  }

  await ctx.render('results', {
    ...res,
    dead: formattingService.formatNumber(data.results.dead),
    cost: formattingService.formatNumber(data.results.cost, true, true),
  });
})

function genericError() {
  return {error: 'Game data invalid'};
}

function ensureHttps(url: string) {
  return url.replace(/^http:\/\//, 'https://')
}
