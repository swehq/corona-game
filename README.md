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
