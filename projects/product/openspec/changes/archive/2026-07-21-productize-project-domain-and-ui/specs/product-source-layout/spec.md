## ADDED Requirements

### Requirement: Project 产品切片必须遵守新源码分层
Buildr MUST separate Project Domain, Application, filesystem/Git Infrastructure and CLI/HTTP/Web Interfaces.

#### Scenario: Project Domain 保持纯净
- **WHEN** architecture verifier scans Project Domain imports
- **THEN** Domain MUST NOT import filesystem, YAML, Git process, HTTP, CLI, runtime, tests or repository implementations
- **AND** Domain MUST contain only Project entity, ProjectSource value object and pure validation

#### Scenario: Project Interfaces 读取和修改
- **WHEN** CLI, doctor, HTTP or Web handles Project data
- **THEN** interface MUST call Project Application use cases
- **AND** interface MUST NOT directly parse or write `projects/manifest.yml` or execute Git observation commands

#### Scenario: Project adapters 实现 ports
- **WHEN** Application reads/writes registry or queries actual Git state
- **THEN** filesystem repository MUST own path/YAML/atomic revision details and Git observer MUST own bounded process execution
- **AND** adapters MUST NOT decide editable field policy, migration authorization or diagnostic severity
