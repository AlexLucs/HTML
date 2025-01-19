import os
import sys
import json
import webview
from screeninfo import get_monitors
import pygetwindow as gw
import configparser
import win32gui
import win32con


window_title = "BTC Status"
width_btc = 500
height_btc = 830


class exposedApi:
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


    def fixarTopo(self):
        hwnd = win32gui.GetForegroundWindow()
        estilo = win32gui.GetWindowLong(hwnd, win32con.GWL_EXSTYLE)
        if estilo & win32con.WS_EX_TOPMOST:
            win32gui.SetWindowLong(hwnd, win32con.GWL_EXSTYLE, estilo & ~win32con.WS_EX_TOPMOST)
            win32gui.SetWindowPos(hwnd, win32con.HWND_NOTOPMOST, 0, 0, 0, 0, win32con.SWP_NOMOVE | win32con.SWP_NOSIZE)
        else:
            win32gui.SetWindowLong(hwnd, win32con.GWL_EXSTYLE, estilo | win32con.WS_EX_TOPMOST)
            win32gui.SetWindowPos(hwnd, win32con.HWND_TOPMOST, 0, 0, 0, 0, win32con.SWP_NOMOVE | win32con.SWP_NOSIZE)


    def salvar_alerta(self, alerta):
        pasta_alertas = os.path.join(os.getenv('APPDATA'), 'btcstatus')
        if not os.path.exists(pasta_alertas):
            os.makedirs(pasta_alertas)
        
        arquivo_json = os.path.join(pasta_alertas, "Alertas.json")
        try:
            with open(arquivo_json, 'w') as file:
                json.dump(alerta, file, indent=4)
        except (FileNotFoundError, json.JSONDecodeError):
            print("erro")


    def carregar_alerta(self):
        pasta_alertas = os.path.join(os.getenv('APPDATA'), 'btcstatus')
        
        if not os.path.exists(pasta_alertas):
            return []
        
        arquivo_json = os.path.join(pasta_alertas, "Alertas.json")
        if not os.path.isfile(arquivo_json):
            return []
        
        try:
            with open(arquivo_json, 'r') as file:
                dados = json.load(file)
            return dados
        except (json.JSONDecodeError, FileNotFoundError) as e:
            print(f"Erro ao carregar o arquivo JSON: {e}")
            return []


def salvar_janela():
    windows = gw.getWindowsWithTitle(window_title)
    config = configparser.ConfigParser()

    try:
        window1 = windows[0]
        x_position1 = window1.left
        y_position1 = window1.top

        appdata_dir = os.getenv('APPDATA')
        config_dir = os.path.join(appdata_dir, 'btcstatus')
        if not os.path.exists(config_dir):
            os.makedirs(config_dir)
        config_file = os.path.join(config_dir, "BTC Monitor.ini")


        config['Position'] = {'x': str(x_position1), 'y': str(y_position1)}

        with open(config_file, 'w') as configfile:
            config.write(configfile)
    except Exception as e:
        print(f"Erro ao salvar posição: {e}")


def cordenadas_validas(x, y):
    monitors = get_monitors()
    for monitor in monitors:
        if x >= monitor.x and x <= (monitor.x + monitor.width) and y >= monitor.y and y <= (monitor.y + monitor.height):
            return True
    return False


def posicao_janela():
    config = configparser.ConfigParser()
    appdata_dir = os.getenv('APPDATA')
    config_dir = os.path.join(appdata_dir, 'btcstatus')
    config_file = os.path.join(config_dir, "BTC Monitor.ini")
    if os.path.exists(config_file):
        config.read(config_file)
        try:
            x_position = int(config['Position']['x'])
            y_position = int(config['Position']['y'])
            if cordenadas_validas(x_position, y_position):
                return x_position, y_position
            else:
                return 0,0
        except:
            return 0,0
    return 0,0


def abrir_janela():
    global window
    try:
        if getattr(sys, "frozen", False):
            url = os.path.join(sys._MEIPASS, "index.html")
        else:
            url = os.environ.get("USERPROFILE") + "/Downloads/Bot/btcstatus/index.html"

        x_position, y_position = posicao_janela()
        if (x_position == 0 and y_position == 0):
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

        window.events.closing += salvar_janela

        webview.start(
            user_agent='pywebview',
        )

    except Exception as e:
        print(f"Erro ao tentar abrir: {e}")

if __name__ == "__main__":
    abrir_janela()
