#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import yaml


def fail(message: str) -> None:
    raise SystemExit(message)


def require_relative_path(root: Path, value: str, expected_name: str) -> None:
    if value != f"./{expected_name}" and value != f"./{expected_name}/":
        fail(f"plugin.json field for {expected_name} must resolve to {expected_name}")
    target = root / expected_name
    if not target.exists():
        fail(f"{expected_name} is required when plugin.json references it")


def validate_skill(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        fail(f"{path} must start with YAML frontmatter")
    parts = text.split("---\n", 2)
    if len(parts) < 3:
        fail(f"{path} frontmatter is not closed")
    meta = yaml.safe_load(parts[1])
    if not isinstance(meta, dict):
        fail(f"{path} frontmatter must be a YAML object")
    if not meta.get("name") or not re.fullmatch(r"[a-z0-9-]+", str(meta["name"])):
        fail(f"{path} must define a kebab-case name")
    if not meta.get("description"):
        fail(f"{path} must define a description")


def validate_plugin(root: Path) -> None:
    manifest_path = root / ".codex-plugin" / "plugin.json"
    if not manifest_path.exists():
        fail("Required artifact file is missing: .codex-plugin/plugin.json")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for field in ["name", "version", "description", "author", "interface"]:
        if field not in manifest:
            fail(f"plugin.json missing required field: {field}")
    if "[TODO:" in manifest_path.read_text(encoding="utf-8"):
        fail("plugin.json contains TODO placeholder")

    skills_value = manifest.get("skills")
    if skills_value:
        require_relative_path(root, skills_value, "skills")
        skill_files = sorted((root / "skills").glob("*/SKILL.md"))
        if not skill_files:
            fail("skills directory must include at least one */SKILL.md")
        for skill_file in skill_files:
            validate_skill(skill_file)

    mcp_value = manifest.get("mcpServers")
    if mcp_value:
        require_relative_path(root, mcp_value, ".mcp.json")
        json.loads((root / ".mcp.json").read_text(encoding="utf-8"))

    print(f"Plugin validation passed: {root}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("plugin_root")
    args = parser.parse_args()
    validate_plugin(Path(args.plugin_root).resolve())


if __name__ == "__main__":
    main()
