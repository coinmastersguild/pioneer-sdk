# Pioneer SDK Publishing Guide

This guide explains how to build and publish packages in the pioneer-sdk monorepo using changesets.

## Packages in this Monorepo

The following packages are published from this monorepo:

1. **@coinmasters/api** (v3.10.0) - API utilities
2. **@coinmasters/tokens** (v3.10.0) - Token definitions and utilities
3. **@coinmasters/types** (v4.10.0) - TypeScript type definitions
4. **@coinmasters/pioneer-sdk** (v4.10.2) - Core Pioneer SDK
5. **pioneer-react** (v0.10.0) - React components and hooks for Pioneer

## Prerequisites

- Node.js >= 20.0.0
- pnpm installed globally
- NPM account with publish permissions for @coinmasters scope
- Git repository access with push permissions

## Build Process

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build All Packages

```bash
pnpm build
```

This runs the turbo build command which builds all packages in dependency order.

### 3. Run Tests

```bash
pnpm test
```

## Publishing Process with Changesets

### 1. Create a Changeset

When you make changes to any package, create a changeset to document the changes:

```bash
pnpm changeset
```

This will prompt you to:
- Select which packages have changed
- Choose the version bump type (patch/minor/major)
- Write a summary of the changes

The changeset will be saved in `.changeset/` directory.

### 2. Version Packages

Before publishing, update package versions based on changesets:

```bash
pnpm version-bump
```

This command:
- Reads all changesets
- Updates package.json versions
- Updates dependencies between packages
- Generates/updates CHANGELOG.md files
- Removes processed changesets

### 3. Review Changes

Before publishing, review:
- Updated version numbers in package.json files
- Generated CHANGELOG entries
- Inter-package dependency updates

### 4. Publish to NPM

```bash
pnpm publish-packages
```

This command runs both version-bump and changeset publish.

### 5. Push Changes

After successful publish:

```bash
git add .
git commit -m "chore: release packages"
git push origin master
```

## Publishing Individual Packages

If you need to publish packages individually:

```bash
cd packages/pioneer/pioneer-sdk
pnpm publish --access public
```

## Version Management

### Versioning Strategy

- **Patch** (x.x.1): Bug fixes, dependency updates
- **Minor** (x.1.x): New features, backwards compatible
- **Major** (1.x.x): Breaking changes

### Forced Version Bump

If you need to force a version bump without changes:

```bash
pnpm version-bump-forced
```

## Troubleshooting

### Common Issues

1. **Authentication Error**
   ```bash
   npm login
   ```

2. **Version Conflict**
   - Ensure all changesets are processed
   - Check that versions are higher than published versions

3. **Build Failures**
   ```bash
   pnpm clean
   pnpm install
   pnpm build
   ```

### Checking Published Versions

```bash
npm view @coinmasters/pioneer-sdk version
npm view @coinmasters/api version
npm view @coinmasters/tokens version
npm view @coinmasters/types version
npm view pioneer-react version
```

## CI/CD Integration

The changeset configuration is set up for GitHub integration:
- Changelog generation uses `@changesets/changelog-github`
- Repository: `coinmasters/SwapKit`

## Best Practices

1. **Always create changesets** for any changes that affect package functionality
2. **Write clear changeset summaries** that explain what changed and why
3. **Group related changes** in a single changeset when they affect multiple packages
4. **Test locally** before publishing
5. **Use semantic versioning** correctly
6. **Review generated changelogs** before publishing

## Package Configuration

Each package should have:
- `"publishConfig": { "access": "public" }` for public packages
- Proper `exports` field for ESM/CJS compatibility
- `files` field to control what gets published
- Correct `main`, `module`, and `types` fields

## Scripts Reference

- `pnpm bootstrap` - Clean install and build everything
- `pnpm build` - Build all packages
- `pnpm lint` - Run linting
- `pnpm test` - Run tests
- `pnpm changeset` - Create a new changeset
- `pnpm version-bump` - Update versions from changesets
- `pnpm publish-packages` - Version and publish packages
- `pnpm clean` - Clean all build artifacts 