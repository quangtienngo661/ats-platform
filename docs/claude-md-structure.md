# Project: <Project Name>

## 1. Overview
- What the project's purpose is (1-2 sentences, doesn't need to be long)
- Current phase (e.g., "Phase 2 — expanding payment features")

## 2. Tech Stack
- Language, framework, specific versions
- DB, ORM, cache, queue, etc.
- Main build/test/deploy tools

## 3. Directory Structure
- Brief explanation of important directories (no need to list everything, just the confusing parts)
- Clearly mark "legacy" areas (avoid touching) vs "new standard" areas (follow as template)

## 4. Code Conventions
- Naming conventions, import structure, code style
- Standard error handling pattern
- Project-specific best practices (with before/after examples if needed)

## 5. Current Anti-patterns — DO NOT Follow
- List clearly the bad patterns that exist in the legacy code
- Specify clearly: when refactoring is mandatory vs. when it's just "don't repeat this further"

## 6. Important Commands
- Most commonly used build/test/lint/migrate commands
- Commands that should NOT be run without asking first (e.g., migrating on prod)

## 7. Safety Rules / Boundaries
- Files/directories that must not be edited (generated code, sensitive config)
- Dangerous actions that require confirmation before doing (deleting data, force push, deploy)

## 8. Architecture & Key Decisions
- Summary of major decisions (or point to docs/adr/)
- Direction for the next phase (brief roadmap)

## 9. Testing
- Test framework, minimum required coverage
- How to mock external services (DB, third-party APIs)

## 10. Other Notes
- Links to more detailed documentation (README, ADR, internal wiki)
- Person/team responsible for each module (if needed)