# Contributing to DocuFinance

First off, thank you for considering contributing to DocuFinance! 🎉

It's people like you that make DocuFinance such a great tool. We welcome contributions from everyone, whether it's a bug fix, new feature, documentation improvement, or just a typo fix.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/financial-document-analyzer.git
   cd financial-document-analyzer
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/financial-document-analyzer.git
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed and what you expected**
- **Include your environment details** (OS, Node version, browser)

### 💡 Suggesting Features

Feature requests are welcome! Please provide:

- **A clear and descriptive title**
- **Detailed description of the proposed feature**
- **Explain why this feature would be useful**
- **Include mockups or examples if applicable**

### 📝 Improving Documentation

Documentation improvements are always appreciated:

- Fix typos or clarify confusing sections
- Add examples or tutorials
- Improve README or inline code comments

### 🔧 Submitting Code Changes

1. **Small PRs are preferred** - they're easier to review and merge
2. **One PR per feature/fix** - don't bundle unrelated changes
3. **Write meaningful commit messages**
4. **Include tests** if applicable
5. **Update documentation** if your changes affect it

## Development Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your credentials (see README for details).

3. **Set up the database**:
   ```bash
   pnpm dlx supabase link
   pnpm dlx supabase db push
   ```

4. **Generate types**:
   ```bash
   pnpm run update-supabase-types
   ```

5. **Start the development server**:
   ```bash
   pnpm dev
   ```

6. **Start Trigger.dev** (in a separate terminal):
   ```bash
   pnpm dlx trigger.dev@latest dev
   ```

## Pull Request Process

1. **Update your fork** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub with:
   - A clear title describing the change
   - A description of what was changed and why
   - Reference any related issues (e.g., "Fixes #123")
   - Screenshots for UI changes

4. **Address review feedback** promptly

5. **Once approved**, your PR will be merged by a maintainer

## Style Guidelines

### Code Style

- We use **TypeScript** for type safety
- Follow the existing code patterns in the project
- Use **ESLint** for linting: `pnpm lint`
- Use **Prettier** for formatting

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(documents): add PDF preview in document detail view
fix(auth): resolve session expiration issue
docs(readme): add deployment instructions
```

### TypeScript Guidelines

- Define types in `types/index.ts` for custom types
- Use generated Supabase types from `types/supabase.ts`
- Prefer `interface` for object shapes, `type` for unions/intersections
- Avoid `any` - use `unknown` if type is truly unknown

### Component Guidelines

- Use functional components with hooks
- Place shared UI components in `components/ui/`
- Use shadcn/ui components where possible
- Keep components focused and composable

---

## Questions?

Feel free to open an issue with your question or reach out to the maintainers.

Thank you for contributing! 🙏

