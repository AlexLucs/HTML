import os
import sys
import webview
from screeninfo import get_monitors
import pygetwindow as gw


window_title = "BTC Status"
width_btc=500
height_btc=950

class exposedApi():    
    def fechar(self):
        global window
        if window:
            window.destroy()

    def minimizar(self):
        global window
        if window:
            window.minimize()

    def centralizar(self, move=False):
        global window
        monitors = get_monitors()

        if move:
            windows = gw.getWindowsWithTitle(window_title)
            if windows:
                window1 = windows[0]
                x_position1 = window1.left
                y_position1 = window1.top
                if x_position1 > -1:
                    monitor = monitors[0]
                else:
                    monitor = monitors[1]
                x_position, y_position = exposedApi.centrar("self", monitor)
            else:
                x_position = 0
                y_position = 0

            window.move(x_position, y_position)
        else:
            if monitors:
                monitor = monitors[0]
            x_position, y_position = exposedApi().centrar(monitor)            
            return x_position, y_position

    def centrar(self, monitor):
        monitor_width = monitor.width
        monitor_height = monitor.height
        monitor_x = monitor.x
        monitor_y = monitor.y
        x_position = monitor_x + (monitor_width - width_btc) // 2
        y_position = monitor_y + (monitor_height - height_btc) // 2
        
        return x_position, y_position

def abrir_janela():
    global window
    try:
        if getattr(sys, "frozen", False):
            url = os.path.join(sys._MEIPASS, "index.html")
        else:
            url = os.environ.get("USERPROFILE") + "/Downloads/Bot/btcstatus/index.html"

        x_position, y_position = exposedApi().centralizar()

        window = webview.create_window(
            window_title,
            url,
            width=width_btc,
            height=height_btc,
            frameless=True,
            background_color="#000000",
            x=x_position,
            y=y_position,
            js_api=exposedApi()
        )

        webview.start()

    except Exception as e:
        print(f"Erro ao tentar abrir: {e}")


if __name__ == "__main__":
    abrir_janela()