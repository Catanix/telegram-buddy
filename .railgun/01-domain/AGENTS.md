# 01-domain: Business Logic

**Load this layer when the task involves: naming anything, business entities, data models, validation rules, or multi-step workflows.**

This layer defines WHAT the product is and how the business speaks. Read-Only for AI during normal development.

## Navigation Map

Pick the rail that matches your task:

- **Naming & Language** → Read `glossary.md`
  - Mandatory when: naming variables, functions, files, database tables, or API endpoints
  - Covers: Ubiquitous Language, forbidden synonyms, canonical terms

- **Data Models & Boundaries** → Read `data-models.md`
  - Mandatory when: defining or modifying schemas, validations, or type definitions
  - Covers: field constraints, numeric limits, string lengths, relationship rules

- **Business Flows** → Read `core-flows.md`
  - Mandatory when: implementing multi-step processes, state machines, or transactional logic
  - Covers: sequence of operations, side effects, rollback rules

## Layer Rules

- Use ONLY terms from `glossary.md`. Never invent synonyms.
- Respect mathematical boundaries in `data-models.md` (max lengths, ranges, precision)
- Business flows MUST match the sequences defined in `core-flows.md`
