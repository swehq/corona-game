import {trigger, transition, style, animate} from '@angular/animations';

export const inOutAnimation = (delay = '0ms') => {
  return trigger(
    'inOutAnimation',
    [
      transition(
        ':enter',
        [
          style({opacity: 0}),
          animate(`300ms ${delay} ease-in` , style({opacity: 1})),
        ],
      ),
      transition(
        ':leave',
        [
          style({opacity: 1}),
          animate(`100ms 300ms ease-in`, style({opacity: 0})),
        ],
      ),
    ],
  );
};

export const scaleAnimation = (
  transformOriginX = '0',
  transformOriginY = '0',
  initialScaleX = '0',
  initialScaleY = '0',
) => {
  return trigger(
    'scaleAnimation',
    [
      transition(
        ':enter',
        [
          style({
            transform: `scale(${initialScaleX}, ${initialScaleY})`,
            transformOrigin: `${transformOriginX} ${transformOriginY}`,
          }),
          animate(
            '300ms cubic-bezier(.64,1.03,.26,.83)',
            style({transform: 'scale(1, 1)'}),
          ),
        ],
      ),
      transition(
        ':leave',
        [
          style({
            transform: 'scale(1, 1)',
            transformOrigin: `${transformOriginX} ${transformOriginY}`,
          }),
          animate(
            '300ms cubic-bezier(.64,1.03,.26,.83)',
            style({transform: `scale(${initialScaleX}, ${initialScaleY})`}),
          ),
        ],
      ),
    ],
  );
};
