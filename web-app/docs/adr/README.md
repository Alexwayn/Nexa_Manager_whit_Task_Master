# Architectural Decision Records (ADRs)

This directory contains the Architectural Decision Records for the Nexa Manager project.

## What are ADRs?

Architectural Decision Records (ADRs) are documents that capture important architectural decisions made during development, along with their context and consequences.

## Format

Each ADR follows this format:
- **Title**: Brief noun phrase describing the decision
- **Status**: Proposed, Accepted, Deprecated, or Superseded
- **Context**: The situation that led to this decision
- **Decision**: The chosen solution
- **Consequences**: The positive and negative outcomes

## Index of ADRs

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](./001-tech-stack-selection.md) | Technology Stack Selection | Accepted | 2025-06-24 |
| [ADR-002](./002-component-architecture.md) | Component Architecture Pattern | Accepted | 2025-06-24 |
| [ADR-003](./003-state-management.md) | State Management Strategy | Accepted | 2025-06-24 |
| [ADR-004](./004-database-orm-choice.md) | Database and ORM Choice | Accepted | 2025-06-24 |
| [ADR-005](./005-authentication-strategy.md) | Authentication Strategy | Accepted | 2025-06-24 |
| [ADR-006](./006-testing-strategy.md) | Testing Strategy and Tools | Accepted | 2025-06-24 |
| [ADR-007](./007-code-quality-tools.md) | Code Quality and Formatting Tools | Accepted | 2025-06-24 |
| [ADR-008](./008-performance-optimization.md) | Performance Optimization Approach | Accepted | 2025-06-24 |

## How to Create a New ADR

1. Copy the [template](./000-template.md)
2. Name it with the next number in sequence: `XXX-title-in-kebab-case.md`
3. Fill in the template
4. Update this README with the new ADR
5. Submit for review

## References

- [ADR Guidelines](https://adr.github.io/)
- [ADR Tools](https://github.com/npryce/adr-tools) 