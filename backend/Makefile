.PHONY: install run start clean format lint test test-connection check

# Detect virtual env python or default to .venv/bin/python
VENV_BIN = .venv/bin

install:
	@if [ ! -d ".venv" ]; then \
		echo "Creating virtual environment..."; \
		uv venv; \
	fi
	uv pip install --python $(VENV_BIN)/python --index-url https://pypi.org/simple -r requirements.txt

run: start

start:
	$(VENV_BIN)/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

clean:
	rm -rf .venv
	rm -rf .pytest_cache
	rm -rf .ruff_cache
	find . -type d -name "__pycache__" -exec rm -rf {} +

format:
	$(VENV_BIN)/ruff format .
	$(VENV_BIN)/ruff check --fix .

lint:
	$(VENV_BIN)/ruff check .

test:
	@if [ -f "$(VENV_BIN)/pytest" ]; then \
		$(VENV_BIN)/pytest; \
	else \
		echo "No tests found or pytest not installed."; \
	fi

test-connection:
	$(VENV_BIN)/python scripts/test_api_calls.py

check:
	$(MAKE) format
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) format




