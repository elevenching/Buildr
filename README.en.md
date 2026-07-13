# Buildr

[中文](README.md) | English

Buildr is an organizational work-asset management system with AI agents as its primary users.

It turns work content, capabilities, and project structures scattered across employees' experience, documents, repositories, and tools into shared, reusable, and auditable organizational assets available across Agent runtimes.

Agents discover the information and capabilities they need to complete end-to-end work across domains and Services; people express goals, provide judgment, and participate in key decisions through Agents.

## Why Buildr

Agents are becoming more capable, but the experience, capabilities, and knowledge an organization depends on are still fragmented across individual employees and working surfaces:

- Working methods, professional capabilities, and tool practices discovered by one person are passed through documents, meetings, chat, or word of mouth instead of becoming durable organizational assets.
- When a team has no standard Agent client—or wants to switch clients—each person has to rebuild the working environment, and organizational assets drift.
- A business Project often spans multiple Services. An Agent starting in a single repository does not naturally have an end-to-end view of the Project.
- Product, design, development, testing, and release knowledge live in different roles and tools. An Agent often sees only the information inside its immediate working scope and may not discover relevant dependencies from another role or Service.

Buildr turns the experience and capabilities accumulated by individual employees into work assets the organization can maintain together. Team members and supported Agent runtimes start from the same foundation, turning individual discoveries into shared, durable, and continuously evolving organizational value.

## How Buildr Works

```text
People capture shared ways of working
                 │
                 ▼
 Knowledge · Boundaries · Professional Capabilities · Tool Access
 Projects · Services · Specifications · Workflows · ...
                 │
                 ▼
          Buildr workspace
   Shared, auditable work-asset source
                 │
                 ▼ runtime render
        Codex · Claude Code · ...
                 │
                 ▼
 Agents discover relevant assets and form task context
                 │
                 ▼
       Agents do the work and guide decisions
```

Buildr manages organizational work assets, not the context window. It organizes those assets into a shared environment that Agents can discover, select, and use, then projects the required entry points through runtime adapters. The Agent selects what is relevant to the current task and forms the task context carried by its context window.

Buildr does not promise to load every piece of information into the context window, and it does not use fixed role routing to decide semantic relevance for the Agent. It provides organized information, capabilities, and boundaries so an Agent can build relevant and sufficient task context.

```text
Organize work in Buildr. Work through Agents.
```

## Who Benefits

| Audience | Value from Buildr |
|---|---|
| Individual | Capture and reuse proven working methods, professional capabilities, and tool practices, then work with Agents to complete end-to-end tasks across Projects and Services with greater speed and quality |
| Team lead | Turn what individual team members discover into shared assets so people and Agents work from common rules, capabilities, and project structure |
| Enterprise leader | Govern knowledge, experience, and capabilities scattered across individual employees, turning them into organizational assets and value that can be shared, retained, and reused |

Buildr is currently an MVP built on the filesystem, Git, a CLI, and Agent runtime adapters. It is not a complete enterprise permissions, cloud-service, or audit platform. Current capabilities and future directions are kept explicitly separate.

## Common Scenarios

### Share proven team capabilities

Capture working methods, professional capabilities, and tool access in Buildr. Today these can be managed through forms such as Rules, Skills, Command collections, or Components. After synchronizing the workspace, other team members can make the same organizational assets available to their Agents.

### Stay consistent across Agent clients

Buildr maintains standard source assets. Runtime adapters generate the entry points required by supported Agents such as Codex and Claude Code. Switching Agent clients no longer means manually rewriting the organization's ways of working.

### Organize an end-to-end, multi-Service Project

A Project represents a business area, product line, system, or long-running unit of work. A Service represents a code repository, application, or module. Starting from the Buildr workspace lets an Agent understand how those Services are organized instead of receiving one isolated repository at a time.

### Support cross-role collaboration

Product facts, specifications, design constraints, development workflows, test requirements, and release boundaries can be organized as Project or workspace assets. Agents can discover relevant work already captured by other roles when a task requires it, reducing information loss from temporary meetings and manual handoffs.

## Core Model

```text
Organization/Root
  └── Project
        └── Service
```

- **Organization/Root**: the Buildr workspace root containing organization-level Rules, Skills, Components, Commands, and the Project registry.
- **Project**: a business area, product line, system, or long-running unit of work—not a synonym for a single repository. A Project may have its own asset repository.
- **Service**: a code repository, application, module, or executable asset managed by a Project.
- **Agent runtime**: the location where Codex, Claude Code, or another supported Agent reads Buildr assets. It is a reproducible projection, not the source of truth.

The Buildr workspace is the source of work assets; Agent runtimes are rendered results. Buildr does not store binaries, tokens, cookies, login sessions, or private personal configuration. Commands declare and diagnose external CLIs but do not install software or modify the host environment.

## Quick Start

People normally do not need to learn the complete Buildr model or command surface first. Give this README to an Agent and say:

```text
Use Buildr to manage this project.
```

### 1. Choose a Buildr source

#### Published package

```bash
npm install --global @buildr-ai/buildr
buildr --help
```

