# Buildr

[中文](README.md) | English

## Let Agents Do More—and Do It Better

Buildr is a work asset management tool for the AI era. It turns how individuals and organizations work—and the facts their work depends on—into work assets that Agents can discover, select, and use.

You direct. Agents build. You own the assets. You can switch Agents.

You keep talking to the Agent; the Agent uses Buildr to manage work assets and select what the current task needs.

Buildr is not another Agent and does not compete with one. It helps the Agent you already use take on more work with accumulated facts and methods, so work becomes more consistent and improves over time.

## Three Core Values

### 1. From Product to Release, End to End

Buildr lets one requirement move through PRD, design, development, testing, CI/CD, and release in the same Agent window, continuously using the same work assets.

If every stage starts by re-explaining the background and moving documents around, an Agent cannot reliably finish the whole job. Buildr lets the Agent finish one stage and move directly to the next using the facts and methods already available.

**Buildr itself is developed this way**: discussions, OpenSpec proposals, implementation, testing, Git, GitHub Actions, and npm releases all happen in one Agent window.

Team collaboration works the same way. Product maintains PRDs, Specs, and project facts in the Project. When those facts change, the Agents used by design, development, and testing continue from the updated source.

### 2. You Own the Assets. Switch Agents Freely.

Different teams and tasks use different Agents. If Rules and Skills are locked inside one Agent tool, switching Agents means rebuilding everything.

Work assets should not be tied to an Agent tool. Buildr keeps them in an independent Workspace controlled by an individual or organization, then generates the native entry point each Agent needs. You switch the Agent, not what you have accumulated.

Buildr currently works with seven Agent types—one asset set, different entry points.

### 3. People and Teams Change. Assets Remain.

When critical work methods and project facts exist only in personal experience, local files, or chat history, they disappear as people change. The next person has to understand the project, repeat the same experiments, and rebuild the same methods.

Buildr stores work assets in the filesystem, where Git can manage them. Individuals can reuse their methods across tasks and Projects. Teams and organizations keep their accumulated project facts, Rules, and Skills when people change. The next person can continue from that foundation through an Agent.

## How Buildr Works

Buildr work assets can be understood in two parts:

- **Work methods**: how work gets done—Rules, Skills, and Commands that capture how an individual or organization works
- **Work facts**: what the work is about—project documents, Specs, Service information, code repositories, and their relationships

People direct Agents. Agents manage assets:

```text
You say, "Turn our team's release process into a Skill"
  → Agent uses Buildr Skill to understand the goal
    → calls Buildr CLI
      → The release process becomes a reusable Skill and is rendered to Agent runtime
```

An Agent uses Buildr through **Buildr CLI + Buildr Skill**:

- **Buildr CLI**: creates, updates, synchronizes, and diagnoses work assets
- **Buildr Skill**: tells the Agent how to understand goals and choose and verify Buildr CLI operations

Buildr stores work asset source files in the filesystem, where Git can manage them. Agent runtimes are rendered from those source files. The core model is:

```text
Workspace (personal / team / company)
  └── Project
        └── Service
```

A Workspace has the following filesystem structure:

```text
workspace/
├── rules/                 # Rules and boundaries the Agent follows
├── skills/                # Reusable professional actions and workflows
├── components/            # Shared lifecycle for groups of Rules, Skills, and Commands
├── commands/              # Declarations and checks for external CLIs
├── projects/
│   └── <project>/
│       ├── project documents · Specs · Skills
│       └── services/
│           └── <service>/ # Repository, application, or module
└── Agent runtime entries  # Rendered native entry points; rebuildable, not the source of truth
```

| Object | Description |
|---|---|
| Workspace | The work asset root for an individual, team, or company |
| Project | A business or product unit containing project facts, Skills, and Service relationships |
| Service | A repository, application, or module used by a Project |

Buildr manages long-lived work assets. It does not directly fill a model's context window. The Agent discovers and selects relevant content for the current task and forms its own task context.

## Quick Start

Give this README to an Agent, then say:

```text
Use Buildr to manage this project.
```

The Agent should complete the following initialization flow. This section is mainly for the Agent; people only need to understand the outline.

**1. Prepare Node.js and Buildr CLI**

Buildr requires Node.js 20 or later. First check the Node.js version and whether the `buildr` command is available. If a requirement is not met, ask the user before installing or upgrading:

- **Pre-release (currently recommended for evaluation)**: `npm install --global @buildr-ai/buildr@next`
- **Development checkout**: after the user confirms where to save it, run `git clone https://github.com/elevenching/Buildr.git <path>`, then use `<path>/projects/product/buildr`

In the commands below, `buildr` means the selected entry point: the global command for the pre-release or `<path>/projects/product/buildr` for a development checkout.

**2. Initialize the Workspace**

After the CLI is ready, identify the current Agent runtime and initialize the Workspace:

```bash
buildr runtime list --json
buildr init --agent <agent> --target . --name <name> --profile <personal|team|company>
```

`init --agent` initializes Workspace source assets, prepares the current Agent runtime, and uses a successful final doctor check as its completion condition.

The Agent must consider initialization complete only when all three conditions are met:

- Workspace source assets have been created
- The current Agent runtime is ready
- The final doctor check has passed

**3. Start Working**

After initialization, state goals directly:

```text
Create the payment Project and use <git-url> as its asset repository.
Attach <git-url> as the payment/api Service.
Turn our release process into a Skill.
Update Buildr and synchronize the Workspace.
```

The Agent uses Buildr Skill to understand the goal and Buildr CLI for deterministic execution.

Buildr is currently in pre-release. Use [GitHub Releases](https://github.com/elevenching/Buildr/releases) as the source of truth for versions and installation sources.

## Current Capabilities

- One Workspace manages multiple Projects; each Project manages multiple Services
- Unified management of Rules, Skills, Components, and Commands
- Seven Agent runtime adapters: `claude-code`, `codex`, `cursor`, `qoder`, `trae`, `trae-work`, and `workbuddy`

See [Known Limitations](projects/product/docs/known-limitations.md) for current boundaries.

## Documentation

- [Buildr Product](projects/product/docs/buildr-product.md): complete positioning, core model, boundaries, and Roadmap
- [Buildr Skill](projects/product/package/targets/runtime/skills/buildr/SKILL.md): the primary entry point for Agents using Buildr
- [CLI Reference](projects/product/docs/cli-reference.md): public commands and parameters
- [Runtime Adapters](projects/product/docs/agent-runtime-adapters.md): integration paths and limitations for each Agent
- [OpenSpec Specifications](projects/product/openspec/specs/): normative product behavior contracts

## Buildr Bootstrap Workspace

This repository is also the Workspace in which Buildr develops itself. Product source lives only under `projects/product/`; root-level assets are consumed state.

```bash
projects/product/buildr runtime list --json
projects/product/buildr doctor --agent <agent> --target . --json
```

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [MIT License](LICENSE) · [GitHub Issues](https://github.com/elevenching/Buildr/issues)
