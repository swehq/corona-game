import Router from 'koa-router';
import {GameDataModel} from './model';
import {validateGame} from '../../../frontend/src/app/services/validate';
import {GameData} from '../../../frontend/src/app/services/game';
import {last} from 'lodash';
import {Context, DefaultState} from 'koa';
import {formatNumber} from '../../../frontend/src/app/utils/format';

export const router = new Router<DefaultState, Context>();

router.get('/api/game-data', async (ctx) => {
  const data = await GameDataModel.find({}, {results: 1});
  ctx.body = data.map((i: any) => i.results);
});

router.get('/api/game-data/:id', async (ctx) => {
  const data = await GameDataModel.findOne({_id: ctx.params.id});
  if (!data) return ctx.status = 404;
  ctx.body = data;
});

router.post('/api/game-data', async (ctx) => {
  const inputData: GameData = ctx.request.body;
  if (!validate(inputData)) {
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

  ctx.body = {id: saveData._id};
});

router.get(['/og/results/:id', /\/og($|\/.*)/], async (ctx) => {
  let data: any;

  const res = {
    origin: ctx.origin,
    url: ctx.url,
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

// TODO implement and use on FE or remove
// router.put('/api/game-data/:id', async (req, res) => {
//   const todo = await GameDataModel.findOneAndUpdate({_id: req.params.id}, req.body, {new: true}).exec();
//   if (!todo) return res.sendStatus(404);
//   res.send(todo);
// });

function genericError() {
  return {error: 'Game data invalid'};
}

function validate(data: any): boolean {
  if (!data.mitigations) return false;
  if (!data.simulation || !data.simulation.length) return false;

  try {
    if (!validateGame(data)) return false;
  } catch (e) {
    return false;
  }

  return true;
}
