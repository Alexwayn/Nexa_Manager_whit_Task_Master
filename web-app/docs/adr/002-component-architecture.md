# ADR-002: Component Architecture Pattern

## Status
Accepted

## Date
2025-06-24

## Context
The Nexa Manager application requires a scalable component architecture that can handle:
- Complex business logic
- Reusable UI components
- Consistent styling patterns
- Easy testing and maintenance
- Clear separation of concerns
- Code reusability across features

## Decision
We adopted a feature-based component architecture with the following patterns:

### Directory Structure
```
src/
├── components/
│   ├── common/          # Shared utilities (ErrorBoundary, etc.)
│   ├── shared/          # Reusable UI components (Modal, Button, etc.)
│   ├── [feature]/       # Feature-specific components
│   └── hoc/            # Higher-order components
├── pages/              # Page-level components
├── hooks/              # Custom React hooks
├── context/            # React Context providers
├── lib/                # Service layer (API calls, utilities)
└── types/              # TypeScript type definitions
```

### Component Patterns
- **Container/Presentational Pattern**: Separate data logic from UI logic
- **Custom Hooks Pattern**: Extract stateful logic into reusable hooks
- **Compound Components**: For complex UI components with multiple parts
- **Render Props**: For flexible component composition when needed

## Alternatives Considered

### Atomic Design vs Feature-Based
- Atomic Design: atoms/molecules/organisms/templates
- Feature-Based: Group by business domain
- **Decision**: Feature-based for better maintainability and team collaboration

### Redux vs Context + Hooks
- Redux: Mature state management, DevTools, middleware
- Context + Hooks: Simpler, built-in, less boilerplate
- **Decision**: Context + Hooks for application simplicity

### Class Components vs Function Components
- Class Components: Traditional React patterns
- Function Components: Modern React with hooks
- **Decision**: Function Components only for consistency and modern patterns

## Consequences

### Positive
- Clear separation between business logic and UI
- Reusable components across features
- Easy to test individual components
- Better developer experience with TypeScript
- Consistent patterns across the codebase
- Custom hooks promote logic reuse

### Negative
- Initial setup overhead for establishing patterns
- Learning curve for developers new to hooks pattern
- Context can cause unnecessary re-renders if not optimized
- More files to manage in feature directories

### Neutral
- Need to maintain consistency across team members
- Regular refactoring needed as patterns evolve

## Implementation Notes

### Component Guidelines
- Use TypeScript interfaces for all props
- Implement proper error boundaries
- Use memo() for expensive components
- Follow naming conventions: PascalCase for components
- Export components from index files for clean imports

### Hook Guidelines
- Prefix custom hooks with "use"
- Return arrays for multiple values, objects for related data
- Include proper dependencies in useEffect
- Use useCallback and useMemo for optimization

### Testing Guidelines
- Test behavior, not implementation
- Use React Testing Library patterns
- Mock external dependencies
- Test error states and edge cases

## References
- [React Component Patterns](https://react.dev/learn/thinking-in-react)
- [Custom Hooks Guide](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [TypeScript React Patterns](https://react-typescript-cheatsheet.netlify.app/) 