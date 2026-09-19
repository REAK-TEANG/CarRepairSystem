# Agent Customizations

This `.agents` folder is the workspace customizations root for this project. Antigravity automatically discovers customizations by traversing this directory.

Here is how you can organize this folder:

- **`rules/`**: Markdown files (`*.md`) placed here act as rules (e.g., coding styles, API restrictions).
- **`skills/`**: Folders placed here contain workflows. Each skill must have a `SKILL.md` file.
- **`plugins/`**: Packages of related skills, rules, and MCP configs.
- **`mcp_config.json`**: For integrating with MCP servers.
- **`hooks.json`**: For running scripts at specific agent lifecycle points.

You can also place a `GEMINI.md` or `AGENTS.md` file at the root of your project to define global rules for the repository.
