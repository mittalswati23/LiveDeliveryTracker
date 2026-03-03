# Developer Machine Setup
**Live Delivery Tracker — One-Time Prerequisites**
Machine: Apple M4 (Apple Silicon) · macOS · zsh

Run every command in Terminal (`/Applications/Utilities/Terminal.app`) in the order shown.
Each section has a verify command — do not proceed to the next step until it passes.

---

## 1. Homebrew

Homebrew is the package manager used to install everything else.
On Apple Silicon it installs to `/opt/homebrew/` (not `/usr/local/`).

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

When the installer finishes it will print two lines to add Homebrew to your PATH.
Run them exactly as printed, or use these (M-series standard):

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

```bash
# Verify
brew --version
# Expected: Homebrew 4.x.x
```

---

## 2. Node.js 20 LTS

Required for the Angular CLI and all frontend tooling.

```bash
# Install
brew install node
```

```bash
# Verify
node --version
# Expected: v20.x.x

npm --version
# Expected: 10.x.x
```

---

## 3. .NET 8 SDK

Required for the .NET Core Web API backend.
Use the `--cask` flag — this installs the full Microsoft SDK, not just the runtime.

```bash
# Install
brew install --cask dotnet-sdk
```

```bash
# Verify
dotnet --version
# Expected: 8.x.xxx
```

> If `dotnet` is not found after install, add it to your PATH:
> ```bash
> echo 'export PATH="$PATH:/usr/local/share/dotnet"' >> ~/.zprofile
> source ~/.zprofile
> ```

---

## 4. Git

Required for version control and committing between sessions.

```bash
# Install
brew install git
```

```bash
# Configure your identity (used in all commits)
git config --global user.name "Swati Mittal"
git config --global user.email "mittalswati@gmail.com"
```

```bash
# Set default branch name to main
git config --global init.defaultBranch main
```

```bash
# Verify
git --version
# Expected: git version 2.x.x

git config --global user.email
# Expected: mittalswati@gmail.com
```

---

## 5. GitHub CLI

Required to create the GitHub repo and push from the terminal without a browser.

```bash
# Install
brew install gh
```

```bash
# Authenticate with your existing GitHub account
gh auth login
```

Walk through the interactive prompts:

```
? Where do you use GitHub?          → GitHub.com
? What is your preferred protocol?  → HTTPS
? How would you like to authenticate? → Login with a web browser
```

A browser window will open — log in with `mittalswati@gmail.com` and click **Authorize GitHub CLI**.

```bash
# Verify
gh auth status
# Expected: Logged in to github.com as <your-username> (keyring)
```

---

## 6. Angular CLI

Required to scaffold and serve the Angular 19 frontend.

```bash
# Install globally via npm
npm install -g @angular/cli
```

```bash
# Verify
ng version
# Expected: Angular CLI: 19.x.x
```

> If you see a permissions error, do NOT use sudo. Fix npm permissions instead:
> ```bash
> mkdir -p ~/.npm-global
> npm config set prefix '~/.npm-global'
> echo 'export PATH="$PATH:~/.npm-global/bin"' >> ~/.zprofile
> source ~/.zprofile
> npm install -g @angular/cli
> ```

---

## 7. EF Core CLI Tools

Required to run database migrations in Phase 1A.

```bash
# Install
dotnet tool install --global dotnet-ef
```

```bash
# Add dotnet tools to PATH (Apple Silicon)
echo 'export PATH="$PATH:$HOME/.dotnet/tools"' >> ~/.zprofile
source ~/.zprofile
```

```bash
# Verify
dotnet ef --version
# Expected: Entity Framework Core tools 8.x.x
```

---

## 8. Final Sanity Check

Run all six checks at once. Every line should return a version number — no errors.

```bash
echo "--- Homebrew ---"  && brew --version
echo "--- Node.js  ---"  && node --version
echo "--- npm      ---"  && npm --version
echo "--- .NET SDK ---"  && dotnet --version
echo "--- Git      ---"  && git --version
echo "--- GitHub   ---"  && gh auth status
echo "--- Angular  ---"  && ng version --skip-confirmation 2>/dev/null | grep "CLI"
echo "--- EF Core  ---"  && dotnet ef --version
```

Expected output (versions may differ slightly):
```
--- Homebrew ---   Homebrew 4.x.x
--- Node.js  ---   v20.x.x
--- npm      ---   10.x.x
--- .NET SDK ---   8.x.xxx
--- Git      ---   git version 2.x.x
--- GitHub   ---   Logged in to github.com as ...
--- Angular  ---   Angular CLI: 19.x.x
--- EF Core  ---   8.x.x
```

---

## 9. Restart Terminal

Once all verifications pass, **close and reopen Terminal** (or run `source ~/.zprofile`)
so all PATH changes take effect cleanly before starting Phase 1A.

```bash
source ~/.zprofile
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `brew: command not found` | Run the PATH lines in Step 1 again, then `source ~/.zprofile` |
| `dotnet: command not found` | Add `/usr/local/share/dotnet` to PATH (see note in Step 3) |
| `ng: command not found` | Add `~/.npm-global/bin` to PATH (see note in Step 6) |
| `dotnet ef: command not found` | Add `$HOME/.dotnet/tools` to PATH (Step 7) |
| `gh auth login` fails | Check internet connection, try `gh auth login --web` |
| Homebrew install asks for password | Enter your Mac login password — it will not echo characters |

---

## You Are Ready When

All 8 tools return version numbers without errors in the Step 8 sanity check.

**Next step: open `PHASES.md` and start Phase 1A.**
