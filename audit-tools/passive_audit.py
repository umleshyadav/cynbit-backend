#!/usr/bin/env python3
"""
Cynbit Passive Backend Audit Tool
=================================
Performs 100% passive, authorized, non-intrusive observation of publicly available
HTTP response headers, Next.js Server Action references, client bundles, and routing behaviour.
No disruption, overload, or exploit attempts.
"""

import urllib.request
import urllib.error
import re
import json
import os
import sys

TARGET_DOMAINS = ["https://www.cynbit.in", "https://cynbit.in"]
CORE_ROUTES = [
    "/",
    "/services",
    "/careers",
    "/careers/backend-developer-intern",
    "/bitelevate",
    "/bitelevate/paths",
    "/contact",
    "/products",
    "/case-studies",
    "/blog",
    "/diaries",
    "/story",
    "/team",
    "/robots.txt",
    "/sitemap.xml",
    "/api"
]

OUTPUT_DIR = "audit_report_data"

def print_header(title):
    print("\n" + "=" * 75)
    print(f" {title}")
    print("=" * 75)

class CaseInsensitiveDict(dict):
    def __init__(self, d=None):
        super().__init__()
        if d:
            for k, v in d.items():
                self[k.lower()] = v
    def get(self, key, default=None):
        return super().get(key.lower(), default)

def audit_routes(base_url="https://www.cynbit.in"):
    results = {
        "base_url": base_url,
        "routes": {},
        "server_actions": [],
        "security_posture": {},
        "discovered_bundles": []
    }

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    js_dir = os.path.join(OUTPUT_DIR, "js_chunks")
    os.makedirs(js_dir, exist_ok=True)

    print_header(f"Phase 1: Auditing HTTP Endpoints on {base_url}")

    for route in CORE_ROUTES:
        url = base_url + route
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Cynbit-Passive-Backend-Audit/1.0 (Passive Observational Review)"
            }
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.status
                raw_headers = dict(resp.headers)
                body = resp.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            status = e.code
            raw_headers = dict(e.headers)
            body = e.read().decode("utf-8", errors="replace")
        except Exception as e:
            status = f"Err: {e}"
            raw_headers = {}
            body = ""

        headers = CaseInsensitiveDict(raw_headers)

        # Analyze security headers
        missing_sec_headers = []
        for sec_h in ["Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]:
            if headers.get(sec_h) is None:
                missing_sec_headers.append(sec_h)

        cache_val = headers.get("x-vercel-cache", "N/A")
        prerender_val = headers.get("x-nextjs-prerender", "0")
        cors_val = headers.get("access-control-allow-origin", "None")

        results["routes"][route] = {
            "status": status,
            "server": headers.get("server", "Unknown"),
            "cache_control": headers.get("cache-control", "None"),
            "vercel_cache": cache_val,
            "next_prerender": prerender_val,
            "cors_allow_origin": cors_val,
            "hsts": headers.get("strict-transport-security", "None"),
            "missing_security_headers": missing_sec_headers,
            "body_length_bytes": len(body)
        }

        print(f"  [{status}] {route:35} | Cache: {cache_val:4} | Prerender: {prerender_val:2} | CORS: {cors_val}")

        # Extract JS chunk links
        chunks = re.findall(r'src=["\'](/_next/static/[^"\']+\.js)["\']', body)
        for c in chunks:
            if c not in results["discovered_bundles"]:
                results["discovered_bundles"].append(c)

    print_header(f"Phase 2: Extracting Client-Side Next.js Chunks ({len(results['discovered_bundles'])} found)")

    # Download unique chunks to analyze Server Actions and APIs
    discovered_actions = []
    for chunk in results["discovered_bundles"]:
        chunk_url = base_url + chunk
        chunk_file = os.path.basename(chunk)
        chunk_local_path = os.path.join(js_dir, chunk_file)

        if not os.path.exists(chunk_local_path):
            try:
                req = urllib.request.Request(chunk_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=10) as r:
                    content = r.read().decode("utf-8", errors="replace")
                    with open(chunk_local_path, "w", encoding="utf-8") as f:
                        f.write(content)
            except Exception as e:
                print(f"  [Warning] Could not fetch {chunk_url}: {e}")
                continue
        else:
            with open(chunk_local_path, "r", encoding="utf-8") as f:
                content = f.read()

        # Parse createServerReference(actionId, callServer, void 0, findSourceMapURL, actionName)
        actions = re.findall(r'createServerReference\)\(["\']([a-f0-9]+)["\'],[^,]+,[^,]+,[^,]+,["\']([^"\']+)["\']\)', content)
        for act_id, act_name in actions:
            if not any(a["id"] == act_id for a in discovered_actions):
                discovered_actions.append({
                    "id": act_id,
                    "name": act_name,
                    "source_chunk": chunk_file
                })

    results["server_actions"] = discovered_actions

    print_header(f"Discovered Next.js Server Actions ({len(discovered_actions)})")
    for act in discovered_actions:
        print(f"  -> {act['name']:32} [ID: {act['id']}] (in {act['source_chunk']})")

    summary_file = os.path.join(OUTPUT_DIR, "audit_summary.json")
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print_header("Audit Completed")
    print(f"Full observational data saved to: {summary_file}")
    return results

if __name__ == "__main__":
    audit_routes()
