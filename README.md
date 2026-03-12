# mcplinx-packages

This repository contains the current contents of `mcplinx/packages` as a standalone workspace monorepo.

Mount points:

- `mcplinx` mounts this repository at `packages/`
- `botworks` mounts this repository at `mcplinx-packages/`

Bootstrap:

```bash
git submodule update --init --recursive
```
