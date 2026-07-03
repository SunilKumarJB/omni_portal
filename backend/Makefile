.PHONY: install run start clean format lint test check

install:
	uv sync --group dev

run: start

start:
	uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

clean:
	rm -rf .venv
	rm -rf .pytest_cache
	rm -rf .ruff_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +

format:
	uv run ruff format .
	uv run ruff check --fix .

lint:
	uv run ruff check .

test:
	uv run pytest

check:
	$(MAKE) format
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) format
