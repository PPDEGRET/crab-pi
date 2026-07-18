---
description: Review abstractions, type contracts, and architecture boundaries
argument-hint: "[scope]"
---
# Review: Abstractions and Boundaries

Use when reviewing whether abstractions, types, contracts, and layer boundaries are making the codebase clearer or more indirect.

## Questions

- Is this abstraction deep enough to earn its interface?
- Are wrappers, helpers, adapters, or services mostly pass-through?
- Is generic or magical handling hiding a simple data shape?
- Are `any`, `unknown`, casts, optional fields, or silent fallbacks hiding the real invariant?
- Is logic in the canonical package/module/layer that owns the concept?
- Is the change duplicating an existing helper or bypassing a canonical path?

## Flag

- thin wrappers and identity abstractions;
- cast-heavy or optionality-heavy contracts;
- ad-hoc object shapes where a shared model should exist;
- feature logic leaking into shared paths;
- bespoke utilities that duplicate canonical helpers;
- APIs that expose implementation details to callers.

## Output

For each issue, name the unclear boundary, the maintenance cost, and the concrete move: delete, inline, deepen, type explicitly, reuse canonical helper, or move to the owning layer.

## User arguments

$ARGUMENTS
