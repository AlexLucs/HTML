import os
import sys
import json
import webview
from screeninfo import get_monitors
import pygetwindow as gw
import configparser
import win32gui
import win32con

# Constantes
WINDOW_TITLE = "BTC Status"
WINDOW_WIDTH = 500
WINDOW_HEIGHT = 830

class ExposedApi:
    """API exposta para comunicação Javascript <-> Python."""

    def fechar(self):
        """Fecha a janela."""
        global window
        if window:
            window.destroy()

    def minimizar(self):
        """Minimiza a janela."""
        global window
        if window:
            window.minimize()

    def centralizar(self, move=False):
        """Centraliza a janela na tela."""
        global window
        monitors = get_monitors()

        if move:
            windows = gw.getWindowsWithTitle(WINDOW_TITLE)
            if windows:
                window1 = windows[0]
                x_position1 = window1.left
                y_position1 = window1.top
                if x_position1 > -1:
                    monitor = monitors[0]
                else:
                    monitor = monitors[1]
                x_position, y_position = self.centrar_posicao(monitor) # Correção: Chamando método interno usando self
            else:
                x_position = 0
                y_position = 0

            window.move(x_position, y_position)
        else:
            if monitors:
                monitor = monitors[0]

            x_position, y_position = self.centrar_posicao(monitor) # Correção: Chamando método interno usando self
            return x_position, y_position

    def centrar_posicao(self, monitor): # Correção: Renomeando para refletir que é uma função auxiliar interna
        """Calcula a posição centralizada para um monitor."""
        if not monitor: # Adicionado verificação para o caso de monitor ser None
            return 0, 0

        monitor_width = monitor.width
        monitor_height = monitor.height
        monitor_x = monitor.x
        monitor_y = monitor.y
        x_position = monitor_x + (monitor_width - WINDOW_WIDTH) // 2
        y_position = monitor_y + (monitor_height - WINDOW_HEIGHT) // 2

        return x_position, y_position

    def fixarTopo(self):
        """Fixa ou desfixa a janela no topo."""
        hwnd = win32gui.GetForegroundWindow()
        estilo = win32gui.GetWindowLong(hwnd, win32con.GWL_EXSTYLE)
        if estilo & win32con.WS_EX_TOPMOST:
            """Desafixar do topo"""
            win32gui.SetWindowLong(
                hwnd, win32con.GWL_EXSTYLE, estilo & ~win32con.WS_EX_TOPMOST
            )
            win32gui.SetWindowPos(
                hwnd,
                win32con.HWND_NOTOPMOST,
                0,
                0,
                0,
                0,
                win32con.SWP_NOMOVE | win32con.SWP_NOSIZE,
            )
        else:
            """Fixar no topo"""
            win32gui.SetWindowLong(
                hwnd, win32con.GWL_EXSTYLE, estilo | win32con.WS_EX_TOPMOST
            )
            win32gui.SetWindowPos(
                hwnd,
                win32con.HWND_TOPMOST,
                0,
                0,
                0,
                0,
                win32con.SWP_NOMOVE | win32con.SWP_NOSIZE,
            )

    def salvar_alerta(self, alerta):
        """Salva alertas em um arquivo JSON."""
        pasta_alertas = os.path.join(os.getenv("APPDATA"), "btcstatus")
        if not os.path.exists(pasta_alertas):
            os.makedirs(pasta_alertas)

        arquivo_json = os.path.join(pasta_alertas, "Alertas.json")
        try:
            with open(arquivo_json, "w") as file:
                json.dump(alerta, file, indent=4)
        except (FileNotFoundError, json.JSONDecodeError) as e: # Correção: Adicionado 'as e' para capturar a exceção
            print(f"Erro ao salvar alerta: {e}") # Correção: Mensagem de erro mais descritiva

    def carregar_alerta(self):
        """Carrega alertas de um arquivo JSON."""
        pasta_alertas = os.path.join(os.getenv("APPDATA"), "btcstatus")

        if not os.path.exists(pasta_alertas):
            return []

        arquivo_json = os.path.join(pasta_alertas, "Alertas.json")
        if not os.path.isfile(arquivo_json):
            return []

        try:
            with open(arquivo_json, "r") as file:
                dados = json.load(file)
            return dados
        except (json.JSONDecodeError, FileNotFoundError) as e: # Correção: Adicionado 'as e' para capturar a exceção
            print(f"Erro ao carregar o arquivo JSON: {e}")
            return []


