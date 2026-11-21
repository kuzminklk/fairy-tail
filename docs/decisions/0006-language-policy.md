# 0006. Language policy

## Context

The story, chapter titles, captions, and interface copy are Russian. The
project owner's other repositories and the agents that work on them use English
for code, comments, and documentation. Mixing both without a rule makes reviews
and documentation inconsistent.

## Decision

Keep every user-facing word in Russian: the poem, chapter names, captions,
interface labels, alternative text, and metadata. Keep code identifiers,
comments, README, AGENTS.md, specifications, and decision records in English.
Keep the poem source in `poem.txt` and in `index.html`; preserve Russian
typographic quotes and dashes.

## Alternatives

- Translate the interface to English — changes the art direction and doubles
  content maintenance.
- Write documentation in Russian — would not match the rest of the owner's
  repositories or agent guidance.

## Consequences

- Contributors and agents need both languages.
- Russian text can be reviewed as content, not as code.
- Documentation stays consistent with the surrounding projects.
