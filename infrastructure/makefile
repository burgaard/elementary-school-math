-include ../.env
export

include ./makefile.aws

ifeq ($(GITHUB_BRANCH),)
GITHUB_BRANCH := main
endif
NAME_PREFIX := Math-App

ifeq ($(GITHUB_REPOSITORY),)
$(error GITHUB_REPOSITORY is not set. Please set it to the GitHub repository in the format 'owner/repo'.)
endif

all: ecr github-roles vpc

ecr: ecr.yaml
	aws cloudformation deploy \
		--template-file ecr.yaml \
		--stack-name ${NAME_PREFIX}-ECR \
		--parameter-overrides Name=$(NAME_PREFIX)

github-roles: ecr github-roles.yaml
	aws cloudformation deploy \
		--template-file github-roles.yaml \
		--stack-name ${NAME_PREFIX}-GitHub-Roles \
		--capabilities CAPABILITY_NAMED_IAM \
		--parameter-overrides Name=$(NAME_PREFIX) Repository=$(GITHUB_REPOSITORY) Branch=$(GITHUB_BRANCH)

vpc: vpc.yaml
	aws cloudformation deploy \
		--template-file vpc.yaml \
		--stack-name ${NAME_PREFIX}-VPC \
		--parameter-overrides Name=$(NAME_PREFIX)
