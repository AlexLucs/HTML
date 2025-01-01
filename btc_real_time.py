import os
import webview

path = os.path.dirname(os.path.abspath(__file__))+'/'
controle_arquivo = path + "aberta.txt"

def on_closed():
    if os.path.exists(controle_arquivo):
        os.remove(controle_arquivo)

def reload():
    global window
    window.evaluate_js("location.reload()")

def fechar():
    global window
    if window:
        window.destroy()

def abrir_janela():
    global window
    if os.path.exists(controle_arquivo):
        print("A janela já está aberta.")
        return

    with open(controle_arquivo, "w") as f:
        f.write("1")

    menu_items = [
        webview.menu.MenuAction('Atualizar', reload),
        webview.menu.MenuAction('Fechar', fechar)
    ]

    url = path + 'btcph.html'

    window = webview.create_window('Stack Stats', url, width=500, height=950, frameless=True, on_top=True, x=2077, y=-1)

    window.events.closed += on_closed

    webview.start(menu=menu_items)

if __name__ == "__main__":
    abrir_janela()
