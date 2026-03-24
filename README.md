# mcplinx-packages

This repository contains the current contents of `mcplinx/packages` as a standalone workspace monorepo.

Mount points:

- `mcplinx` mounts this repository at `packages/`
- other consumers may mount this repository at a project-specific path

Bootstrap:

```bash
git submodule update --init --recursive
```
