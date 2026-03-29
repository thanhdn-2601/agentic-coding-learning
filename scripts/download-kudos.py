import urllib.request, os

assets = [
    ('https://saa.sun-asterisk.vn/cdn-cgi/image/width=1920/assets/homepage/kudos-banner.png', 'public/assets/homepage/kudos-banner.png'),
    ('https://saa.sun-asterisk.vn/cdn-cgi/image/width=1080/assets/kudos/kudos-logo.png', 'public/assets/kudos/kudos-logo.png'),
    ('https://saa.sun-asterisk.vn/cdn-cgi/image/width=48/assets/awards/icons/Arrow_Right.svg', 'public/assets/awards/icons/Arrow_Right.svg'),
]

os.makedirs('public/assets/kudos', exist_ok=True)
os.makedirs('public/assets/awards/icons', exist_ok=True)

for url, path in assets:
    try:
        urllib.request.urlretrieve(url, path)
        print(f'OK {path}: {os.path.getsize(path)}B')
    except Exception as e:
        print(f'FAIL {path}: {e}')
