# Routing & Navigation Rail

## Core Principles
- Routes should be declarative and centralized in a single source of truth
- Navigation logic MUST be decoupled from UI components
- Deep links and direct URL access must work for every valid route

## Route Structure
- Define routes in a hierarchy that mirrors the application structure
- Use lazy-loading or code-splitting for routes that are not part of the initial critical path
- Every route MUST have a clear name/identifier used for programmatic navigation

## Guards & Access Control
- Authentication and authorization checks MUST happen before rendering the target
- Redirect unauthenticated users to a defined entry point (login, onboarding, etc.)
- Never rely solely on UI hiding for access control — enforce it at the routing layer

## Navigation Patterns
- Use named navigation instead of hardcoded paths in components
- Handle browser back/forward gracefully; do not break native history expectations
- Loading and error states MUST be defined at the route level, not inside every component
