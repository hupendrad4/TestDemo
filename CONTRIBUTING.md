# Contributing to TestDemo

We love your input! We want to make contributing to TestDemo as easy and transparent as possible.

## Development Process

1. Fork the repo and create your branch from `main`
2. If you've added code, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue a pull request

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the API documentation if you changed any endpoints
3. The PR will be merged once you have approval from maintainers

## Code Style

### Backend (TypeScript/Node.js)
- Use TypeScript for all backend code
- Follow ESLint rules defined in the project
- Use async/await for asynchronous operations
- Add JSDoc comments for public functions
- Use meaningful variable and function names

### Frontend (React/TypeScript)
- Use functional components with hooks
- Follow React best practices
- Use Material-UI components when possible
- Keep components small and focused
- Write tests for components

### Database
- All schema changes must be done through Prisma migrations
- Write descriptive migration names
- Test migrations in development before submitting PR

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Commit Messages

- Use clear and meaningful commit messages
- Start with a verb (Add, Update, Fix, Remove, etc.)
- Keep the first line under 50 characters
- Add detailed description if needed

Examples:
```
Add user authentication endpoints
Fix test case creation bug
Update API documentation
Remove deprecated functions
```

## Reporting Bugs

Report bugs using GitHub issues. Include:
- Quick summary
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (OS, Node version, etc.)

## Feature Requests

Feature requests are welcome! Please provide:
- Clear description of the feature
- Why this feature would be useful
- Possible implementation approach

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open an issue with your question or contact the maintainers.

Thank you for contributing to TestDemo! 🎉
