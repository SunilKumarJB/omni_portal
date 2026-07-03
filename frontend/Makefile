.PHONY: install start run build preview clean format lint check

install:
	npm install

start: run

run:
	npm run dev

build:
	npm run build

preview:
	npm run preview

format:
	npx @biomejs/biome format --write .

lint:
	npx @biomejs/biome check --write .

check:
	$(MAKE) format
	$(MAKE) lint
	$(MAKE) format

clean:
	rm -rf node_modules
	rm -rf dist
