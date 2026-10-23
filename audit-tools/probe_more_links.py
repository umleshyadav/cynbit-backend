import urllib.request
import re

urls = [
    'https://www.cynbit.in/products',
    'https://www.cynbit.in/case-studies',
    'https://www.cynbit.in/impact',
    'https://www.cynbit.in/story',
    'https://www.cynbit.in/team',
    'https://www.cynbit.in/bitelevate/paths',
    'https://www.cynbit.in/blog',
    'https://www.cynbit.in/diaries',
    'https://www.cynbit.in/privacy',
    'https://www.cynbit.in/terms'
]

print("=== Probing Additional Cynbit Surfaces ===")
for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as r:
            headers = dict(r.headers)
            body = r.read().decode('utf-8', errors='replace')
            prerender = headers.get('x-nextjs-prerender', headers.get('X-Nextjs-Prerender', '0'))
            cache = headers.get('x-vercel-cache', headers.get('X-Vercel-Cache', 'N/A'))
            chunks = re.findall(r'src=["\'](/_next/static/[^"\']+\.js)["\']', body)
            forms = re.findall(r'<form', body)
            print(f"[{r.status}] {u:40} | Prerender: {prerender} | Cache: {cache:4} | Chunks: {len(chunks)} | Forms: {len(forms)}")
    except Exception as e:
        print(f"Err {u}: {e}")
