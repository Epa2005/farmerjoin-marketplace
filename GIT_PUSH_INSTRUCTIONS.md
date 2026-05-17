# Push repository to GitHub

Run the included helper script to push the current repository to GitHub.

Usage:

```bash
./git_push.sh "Commit message" "https://github.com/Epa2005/farmerjoin-marketplace.git" main
```

Notes:
- Ensure you have `git` installed and are authenticated with GitHub (SSH or HTTPS credentials).
- The script will set the `origin` remote to the provided URL and push the `main` branch by default.
