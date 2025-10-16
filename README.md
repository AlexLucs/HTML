# BTC STATUS

## Build Executable
pyinstaller --onedir --optimize 1 --windowed --noconfirm --noconsole --noupx --add-data "index.html;." --add-data "jquery-confirm.min.js;." --add-data "jquery-confirm.min.css;." --add-data "jquery.min.js;." --add-data "Roboto.woff2;." --add-data "btc-logo.svg;." --add-data "alerta.mp3;." --add-data "script.js;." --add-data "style.css;." --add-binary "$appsPath\Python\Python313\python313.dll;." --icon=btc-logo.ico "BTC Monitor.py"

## Preview in Webview

![IMG_20250119_161727_439](https://github.com/user-attachments/assets/3d8fe91b-fb6e-4cc8-8e22-681e00f6887d)

## Preview in Browser

![Screenshot_20250119_161541_Firefox](https://github.com/user-attachments/assets/19f4b00e-0dbd-487e-ae05-c041768bb092)

