import os
import sys
import webview
from screeninfo import get_monitors
import pygetwindow as gw


class exposedApi():
    def fechar(var=None):
        global window
        if window:
            window.destroy()

    def minimizar(var=None):
        global window
        if window:
            window.minimize()

    def centralizar(var=None, move=None):
        global window
        monitors = get_monitors()

        if not move==1:
            if monitors:
                monitor = monitors[0]

                monitor_width = monitor.width
                monitor_height = monitor.height
                monitor_x = monitor.x
                monitor_y = monitor.y

                x_position = monitor_x + (monitor_width - 500) // 2
                y_position = monitor_y + (monitor_height - 950) // 2

            else:
                x_position = 0
                y_position = 0

            return x_position, y_position
        else:
            window_title = 'Stack Stats'
            windows = gw.getWindowsWithTitle(window_title)

            if windows:
                window1 = windows[0]
                x_position = window1.left
                y_position = window1.top

                if x_position > -1:
                    monitor = monitors[0]
                else:
                    monitor = monitors[1]

                monitor_width = monitor.width
                monitor_height = monitor.height
                monitor_x = monitor.x
                monitor_y = monitor.y

                x_position = monitor_x + (monitor_width - 500) // 2
                y_position = monitor_y + (monitor_height - 950) // 2

            else:
                x_position = 0
                y_position = 0

            window.move(x_position, y_position)


def abrir_janela():
    global window

    try:
        url = "https://alexlucs.github.io/HTML/index.html"
        # url = os.environ.get("USERPROFILE") + "/Downloads/Bot/btcstatus/index.html"

        x_position, y_position = exposedApi.centralizar()

        window = webview.create_window(
            "Stack Stats",
            url,
            width=500,
            height=950,
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