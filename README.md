# Corona Game

## Quick setup

### Prerequisites
- node
- Ansible
- Docker

### Database
- `cd build/ansible`
- `make run-develop`
- inspect MongoDB with connection to localhost:8001

### Backend
- `cd backend`
- `npm i`
- `npm start`

### Frontend
- `cd frontend`
- `npm i`
- `npm start`
- open browser at `http://localhost:4200/`

## Deployment

### Prerequisites
- Ansible
- access to dev.swehq.com

### Steps
- `cd build/ansible`
- `make deploy-dev` or `make deploy-prod`

## Tests

### Update test file

If you are making changes in the simualtion model or stats,
and want to update the json file `frontend/src/app/game/game/data-czechia-real.json`
based on same mitigation definition
and randomness params, just run the following code wherever (e.g.)
in the `app.component.ts` and check the console for the report
(if new simulation differs, its state is printed out).

```typescript
import {validateGame} from 'src/app/services/validate';
import realData from '../../game/game/data-czechia-real.json';
const data = realData as any;
validateGame(data, false);
```
