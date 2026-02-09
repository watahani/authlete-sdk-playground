#!/usr/bin/env python3
import re
import sys
import urllib.request
from pathlib import Path

REMOTE_POM_URL = "https://raw.githubusercontent.com/authlete/java-oauth-server/master/pom.xml"
LOCAL_POM_PATH = Path("java-jaxrs/pom.xml")


def extract_properties(xml_text: str) -> dict:
    m = re.search(r"<properties>(.*?)</properties>", xml_text, flags=re.S)
    if not m:
        return {}
    block = m.group(1)
    props = {}
    for key, value in re.findall(r"<([A-Za-z0-9_.-]+)>([^<]+)</\1>", block):
        props[key] = value.strip()
    return props


def main() -> int:
    if not LOCAL_POM_PATH.exists():
        print(f"Local pom not found: {LOCAL_POM_PATH}", file=sys.stderr)
        return 2

    with urllib.request.urlopen(REMOTE_POM_URL) as resp:
        remote_xml = resp.read().decode("utf-8")

    local_xml = LOCAL_POM_PATH.read_text(encoding="utf-8")

    remote_props = extract_properties(remote_xml)
    local_props = extract_properties(local_xml)

    if not remote_props:
        print("No <properties> found in remote pom.", file=sys.stderr)
        return 3

    if not local_props:
        print("No <properties> found in local pom.", file=sys.stderr)
        return 4

    updated = []
    new_xml = local_xml

    for key, local_value in local_props.items():
        if key not in remote_props:
            continue
        remote_value = remote_props[key]
        if remote_value == local_value:
            continue
        pattern = rf"(<{re.escape(key)}>)([^<]*)(</{re.escape(key)}>)"
        if re.search(pattern, new_xml):
            def _repl(match):
                return f"{match.group(1)}{remote_value}{match.group(3)}"

            new_xml = re.sub(pattern, _repl, new_xml, count=1)
            updated.append((key, local_value, remote_value))

    if updated:
        LOCAL_POM_PATH.write_text(new_xml, encoding="utf-8")
        print("Updated properties:")
        for key, before, after in updated:
            print(f"- {key}: {before} -> {after}")
    else:
        print("No updates needed.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
