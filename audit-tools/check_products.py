import urllib.request
import re

req = urllib.request.Request('https://www.cynbit.in/products', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=10) as r:
    b = r.read().decode('utf-8', errors='replace')
    scripts = re.findall(r'src=["\'](/_next/static/[^"\']+\.js)["\']', b)
    print('Product scripts:', scripts)
    for s in scripts:
        if 'products' in s or 'page-' in s:
            print('Product page chunk:', s)
            chunk_url = 'https://www.cynbit.in' + s
            with urllib.request.urlopen(chunk_url) as cr:
                chunk_code = cr.read().decode('utf-8', errors='replace')
                actions = re.findall(r'createServerReference\)\(["\']([a-f0-9]+)["\'],[^,]+,[^,]+,[^,]+,["\']([^"\']+)["\']\)', chunk_code)
                print(f"Server actions in {s}: {actions}")
