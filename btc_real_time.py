import os
import webview
from filelock import FileLock
from screeninfo import get_monitors


path = os.path.dirname(os.path.abspath(__file__)) + "/"
lockfile = path + "btc_real_time.lock"

def reload():
    global window
    window.evaluate_js("location.reload()")

def fechar():
    global window
    if window:
        window.destroy()

def minimizar():
    global window
    if window:
        window.minimize()

def on_loaded():
    global window
    window.show()

def obter_posicao_monitor_e_centralizar(window_width, window_height):
    """
    Função para obter as informações do monitor e calcular a posição centralizada
    para a janela.
    """
    # Obter informações sobre os monitores
    monitors = get_monitors()

    if not monitors:
        print("Nenhum monitor encontrado.")
        return 0, 0  # Se não houver monitores, retorna posição 0,0

    # Pegar o primeiro monitor (pode alterar para outro índice se necessário)
    monitor = monitors[0]
    monitor_width = monitor.width
    monitor_height = monitor.height
    monitor_x = monitor.x
    monitor_y = monitor.y

    # Calcular a posição da janela para centralizá-la
    x_position = monitor_x + (monitor_width - window_width) // 2
    y_position = monitor_y + (monitor_height - window_height) // 2

    return x_position, y_position
def abrir_janela():
    global window
    lock = FileLock(lockfile)

    try:
        with lock:
            menu_items = [
                webview.menu.MenuAction("Atualizar", reload),
                webview.menu.MenuAction("Minimizar", minimizar),
                webview.menu.MenuAction("Fechar", fechar),
            ]

            # url = "https://alexlucs.github.io/HTML/index.html"
            url = os.environ.get("USERPROFILE")+"/Downloads/Bot/btcstatus/index.html"

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
                on_top=True,
                x=x_position,
                y=y_position,
            )

            window.events.loaded += on_loaded

            webview.start(menu=menu_items)

    except Exception as e:
        print(f"Erro ao tentar abrir a instância: {e}")

if __name__ == "__main__":
    if not os.path.exists(lockfile):
        abrir_janela()
    else:
        print("Instância já está em execução.")