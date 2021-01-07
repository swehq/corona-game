import {trigger, transition, style, animate} from '@angular/animations';

export const inOutAnimation = trigger(
  'inOutAnimation',
  [
    transition(
      ':enter',
      [
        style({opacity: 0}),
        animate('300ms ease-in', style({opacity: 1})),
      ],
    ),
    transition(
      ':leave',
      [
        style({opacity: 1}),
        animate('300ms ease-in', style({opacity: 0})),
      ],
    ),
  ],
);
