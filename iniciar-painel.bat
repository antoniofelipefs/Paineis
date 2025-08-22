@echo off
title SLA Painel - Servidor Local
color 0A
cls

echo ========================================
echo      SLA PAINEL - SERVIDOR LOCAL
echo ========================================
echo.
echo [1/3] Verificando arquivos...

cd /d "%~dp0"

if not exist "dist" (
    echo ❌ Pasta 'dist' nao encontrada!
    echo 🔧 Executando build...
    call pnpm run build
    if errorlevel 1 (
        echo ❌ Erro no build!
        pause
        exit /b 1
    )
    echo ✅ Build concluido!
    echo.
)

echo [2/3] Verificando Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js nao encontrado!
    echo 📥 Instale Node.js: https://nodejs.org
    pause
    exit /b 1
)

echo [3/3] Iniciando servidor...
echo.

start "" "http://localhost:8080"
node server.js

pause