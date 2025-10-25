# BTC STATUS

## Build Executable
pyinstaller --onedir --optimize 1 --windowed --noconfirm --noconsole --noupx --add-data "index.html;." --add-data "jquery-confirm.min.js;." --add-data "jquery-confirm.min.css;." --add-data "jquery.min.js;." --add-data "Roboto.woff2;." --add-data "btc-logo.svg;." --add-data "alerta.mp3;." --add-data "script.js;." --add-data "style.css;." --add-binary "$appsPath\Python\Python313\python313.dll;." --icon=btc-logo.ico "BTC Monitor.py"

## Preview in Webview

## Com Gráfico
<img width="484" height="771" src="https://github.com/user-attachments/assets/15beb53c-6e88-4a50-bd5f-cbd708f640c2" />

## Com Dados
<img width="484" height="771" src="https://github.com/user-attachments/assets/4bd4c8d1-87e5-4ff6-947d-aa90b1086186" />
