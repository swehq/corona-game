deploy-dev:
	ansible-playbook -i environments/dev backend.yml frontend.yml common.yml

deploy-dev-be:
	ansible-playbook -i environments/dev backend.yml common.yml

deploy-dev-fe:
	ansible-playbook -i environments/dev frontend.yml common.yml

deploy-dev-common:
	ansible-playbook -i environments/dev common.yml



deploy-prod:
	ansible-playbook -i environments/prod backend.yml frontend.yml common.yml

deploy-prod-be:
	ansible-playbook -i environments/prod backend.yml common.yml

deploy-prod-fe:
	ansible-playbook -i environments/prod frontend.yml common.yml

deploy-prod-common:
	ansible-playbook -i environments/prod common.yml



run-develop:
	ansible-playbook -i environments/local develop.yml --extra-vars 'action="up -d"'

stop-develop:
	ansible-playbook -i environments/local develop.yml --extra-vars 'action="down"'
