import {Injectable} from '@angular/core';
import {marker as _} from '@biesbjerg/ngx-translate-extract-marker';
import {TranslateService} from '@ngx-translate/core';
import {BaseChartDirective} from 'ng2-charts';
import {FormattingService} from './formatting.service';

export interface ChartI18nKeys {
  xAxisKeys?: (string | undefined)[];
  yAxisKeys?: (string | undefined)[];
  datasetLabelKeys?: (string | undefined)[];
}

@Injectable({
  providedIn: 'root',
})
export class I18nService extends FormattingService {

  protected milKey = _(' mil.');
  protected bilKey = _(' mld.');

  constructor(
    translateService: TranslateService,
  ) {
    super(translateService);
  }

  updateChartLabels(chart: BaseChartDirective, i18nKeys: ChartI18nKeys) {
    // Translate x axis labels
    const xAxes = chart.chart.options.scales!.xAxes!;
    if (!i18nKeys.xAxisKeys) {
      i18nKeys.xAxisKeys = [];
      xAxes.forEach(a => i18nKeys.xAxisKeys!.push(a?.scaleLabel?.labelString));
    }
    i18nKeys.xAxisKeys
      .forEach((k, index) => {
        if (k) {
          xAxes[index]!.scaleLabel!.labelString = this.translateService.instant(k);
        }
      });

    // Translate y axis labels
    const yAxes = chart.chart.options.scales!.yAxes!;
    if (!i18nKeys.yAxisKeys) {
      i18nKeys.yAxisKeys = [];
      yAxes.forEach(a => i18nKeys.yAxisKeys!.push(a?.scaleLabel?.labelString));
    }
    i18nKeys.yAxisKeys
      .forEach((k, index) => {
        if (k) {
          yAxes[index]!.scaleLabel!.labelString = this.translateService.instant(k);
        }
      });

    // Translate dataset labels
    if (!i18nKeys.datasetLabelKeys) {
      i18nKeys.datasetLabelKeys = [];
      chart.datasets.forEach(d => i18nKeys.datasetLabelKeys!.push(d.label));
    }
    i18nKeys.datasetLabelKeys
      .forEach((k, index) => {
        if (k) {
          chart.datasets[index].label = this.translateService.instant(k);
        }
      });
  }
}
