import urllib.request, os

BASE = "https://sdo-morpheus-prod.jp-osa-1.linodeobjects.com/private/9ypp4enmFmdK3YAFJLIu6C/figma-media/"

assets = [
    (BASE + "b1e72bf604326f7af02ce0e47ef0a638.png", "public/assets/saa/logos/saa-logo.png"),
    (BASE + "f704b1ad983f92a7ae34637b07258e39.svg", "public/assets/auth/icons/flag-vn.svg"),
    (BASE + "2e900e000847f138c2a99f075b1db9a8.png", "public/assets/login/images/root-further.png"),
    (BASE + "4b07e3d29896b926ae1d23619f01ec45.svg", "public/assets/auth/icons/google-icon.svg"),
]

for url, path in assets:
    try:
        urllib.request.urlretrieve(url, path)
        size = os.path.getsize(path)
        print(f"OK {path}: {size} bytes")
    except Exception as e:
        print(f"FAIL {path}: {e}")
