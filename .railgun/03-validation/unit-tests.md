# Unit Testing Rail

## Structure: AAA Pattern
Every test MUST follow Arrange → Act → Assert:
1. **Arrange:** Set up mocks, fixtures, and initial state
2. **Act:** Execute the single unit of behavior being tested
3. **Assert:** Verify exactly one outcome per test case

## Mocking Rules
- Mock all external dependencies: network, filesystem, database, timers, randomness
- Never make real network requests in unit tests
- Mocks MUST be reset between tests to prevent state leakage
- Prefer explicit mock setup over global auto-mocks

## Assertions
- One logical assertion per test; if you need more, split the test
- Assert on outcomes (results, state changes), not implementation details (internal call counts)
- Error cases MUST be tested explicitly, not just the happy path

## Test Data
- Use factory functions or builders for complex objects, not copy-pasted literals
- Never use production data, PII, or real credentials in tests
- Keep test data co-located with the test or in a dedicated `__fixtures__` directory

## Forbidden Patterns
- Tests that depend on execution order of other tests
- Tests with non-deterministic inputs (random, Date.now(), network) without mocking
- Tests that assert on internal implementation rather than public behavior

## CLI-Specific Testing

### Mocking Interactive Prompts (Inquirer)
```typescript
import inquirer from 'inquirer';

jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

const mockedInquirer = inquirer as jest.Mocked<typeof inquirer>;

// In test:
mockedInquirer.prompt.mockResolvedValueOnce({ confirmed: true });
mockedInquirer.prompt.mockResolvedValueOnce({ mode: 'skip' });
```

### Filesystem Testing
- Use `fs.mkdtemp()` for temp directories
- Always `process.chdir()` into temp dir
- Clean up with `fs.remove()` in `afterEach`
- Assert on file existence AND content

### Test Isolation
- Reset mocks with `jest.resetAllMocks()` in `beforeEach`
- Never share temp directories between tests
- Each test gets fresh filesystem state

### Required CLI Test Cases
1. **Happy path:** Command creates expected structure
2. **Existing files:** Command preserves existing configs
3. **User decline:** Command exits gracefully when user says "no"
4. **Integration modes:** Auto, Manual, Skip modes work correctly
5. **Idempotency:** Running twice doesn't break anything

