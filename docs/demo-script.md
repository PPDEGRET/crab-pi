# Demo script

This is the short architecture demo. It is deliberately separate from the real `crab` command.

## Before recording

```powershell
npm run verify
```

Keep the terminal and [architecture explorer](../explorer/index.html) visible.

## 0:00–0:15 — The point

> “Crab is the setup I run around Pi. Pi supplies the agent harness. I added the routing rules, isolated state, prompts, patches, permissions and verification that make the whole thing useful for my day-to-day work.”

## 0:15–0:30 — The real command

```powershell
crab --version
crab doctor
```

> “The default command launches the pinned Pi CLI. The demo has its own explicit command, so there is no way to confuse the explanation with the product.”

## 0:30–0:50 — The operating route

```powershell
crab demo
```

> “The primary agent bounds one scout, a separate reviewer challenges the proposal, local checks verify the public fixture, and the human makes the external-effect decision.”

## 0:50–1:10 — The Windows detail

Open [patch-notes.md](patch-notes.md).

> “Multiline prompts are transported as structured argv data instead of a quoted shell string. The round-trip test covers spaces, newlines and mixed quotes.”

## 1:10–1:25 — The honest boundary

Open [attribution.md](attribution.md) and [evidence-and-limitations.md](evidence-and-limitations.md).

> “I built the Crab layer; I did not build Pi or the extensions. The repo tells you exactly what is upstream, what I changed, what passes now, and what I still have not measured.”
