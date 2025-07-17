-include ./.env
export

include ./infrastructure/makefile.aws

ifeq ($(CONTAINER_CLI),)
CONTAINER_CLI := docker
# replace docker with podman if you have Podman installed
$(warning CONTAINER_CLI is not set. Defaulting to "docker")
endif

ECR_DOMAIN := ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

MATH_APP_URI := $(shell aws --profile ${AWS_PROFILE} cloudformation list-exports --query 'Exports[?Name==`Math-App:ECR-Repository-URI`].Value[]' --output text)
ifeq ($(MATH_APP_URI),)
$(warning Unable to determine Math-App ECR URI. Make sure the ECR stack is deployed first.)
endif

ifeq ($(DATABASE_URL),)
export DATABASE_URL=file:./dev.db
$(warning DATABASE_URL is not set. Defaulting to "file:./dev.db")
endif

ifeq ($(BUILD_TAG),)
BUILD_TAG := latest
endif

all: build

build: registry-login
	@echo "Building Math App container image ${BUILD_TAG}"
	@$(CONTAINER_CLI) build -t $(MATH_APP_URI):$(BUILD_TAG) .

dev:
	npm run dev

down:
	$(CONTAINER_CLI) compose down

prisma-studio:
	npx prisma studio

push: build
	@echo "Pushing Math App container image ${BUILD_TAG} to ECR"
	@$(CONTAINER_CLI) push $(MATH_APP_URI):$(BUILD_TAG)

registry-login:
	@aws ecr get-login-password | $(CONTAINER_CLI) login --username AWS --password-stdin $(ECR_DOMAIN)

up:
	$(CONTAINER_CLI) compose up --build

