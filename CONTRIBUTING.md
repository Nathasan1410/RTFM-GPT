# Contributing to RTFM-GPT

First off, thanks for taking the time to contribute!

The following is a set of guidelines for contributing to RTFM-GPT. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project is open source and we want to foster a welcoming environment. Be respectful to others.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report.

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps to reproduce the problem** in as many details as possible.
- **Provide specific examples** to demonstrate the steps.

### Suggesting Enhancements

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
- **Explain why this enhancement would be useful** to most users.

### Pull Requests

1.  Fork the repo and create your branch from `main`.
2.  If you've added code that should be tested, add tests.
3.  Ensure the test suite passes.
4.  Make sure your code lints.
5.  Issue that pull request!

## Styleguides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less

### TypeScript / React

- Use Functional Components with Hooks.
- Use `zod` for validation.
- Use `zustand` for global state.
- Stick to the "Brutalist" design principles (no unnecessary animations, clean borders, mono fonts).

## Development Setup

1.  Clone the repository
2.  Run `npm install`
3.  Create `.env.local` with your `CEREBRAS_API_KEY`
4.  Run `npm run dev`
