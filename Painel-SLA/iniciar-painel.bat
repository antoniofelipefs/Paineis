@echo off
echo ===============================================
echo Painel de Monitoramento SLA - Paradigma
echo ===============================================
echo.
echo Iniciando servidor...
echo.
echo O painel estará disponível em:
echo   http://localhost:8080 (neste computador)
echo   http://%COMPUTERNAME%:8080 (na rede local)

ipconfig | findstr /C:"IPv4" /C:"Endereço IPv4"
echo.
echo Pressione CTRL+C para encerrar o servidor
echo ===============================================
echo.

cd %~dp0dist
npx serve -s -l 8080

pause