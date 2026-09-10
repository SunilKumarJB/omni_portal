.PHONY: install start start-be start-fe clean format lint check deploy deploy-firebase

install:
	@echo "Installing backend dependencies..."
	cd backend && $(MAKE) install
	@echo "Installing frontend dependencies..."
	cd frontend && $(MAKE) install

start:
	@echo "Starting both backend and frontend servers concurrently..."
	npx -y concurrently --kill-others \
		--prefix "[{name}]" \
		--names "backend,frontend" \
		--prefix-colors "blue,green" \
		"cd backend && $(MAKE) start" \
		"cd frontend && $(MAKE) start"

start-be:
	@echo "Starting backend dev server..."
	cd backend && $(MAKE) start

start-fe:
	@echo "Starting frontend dev server..."
	cd frontend && $(MAKE) start

clean:
	@echo "Cleaning up backend..."
	cd backend && $(MAKE) clean
	@echo "Cleaning up frontend..."
	cd frontend && $(MAKE) clean

format:
	@echo "Formatting backend..."
	cd backend && $(MAKE) format
	@echo "Formatting frontend..."
	cd frontend && $(MAKE) format

lint:
	@echo "Linting backend..."
	cd backend && $(MAKE) lint
	@echo "Linting frontend..."
	cd frontend && $(MAKE) lint

check:
	$(MAKE) format
	$(MAKE) lint
	$(MAKE) format

deploy:
	@echo "Deploying to Google Cloud Run..."
	./deploy-cloud-run.sh

deploy-firebase:
	@echo "Deploying frontend to Firebase Hosting..."
	./deploy-firebase.sh
