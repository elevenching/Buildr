# Buildr

[中文](README.md) | English

Buildr is a work-asset governance system for people, agents, and organizations.

It turns reusable rules, skills, command declarations, specifications, product knowledge, and collaboration workflows into a shared, auditable workspace that can be projected to different Agent runtimes.

```text
Manage assets in Buildr. Work through Agent.
```

## Core Model

Buildr turns a working directory into a workspace. The workspace is the organization-level asset root for an individual or a team.

```text
Organization/Root
  └── Project
        └── Service
```

- **Organization/Root**: organization-level Rules, Skills, Components, Commands, and Project registry.
- **Project**: a product line, system, business area, or long-running unit of work; it may use its own Git repository.
- **Service**: a code repository, application, module, or executable asset managed by a Project.
- **Agent runtime**: the runtime location where Claude Code, Codex, or another supported Agent consumes Buildr assets. It is a reproducible projection, not the source of truth.

Buildr stores source work assets. It does not store binaries, tokens, cookies, login sessions, or personal private configuration.

## Agent-First Reasoning and Guidance

Buildr treats both people and Agents as first-class users. People express goals, provide business judgment, and confirm important decisions. Agents interpret workspace context, map intent to the right asset type, diagnose current state, and guide the next action.

The [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md) is the primary product entry point for Agents. It helps an Agent:

- understand Organization/Root, Project, Service, Rules, Skills, Components, Commands, and Agent runtime;
- select initialization, update, synchronization, diagnosis, or asset-maintenance actions from user intent;
- explain conflicts, risks, and decisions that require human judgment;
- use the Buildr CLI as a deterministic execution and verification layer.

People normally do not need to learn the complete command surface first. Describe the goal to an Agent and let the Buildr Skill guide the workflow. The CLI remains directly usable by advanced users and provides the same verifiable operations.

## Quick Start

The simplest approach is to give this README to an Agent and say:

```text
Use Buildr to manage this project.
```

Buildr distinguishes a local development checkout from an installed registry package based on the actual CLI source.

### Developer Mode: Local Git Checkout

```bash
git clone https://github.com/elevenching/Buildr.git
cd Buildr/projects/product
tools/install-buildr-cli
buildr --help
```

When runtime dependencies are missing, the installer runs `npm ci --omit=dev` from `package-lock.json`, then installs the checkout command into `~/.local/bin`. Set `BUILDR_CLI_INSTALL_DIR` to use a different directory.

### Release Mode: npm Registry Package

```bash
npm install --global @buildr-ai/buildr@next
buildr --help
```

The current public preview is [`0.1.0-rc.1`](https://github.com/elevenching/Buildr/releases/tag/v0.1.0-rc.1); `next` is reserved for release candidates. To report a problem or share feedback, open a [GitHub Issue](https://github.com/elevenching/Buildr/issues/new/choose). Report security vulnerabilities privately through the [Security Policy](SECURITY.md). See [Known Limitations](projects/product/docs/known-limitations.md) for the current trial boundaries.

### Initialize a Workspace

Both installation modes use the same onboarding flow:

```bash
buildr runtime list --json
buildr init --agent <agent> --target . --name <name> --profile <personal|team|company>
```

`init --agent` initializes the Organization/Root source assets and the selected Agent runtime, then runs a final doctor check. Running `init` without `--agent` initializes source assets only.

After initialization, the current Agent runtime receives the Buildr Skill. You can continue by describing goals such as creating a Project, attaching a Service, maintaining work assets, or diagnosing the workspace.

```bash
buildr project create <project> --target . [--repo <git-url>] [--title <text>] [--description <text>]
buildr service create <project>/<service> <repo-ref> --target .
buildr doctor --agent <agent> --target . --json
```

If the main Agent entry point is unavailable, use the fallback guide:

```bash
buildr bootstrap guide
```

## Update and Synchronization

`buildr update` updates the Buildr CLI itself. `buildr sync <agent>` synchronizes workspace assets and the current Agent runtime. In normal use, tell the Agent to “update Buildr,” “update Buildr only,” or “synchronize the workspace,” and let the Buildr Skill select the correct flow. See the [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md) and [CLI Reference](projects/product/docs/cli-reference.md) for details.

## Current Capability Summary

- The Buildr Skill lets Agents interpret natural-language goals, understand context, select Buildr capabilities, and guide decisions.
- The Buildr CLI provides deterministic initialization, asset maintenance, diagnosis, update, synchronization, and runtime rendering.
- Runtime adapters currently support `claude-code` and `codex`; run `buildr runtime list --json` for the current matrix.
- Rules support Root, Project, Service, and deeper workspace scopes. Codex reads them natively; Claude Code uses generated reference bridges.
- Workspace and Project Skills support local authored sources and resolved remote sources.
- Workspace Components manage Rules, Skills, Command collections, and declarative Skill Contributions. Project/Service Components are not currently supported.
- Commands declare and diagnose shared external CLI tools without modifying the host environment.
- Buildr source mutations use strict identity and scope/ownership validation, atomic writes, and workspace transactions. Doctor reports incomplete transactions fail-closed.
- Workspace assets currently ship with the CLI package. Independent asset versioning remains a Roadmap direction, not a current capability.

## Documentation

- [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md): primary Agent entry point for understanding and using Buildr.
- [Buildr Product](projects/product/docs/buildr-product.md): positioning, model, assets, collaboration, and future direction.
- [Current State](projects/product/openspec/knowledge/buildr-current-state.md): implemented product facts.
- [OpenSpec Specifications](projects/product/openspec/specs/): normative behavior contracts.
- [CLI Reference](projects/product/docs/cli-reference.md): public commands and parameter boundaries.
- [Documentation Index](projects/product/docs/document-index.md): responsibilities of README, docs, knowledge, specs, and archive.
- [Roadmap](projects/product/docs/roadmap/): future directions, not current product facts.
- [Release Checklist](projects/product/docs/release-checklist.md): publication readiness and verification entry points.
- [Known Limitations](projects/product/docs/known-limitations.md): current trial scope and unsupported capabilities.
- [Minimal Workspace Example](projects/product/examples/minimal-workspace/README.md): minimal high-level onboarding path.

## Buildr Bootstrap Workspace

This repository is also the bootstrap workspace used to develop, verify, and consume Buildr itself. It is a Buildr Organization/Root instance.

- Product source lives only under `projects/product/`, including the CLI, package assets, product documentation, and OpenSpec.
- Root Rules, Skills, Components, Commands, and Agent runtime files are the state consumed by this workspace, not product source.
- `projects/product/buildr` is the local CLI entry point for the current Product checkout.

```bash
projects/product/buildr runtime list --json
projects/product/buildr doctor --agent <agent> --target . --json
```

Repository entry points:

- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [MIT License](LICENSE)
- [GitHub Issues](https://github.com/elevenching/Buildr/issues)
