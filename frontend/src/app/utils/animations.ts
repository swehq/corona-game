import {trigger, transition, style, animate, animateChild, AnimationTriggerMetadata, query} from '@angular/animations';

export const inOutAnimation = (delay = '0ms', name = 'inOutAnimation', leaveAnimationDuration = '100ms') => {
  return trigger(
    name,
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
          animate(`${leaveAnimationDuration} 0ms ease-in`, style({opacity: 0})),
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

export function dumbAnimation(): AnimationTriggerMetadata {
  return trigger('dumbAnimation', [
    transition('* => void', [
      query('@*', [animateChild()], {optional: true}),
    ]),
  ]);
}