Before the stable release, use the release candidate documented in [GitHub Releases](https://github.com/elevenching/Buildr/releases). See [Known Limitations](projects/product/docs/known-limitations.md) for the current trial scope.

#### Development checkout

To develop Buildr or try the latest product source directly from the repository:

```bash
git clone https://github.com/elevenching/Buildr.git
cd Buildr/projects/product
tools/install-buildr-cli
buildr --help
```

The installer makes the current checkout's `buildr` available as a local command. Then enter the directory you want Buildr to manage and follow the same initialization flow below. Product maintenance during development should still use `projects/product/buildr` from the current checkout.

### 2. Initialize the workspace and Agent runtime

```bash
buildr runtime list --json
buildr init --agent <agent> --target . --name <name> --profile <personal|team|company>
```

`runtime list` lets the Agent confirm the supported runtime adapters. `init --agent` initializes Organization/Root source assets, prepares the current Agent runtime, and runs a final doctor check. Running `init` without `--agent` initializes source assets only.

After initialization, continue by describing goals to the Agent:

```text
Create a Project for this product and attach the API and Web Services.
Organize our code-review rules and release workflow as shared assets.
Check this workspace and synchronize it to my Agent.
```

The Agent uses the [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md) to understand the goal and select the next action. The corresponding deterministic CLI entry points include:

```bash
buildr project create <project> --target . [--repo <git-url>] [--title <text>] [--description <text>]
buildr service create <project>/<service> <repo-ref> --target .
buildr doctor --agent <agent> --target . --json
```

If the Buildr Skill is not available yet, the Agent can read the fallback guide:

```bash
buildr bootstrap guide
```

## Update and Synchronization

`buildr update` updates the Buildr CLI itself. `buildr sync <agent>` synchronizes workspace product assets and the current Agent runtime. In normal use, tell the Agent to “update Buildr,” “update Buildr only,” or “synchronize the workspace,” and let the Buildr Skill select the correct flow.

See the [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md) for behavior and the [CLI Reference](projects/product/docs/cli-reference.md) for complete parameters.

## Current Capability Summary

- The Buildr Skill lets Agents start from natural-language goals, understand Buildr work assets, select the next action, and guide user decisions.
- The Buildr CLI provides deterministic initialization, asset maintenance, diagnosis, update, synchronization, and runtime rendering.
- Runtime adapters currently support `claude-code`, `codex`, `cursor`, `qoder`, `trae`, `trae-work`, and `workbuddy`. Run `buildr runtime list --json` for machine-readable facts and see [Agent Runtime Adapters](projects/product/docs/agent-runtime-adapters.md) for integration paths and verification status.
- Rules support Root, Project, Service, and deeper workspace scopes through native discovery, scoped vendor rule files, or managed reference bridges, depending on the Agent.
- Workspace and Project Skills support locally authored and resolved remote sources.
- Workspace Components manage Rules, Skills, Command collections, and declarative Skill Contributions. Project/Service Components are not currently supported.
- Commands declare and diagnose shared external CLIs without installing software or modifying the host environment.
- Buildr source mutations use strict identity, scope, and ownership validation, atomic writes, and workspace transactions. Doctor reports incomplete transactions fail-closed.
- Workspace assets currently ship with the CLI package. Independent asset versioning, complete enterprise permissions, and more runtime adapters remain future directions.

## Documentation

- [Buildr Product](projects/product/docs/buildr-product.md): positioning, problems, core model, work assets, collaboration, and future directions.
- [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md): the primary Agent entry point for understanding and using Buildr.
- [Current State](projects/product/openspec/knowledge/buildr-current-state.md): implemented product facts.
- [OpenSpec Specifications](projects/product/openspec/specs/): normative behavior contracts.
- [CLI Reference](projects/product/docs/cli-reference.md): public commands and parameter boundaries.
- [Agent Runtime Adapters](projects/product/docs/agent-runtime-adapters.md): Rules and Skills paths, activation, checker behavior, limitations, and evidence status for each integrated Agent.
- [Documentation Index](projects/product/docs/document-index.md): responsibilities of README, docs, knowledge, specs, and archive.
- [Roadmap](projects/product/docs/roadmap/): future directions, not current product facts or approved implementation contracts.
- [Release Checklist](projects/product/docs/release-checklist.md): publication readiness and verification entry points.
- [Known Limitations](projects/product/docs/known-limitations.md): current trial scope and unsupported capabilities.
- [Minimal Workspace Example](projects/product/examples/minimal-workspace/README.md): the minimal high-level onboarding path.

## Buildr Bootstrap Workspace

This repository is also the bootstrap workspace used to develop, verify, and consume Buildr itself. It is a Buildr Organization/Root instance.

If you entered this repository through the development-checkout path in Quick Start, keep its two layers distinct: Buildr product source lives only under `projects/product/`; root Rules, Skills, Components, Commands, and Agent runtime files are state consumed by this bootstrap workspace, not product source.

When developing or verifying Buildr, always use the CLI from the current Product checkout so another locally installed `buildr` source cannot be used by mistake:

```bash
projects/product/buildr runtime list --json
projects/product/buildr doctor --agent <agent> --target . --json
```

Repository entry points:

- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [MIT License](LICENSE)
- [GitHub Issues](https://github.com/elevenching/Buildr/issues)
