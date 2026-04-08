# BTC STATUS

## Preview in Webview

#### Com Gráfico
<img width="484" height="771" alt="image" src="https://github.com/user-attachments/assets/2b48efde-4cc1-46be-b70d-ac7f484926d9" />

#### Com Dados
<img width="484" height="771" alt="image" src="https://github.com/user-attachments/assets/06010cec-77f6-4e5c-80d5-1534bfeac8a4" />



## Build Executable

pyinstaller --onedir --optimize 1 --windowed --noconfirm --noconsole --noupx --add-data "index.html;." --add-data "jquery-confirm.min.js;." --add-data "jquery-confirm.min.css;." --add-data "jquery.min.js;." --add-data "Roboto.woff2;." --add-data "btc-logo.svg;." --add-data "alerta.mp3;." --add-data "script.js;." --add-data "style.css;." --add-binary "$appsPath\Python\Python313\python313.dll;." --icon=btc-logo.ico "BTC Monitor.py"
