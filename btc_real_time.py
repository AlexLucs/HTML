import os
import sys
import webview
from screeninfo import get_monitors

path = os.path.dirname(os.path.abspath(__file__)) + "/"

class Api():
    def fechar(var=None):
        global window
        if window:
            window.destroy()

def obter_posicao_monitor_e_centralizar(window_width, window_height):
    monitors = get_monitors()

    if not monitors:
        return 0, 0

    if len(monitors) > 1:
        monitor = monitors[1]
    else:
        monitor = monitors[0]

    monitor_width = monitor.width
    monitor_height = monitor.height
    monitor_x = monitor.x
    monitor_y = monitor.y

    x_position = monitor_x + (monitor_width - window_width) // 2
    y_position = monitor_y + (monitor_height - window_height) // 2

    return x_position, y_position

def abrir_janela():
    global window

    try:
        # url = "https://alexlucs.github.io/HTML/index.html"
        url = os.environ.get("USERPROFILE") + "/Downloads/Bot/btcstatus/index.html"

        window_width = 500
        window_height = 950

        x_position, y_position = obter_posicao_monitor_e_centralizar(window_width, window_height)

        window = webview.create_window(
            "Stack Stats",
            url,
            width=window_width,
            height=window_height,
            frameless=True,
            background_color="#000000",
            x=x_position,
            y=y_position,
            js_api=Api()
        )

        webview.start()
        
    except Exception as e:
        print(f"Erro ao tentar abrir: {e}")

if __name__ == "__main__":
    abrir_janela()