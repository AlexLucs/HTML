@echo off
call %USERPROFILE%\Downloads\Bot\btcstatus\btcStatus\Scripts\activate.bat
start "" %USERPROFILE%\Downloads\Bot\btcstatus\btcStatus\Scripts\pythonw.exe %USERPROFILE%\Downloads\Bot\btcstatus\btc_real_time.py
