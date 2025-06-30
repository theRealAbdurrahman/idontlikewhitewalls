## 🌳 Branching Map

```
main (production - **showcase IRL**)
  │
  ├─── staging (pre-production testing - **for devs**)
  │      │
  │      └─── feature branches → 28-jun (development)
  │
  └─── bolt (special production variant - **for hackaton**)
```

## 🔄 Sync Flow

```
feat/* → staging → staging → main
                       ↓
                      bolt (cherry-pick specific changes)
```

### Branch Purposes

- 🌐 **`main`** - **Production** - **Shown IRL** in Events **by Stuart**.
- 🌐 **`bolt`** - **Production** - **Hackaton Eligible** special **version**
- 🌐 **`staging`** - Testing environment **for devs**
- 🌐* **`28-jun`** - Current Active development branch used on Bolt
- 🌐* **`feature/*`** - Individual feature branches created from `28-jun`.

🌐: public deployment
🌐*: Not Yet public deployment

## 1. Branchiiiinnngg Workflow

Create **working/feature branch** __from__ **staging**:

```bash
# Update staging branch localally
git switch staging
git pull origin staging

# Create a new feature branch
git switch -c feat/your-feature-branch
```

### Merge Your Work

```bash
# Push your feature branch
git push -u origin feat/your-feature-name

# Create a PR targeting staging (not main!)
gh pr create --base staging
```

### Testing in Staging

With PR merged, **deployment** will go **live on** staging.meetball.fun.

## Cheatsheet

- **Create features from?** → `staging`
- **Submit PRs to?** → `staging`
- **Test deployments on?** → `staging`
- **Never directly push to?** → `main`, `bolt`, `staging`

### Common Commands

```bash
# See branch visualization
git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset'   --abbrev-commit --all -10

# Check what will be merged
git log staging..staging --oneline

# Preview changes before merging
git diff staging...staging
```
