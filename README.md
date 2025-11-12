# Audio Signal Processing with Python

This repository hosts a Jupyter Book, deployed via GitHub Pages on the gh-pages branch. Below are the steps to update and redeploy the book automatically.

## Prerequisites

Ensure you have Jupyter Book installed:

    pip install jupyter-book

Ensure GitHub Actions is enabled for this repository under GitHub → Settings → Actions → General.

### Use cookiecutter-jupyter-book to Generate the Project

If you are starting a new Jupyter Book project, you can use the official cookiecutter template:

    pip install cookiecutter
    
    cookiecutter https://github.com/executablebooks/cookiecutter-jupyter-book

During setup:

- When prompted for `include_ci`, choose GitHub to automatically generate the GitHub Actions workflow for deployment.

If you already have an existing Jupyter Book repository, you can manually add the GitHub Actions workflow in the next step.

## Adding the GitHub Actions Workflow

If the cookiecutter template was not used, manually create a workflow file.

Navigate to your GitHub repository and create the folder (if it doesn’t exist):

    mkdir -p .github/workflows/

Create a new YAML workflow file:

    touch .github/workflows/deploy-jupyter-book.yml

Add the following content to deploy-jupyter-book.yml:

```
name: Deploy Jupyter Book

on:
  push:
    branches:
      - main  # Deploys whenever changes are pushed to main

jobs:
  build-deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: "3.9"

    - name: Install dependencies
      run: |
        pip install jupyter-book ghp-import

    - name: Build the Jupyter Book
      run: |
        jupyter-book build .

    - name: Deploy to GitHub Pages
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      run: |
        git config --global user.email "github-actions[bot]@users.noreply.github.com"
        git config --global user.name "github-actions[bot]"
        ghp-import -n -p -f _build/html -b gh-pages
```

This workflow will:
✅ Automatically build the Jupyter Book when main is updated.
✅ Deploy the built book to gh-pages using GitHub Actions.

### Ensuring GitHub Pages is Set Up Correctly

1. Go to GitHub → Your Repository → Settings → Pages.
1. Ensure Source is set to Deploy from a branch.
1. Select Branch: gh-pages.
1. Click Save if needed.

### Committing and Pushing the Workflow to GitHub

Once the workflow file is added, commit and push the changes:

    git add .github/workflows/deploy-jupyter-book.yml

    git commit -m "Add GitHub Actions workflow for Jupyter Book deployment"
    
    git push origin main

To manually trigger a deployment, you can push an empty commit:

    git commit --allow-empty -m "Trigger GitHub Pages deployment"
    
    git push origin main

Checking Deployment Status

Go to GitHub → Your Repository → Actions.
Find the "Deploy Jupyter Book" workflow run.
Ensure the build and push steps succeed.

Visit the website at:

    https://francescopapaleo.github.io/audio-signal-processing/

### Ignoring Build Files Locally

To avoid unnecessary Git commits, add _build/ to .gitignore:

    echo "_build/" >> .gitignore
    
    git add .gitignore
    
    git commit -m "Ignore _build/ folder"
    
    git push origin main


:::{hint}

**Want to interact with the audio widget in your browser?**

You can launch this notebook on [Binder](https://mybinder.org/) to play with the phase shift slider and listen to the audio output live, right in your web browser.

**How to do it:**
1. Click the "Rocket" or "Binder" badge at the top of this notebook (or visit [mybinder.org](https://mybinder.org/)).
2. Paste the GitHub repository URL for this project into Binder, or use any provided launch link.
3. Once the environment loads, navigate to this notebook file.
4. Move the "Phase shift" slider to change the phase difference between the two waves and press the play button to listen.

:::