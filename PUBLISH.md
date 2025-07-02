# NPM Publishing Guide

## Step 1: Register NPM Account

If you don't have an NPM account:
1. Visit https://www.npmjs.com/signup
2. Create a new account
3. Verify your email

## Step 2: Login to NPM on Local Machine

```bash
npm login
# or
npm adduser
```

Enter your information:
- Username
- Password  
- Email
- OTP (if 2FA is enabled)

## Step 3: Verify Login

```bash
npm whoami
```

## Step 4: Check Package Before Publishing

```bash
# Build project
yarn build

# Check package contents
npm pack --dry-run

# Test CLI tool
node dist/kloc.js --help
```

## Step 5: Publish Package

```bash
# First time publish
npm publish

# Or publish with specific tag
npm publish --tag latest
```

## Step 6: Verify After Publishing

```bash
# Check package on npm
npm view git-kloc-analyzer

# Install globally to test
npm install -g git-kloc-analyzer

# Test CLI
git-kloc-analyzer --help
```

## Update Version for Next Publish

```bash
# Increase patch version (1.1.0 -> 1.1.1)
npm version patch

# Increase minor version (1.1.0 -> 1.2.0)
npm version minor

# Increase major version (1.1.0 -> 2.0.0)
npm version major

# Then publish
npm publish
```

## Important Notes

1. **Package name**: `git-kloc-analyzer` - ensure this name is not already taken on npm
2. **Version**: Currently `1.1.0` - version must be incremented for each publish
3. **Published files**: Only files in `dist/`, `README.md`, `LICENSE` according to `package.json` configuration
4. **CLI command**: After installation, users can run `git-kloc-analyzer` from terminal

## Troubleshooting

### Package Name Already Exists Error
```bash
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/git-kloc-analyzer - Package name too similar to existing package
```
**Solution**: Change package name in `package.json` to something else, e.g.: `@yourusername/git-kloc-analyzer`

### Permission Error
```bash
npm ERR! 403 Forbidden
```
**Solution**: Ensure you're logged in with the correct account and have publish permissions

### Version Already Exists Error
```bash
npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/git-kloc-analyzer - You cannot publish over the previously published versions
```
**Solution**: Increment version in `package.json` before publishing