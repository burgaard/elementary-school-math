# Container Build GitHub Action

This workflow builds the container image for the Math Adventure app when code is merged into the main branch.

## Required Repository Secrets

To use this workflow, you need to add the following secrets to your GitHub repository:

1. `AWS_ACCOUNT_ID`: The AWS account you're going to push images to

## Required Repository Variables

1. `AWS_REGION`: The AWS region to access

## Setting Up Repository Variables and Secrets

1. Go to your GitHub repository settings
2. Click on "Secrets and variables" → "Actions" 
3. Add the variables and secrets with their corresponding values

## Workflow Details

- Builds container image on merges to the main branch
- Tags the image with both `latest` and the commit SHA
- Pushes the image to containerHub
- Uses caching to speed up builds
