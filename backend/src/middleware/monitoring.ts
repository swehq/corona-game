import Koa from 'koa';
import {sortedIndex} from 'lodash';

export const Influx = require('influxdb-nodejs');

export function influxMonitoring(influxDbUri: string, measurementName: string, env: string | undefined) {
  const influx = new Influx(influxDbUri);

  return async (ctx: Koa.Context, next: Koa.Next) => {
    const start = Date.now();

    try {
      await next();
    } catch {
    }

    const statusCode = ctx.status;
    const delta = Date.now() - start;
    const method = ctx.method;
    const route = ctx._matchedRoute;
    const requestLength = ctx.request?.length ?? 0;
    const responseLength = ctx.response?.length ?? 0;

    const tags = {
      status: sortedIndex([99, 199, 299, 399, 499, 599], statusCode),
      spdy: sortedIndex([100, 300, 1000, 3000], delta),
      method,
      route,
      env,
    };

    const fields = {
      request_time: delta,
      status_code: statusCode,
      request_length: requestLength,
      response_length: responseLength,
      total_length: requestLength + responseLength,
    };

    try {
      await influx.writePoint(measurementName, fields, tags);
    } catch (err) {
      console.error('Failed to write data to InfluxDB', err);
    }
  };
}
