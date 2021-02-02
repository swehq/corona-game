import Router from 'koa-router';
import {GameDataModel, InvalidGameDataModel} from './model';
import {validateGame} from '../../../frontend/src/app/services/validate';
import {GameData} from '../../../frontend/src/app/services/game';
import {scenarios} from '../../../frontend/src/app/services/scenario';
import {dateDiff} from '../../../frontend/src/app/services/utils';
import {last} from 'lodash';
import {Context, DefaultState} from 'koa';
import {formatNumber} from '../../../frontend/src/app/utils/format';

export const router = new Router<DefaultState, Context>();

router.get('/api/game-data', async (ctx) => {
  const data = await GameDataModel
    .find({}, {results: 1, _id: 0})
    .hint('results_1')
  ctx.body = data.map((i: any) => i.results);
});

router.get('/api/game-data/:id', async (ctx) => {
  const data = await GameDataModel.findOne({_id: ctx.params.id});
  if (!data) return ctx.status = 404;
  ctx.body = data;
});

router.post('/api/game-data', async (ctx) => {
  const inputData: GameData = ctx.request.body;
  const validity = validateGame(inputData).validity;

  if (validity !== 'valid') {
    const saveData = new InvalidGameDataModel({data: inputData, validity});
    await saveData.save();
    ctx.status = 400;
    ctx.body = genericError();
    return;
  }

  const lastDayData = last(inputData.simulation)!;
  const dead = lastDayData.stats.deaths.total;
  const cost = lastDayData.stats.costs.total;

  const saveData = new GameDataModel({...inputData, results: {dead, cost}});
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
    dead: formatNumber(data.results.dead),
    cost: formatNumber(data.results.cost, true, true),
  });
})

function genericError() {
  return {error: 'Game data invalid'};
}

function ensureHttps(url: string) {
  return url.replace(/^http:\/\//, 'https://')
}
