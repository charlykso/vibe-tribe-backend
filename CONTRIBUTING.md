# Contributing to VibeTribe

Thank you for your interest in contributing to VibeTribe! This document provides guidelines and information for contributors.

## 🎯 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Firebase account (for database access)
- Basic knowledge of React, TypeScript, and Node.js

### Development Setup

1. **Fork and Clone**

```bash
git clone https://github.com/your-username/vibe-tribe-manager.git
cd vibe-tribe-manager
```

2. **Install Dependencies**

```bash
npm install
cd backend && npm install && cd ..
```

3. **Environment Setup**

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Configure your environment variables
```

4. **Start Development Servers**

```bash
npm run dev:full  # Starts both frontend and backend
```

## 📋 Development Workflow

### Branch Strategy

- **main**: Production branch - automatically deploys to production
- **feature/**: New features (`feature/post-scheduling`)
- **bugfix/**: Bug fixes (`bugfix/auth-token-refresh`)
- **hotfix/**: Critical production fixes

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
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

```bash
feat(auth): add OAuth integration for LinkedIn
fix(posts): resolve character count validation issue
docs(api): update authentication endpoint documentation
test(components): add unit tests for PostComposer
```

### Pull Request Process

1. **Create Feature Branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**

   - Write clean, readable code
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**

```bash
npm run test          # Frontend tests
cd backend && npm run test  # Backend tests
npm run lint          # Code linting
npm run build         # Build verification
```

4. **Commit Changes**

```bash
git add .
git commit -m "feat(component): add new feature description"
```

5. **Push and Create PR**

```bash
git push origin feature/your-feature-name
# Create pull request on GitHub
```

## 🎨 Code Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

```typescript
/**
 * Publishes a post to multiple social media platforms
 * @param postData - The post content and metadata
 * @param platforms - Array of target platforms
 * @returns Promise resolving to publication results
 */
async function publishPost(
  postData: PostData,
  platforms: Platform[]
): Promise<PublicationResult[]> {
  // Implementation
}
```

### React Components

- Use functional components with hooks
- Implement proper TypeScript interfaces
- Follow component naming conventions
- Use proper prop destructuring

```typescript
interface PostComposerProps {
  initialContent?: string
  onSave: (content: string) => void
  platforms: Platform[]
}

export const PostComposer: React.FC<PostComposerProps> = ({
  initialContent = '',
  onSave,
  platforms,
}) => {
  // Component implementation
}
```

### CSS/Styling

- Use Tailwind CSS classes
- Follow mobile-first responsive design
- Use CSS variables for theming
- Maintain consistent spacing and typography

```tsx
<div className='flex flex-col space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md'>
  <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
    Component Title
  </h2>
</div>
```

## 🧪 Testing Guidelines

### Frontend Testing

- Write unit tests for components using React Testing Library
- Test user interactions and edge cases
- Mock external dependencies
- Aim for 80%+ code coverage

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { PostComposer } from '../PostComposer'

describe('PostComposer', () => {
  it('should update character count when typing', () => {
    render(<PostComposer onSave={jest.fn()} platforms={[]} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Test content' } })

    expect(screen.getByText('12/280')).toBeInTheDocument()
  })
})
```

### Backend Testing

- Write unit tests for services and utilities
- Test API endpoints with Supertest
- Mock external services (Firebase, social media APIs)
- Test error handling and edge cases

```typescript
import request from 'supertest'
import { app } from '../server'

describe('POST /api/v1/posts', () => {
  it('should create a new post', async () => {
    const postData = {
      content: 'Test post content',
      platforms: ['twitter'],
    }

    const response = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${validToken}`)
      .send(postData)
      .expect(201)

    expect(response.body.id).toBeDefined()
    expect(response.body.content).toBe(postData.content)
  })
})
```

## 📚 Documentation Standards

### Code Documentation

- Add JSDoc comments for public functions
- Document complex algorithms and business logic
- Include usage examples for utilities
- Keep comments up-to-date with code changes

### API Documentation

- Document all endpoints with request/response examples
- Include error response formats
- Specify authentication requirements
- Update OpenAPI/Swagger specifications

### Component Documentation

- Document component props and their types
- Include usage examples
- Document accessibility features
- Add Storybook stories for complex components

## 🐛 Bug Reports

### Before Submitting

1. Check existing issues for duplicates
2. Verify the bug in the latest version
3. Test in different browsers/environments
4. Gather relevant information

### Bug Report Template

```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**

1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**

- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 95.0]
- Node.js: [e.g., 18.0.0]

**Additional Context**
Screenshots, logs, or other relevant information.
```

## 💡 Feature Requests

### Before Submitting

1. Check if the feature already exists
2. Search existing feature requests
3. Consider if it fits the project scope
4. Think about implementation complexity

### Feature Request Template

```markdown
**Feature Description**
A clear description of the proposed feature.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Mockups, examples, or related features.
```

## 🔒 Security Guidelines

### Reporting Security Issues

- **DO NOT** create public issues for security vulnerabilities
- Email security concerns to: security@vibetribe.com
- Include detailed information about the vulnerability
- Allow time for investigation before public disclosure

### Security Best Practices

- Never commit sensitive data (API keys, passwords)
- Use environment variables for configuration
- Validate and sanitize all user inputs
- Follow OWASP security guidelines
- Keep dependencies updated

## 📦 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests pass
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Version numbers are bumped
- [ ] Security review completed
- [ ] Performance impact assessed

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different opinions and approaches
- Follow the project's code of conduct

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code review and collaboration
- **Discord**: Real-time community chat (if available)

### Getting Help

- Check existing documentation first
- Search closed issues for similar problems
- Ask specific questions with context
- Provide minimal reproducible examples
- Be patient and respectful

## 🏆 Recognition

### Contributors

We recognize contributors in several ways:

- GitHub contributor graphs
- CONTRIBUTORS.md file
- Release notes mentions
- Community highlights

### Becoming a Maintainer

Regular contributors may be invited to become maintainers based on:

- Consistent high-quality contributions
- Understanding of project goals
- Positive community interactions
- Technical expertise in relevant areas

## 📋 Checklist for Contributors

Before submitting a contribution:

- [ ] Code follows project style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] PR description is clear and complete
- [ ] No merge conflicts exist
- [ ] Security implications considered
- [ ] Performance impact assessed

## 🔗 Useful Resources

### Documentation

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)

### Tools

- [VS Code](https://code.visualstudio.com/) - Recommended editor
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Postman](https://www.postman.com/) - API testing
- [Git](https://git-scm.com/) - Version control

### Learning Resources

- [React Tutorial](https://react.dev/learn)
- [TypeScript Tutorial](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
- [Node.js Tutorial](https://nodejs.dev/learn)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

## 📞 Contact

For questions about contributing:

- Create a GitHub Discussion
- Open an issue with the "question" label
- Contact maintainers directly (see MAINTAINERS.md)

Thank you for contributing to VibeTribe! 🎉
