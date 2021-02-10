deploy-dev:
	ansible-playbook -i environments/dev backend.yml frontend.yml common.yml

deploy-fast:
	ansible-playbook -i environments/fast backend.yml frontend.yml common.yml

deploy-prod:
	ansible-playbook -i environments/prod backend.yml frontend.yml common.yml

run-develop:
	ansible-playbook -i environments/local develop.yml --extra-vars 'action="up -d"'

stop-develop:
	ansible-playbook -i environments/local develop.yml --extra-vars 'action="down"'