def salvar_janela():
    """Salva a posição da janela em um arquivo de configuração."""
    windows = gw.getWindowsWithTitle(WINDOW_TITLE)
    config = configparser.ConfigParser()

    try:
        window1 = windows[0]
        x_position1 = window1.left
        y_position1 = window1.top

        appdata_dir = os.getenv("APPDATA")
        config_dir = os.path.join(appdata_dir, "btcstatus")
        if not os.path.exists(config_dir):
            os.makedirs(config_dir)
        config_file = os.path.join(config_dir, "BTC Monitor.ini")

        config["Position"] = {"x": str(x_position1), "y": str(y_position1)}

        with open(config_file, "w") as configfile:
            config.write(configfile)
    except Exception as e: # Correção: Capturando Exception genérica para logar qualquer erro
        print(f"Erro ao salvar posição: {e}")


def cordenadas_validas(x, y):
    """Verifica se as coordenadas estão dentro de algum monitor."""
    monitors = get_monitors()
    for monitor in monitors:
        if (
            x >= monitor.x
            and x <= (monitor.x + monitor.width)
            and y >= monitor.y
            and y <= (monitor.y + monitor.height)
        ):
            return True
    return False


def posicao_janela():
    """Carrega a posição da janela do arquivo de configuração."""
    config = configparser.ConfigParser()
    appdata_dir = os.getenv("APPDATA")
    config_dir = os.path.join(appdata_dir, "btcstatus")
    config_file = os.path.join(config_dir, "BTC Monitor.ini")

    if os.path.exists(config_file):
        config.read(config_file)
        try:
            x_position = int(config["Position"]["x"])
            y_position = int(config["Position"]["y"])
            if cordenadas_validas(x_position, y_position):
                return x_position, y_position
            else:
                return 0, 0
        except Exception as e: # Correção: Capturando Exception genérica para logar qualquer erro
            print(f"Erro ao carregar posição da janela do config: {e}") # Correção: Mensagem de erro mais específica
            return 0, 0 # Correção: Retornando valor padrão em caso de erro
    return 0, 0


def abrir_janela():
    """Abre a janela principal do aplicativo."""
    global window
    try:
        """Determina o caminho para o arquivo index.html, dependendo se o app está 'frozen' (executável)"""
        if getattr(sys, "frozen", False):
            url = os.path.join(sys._MEIPASS, "index.html")
        else:
            """Caminho para desenvolvimento"""
            url = os.path.join(os.path.dirname(__file__), "index.html")
            if not os.path.exists(url): # Correção: Verificando se o caminho direto existe, senão tenta o caminho alternativo
                """Caminho alternativo para desenvolvimento (Download folder)"""
                url = os.environ.get("USERPROFILE") + "/Downloads/Bot/btcstatus/index.html"
                if not os.path.exists(url): # Correção: Verificando se o caminho alternativo existe, senão usa 'index.html' no diretório de execução
                    """Fallback para index.html no diretório de execução"""
                    url = 'index.html' # Correção: Caminho relativo para caso index.html esteja no mesmo diretório

        x_position, y_position = posicao_janela()

        if x_position == 0 and y_position == 0:
            """Centralizar janela se a posição salva for inválida ou inexistente"""
            api_instance = ExposedApi() # Correção: Instanciando ExposedApi para usar o método centrar_posicao
            x_position, y_position = api_instance.centrar_posicao(get_monitors()[0] if get_monitors() else None) # Correção: Passando monitor para centrar_posicao

        window = webview.create_window(
            WINDOW_TITLE,
            url,
            width=WINDOW_WIDTH,
            height=WINDOW_HEIGHT,
            frameless=True,
            background_color="#000000",
            x=x_position,
            y=y_position,
            js_api=ExposedApi(), # Correção: Instanciando ExposedApi para ser acessível no JS
        )

        """Salvar posição da janela ao fechar"""
        window.events.closing += salvar_janela

        webview.start(
            user_agent="pywebview",
            debug=True,
        )

    except Exception as e: # Correção: Capturando Exception genérica para logar qualquer erro
        print(f"Erro ao tentar abrir: {e}")


if __name__ == "__main__":
    abrir_janela()