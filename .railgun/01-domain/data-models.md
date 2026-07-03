# Data Models & Boundaries

This file defines the hard constraints and validation rules for all data structures.

## Global Rules
- Every field MUST have a defined type, maximum length, and nullability
- Numeric fields MUST specify precision, scale, and valid ranges
- String fields MUST specify max length and allowed character sets
- Dates MUST include timezone rules or be explicitly UTC

## Entity Constraints

| Entity | Field | Type | Min | Max | Nullable | Notes |
|--------|-------|------|-----|-----|----------|-------|
| | | | | | | |

## Validation Rules
- Validation MUST happen at the system boundary (API input, form submission)
- Business rule validation (e.g., "order cannot exceed $10,000") belongs here, not in UI code
- Failed validations MUST return explicit, actionable error messages using glossary terms
