install:
	npm ci

prod:
	npx webpack --mode production

dev:
	npx webpack --mode development

server:
	npx webpack serve --mode development