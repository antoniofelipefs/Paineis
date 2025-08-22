@echo off
title SLA Painel - Servidor Local
color 0A
cls

echo ========================================
echo      SLA PAINEL - SERVIDOR LOCAL
echo ========================================
echo.
echo [1/4] Verificando arquivos...

cd /d "%~dp0"

if not exist "dist" (
    echo ❌ Pasta 'dist' nao encontrada!
    echo 🔧 Executando build...
    
    REM Try pnpm first, then npm
    where pnpm >nul 2>nul
    if errorlevel 1 (
        echo ⚠️  PNPM nao encontrado, tentando NPM...
        where npm >nul 2>nul
        if errorlevel 1 (
            echo ❌ Nem NPM nem PNPM encontrados!
            echo 📥 Instale Node.js: https://nodejs.org
            pause
            exit /b 1
        )
        echo 📦 Usando NPM para build...
        call npm run build
    ) else (
        echo 📦 Usando PNPM para build...
        call pnpm run build
    )
    
    if errorlevel 1 (
        echo ❌ Erro no build!
        echo.
        echo Tentando instalar dependencias...
        where pnpm >nul 2>nul
        if errorlevel 1 (
            call npm install
        ) else (
            call pnpm install
        )
        echo.
        echo Tentando build novamente...
        where pnpm >nul 2>nul
        if errorlevel 1 (
            call npm run build
        ) else (
            call pnpm run build
        )
        if errorlevel 1 (
            echo ❌ Erro persistente no build!
            pause
            exit /b 1
        )
    )
    echo ✅ Build concluido!
    echo.
)

echo [2/4] Verificando Node.js...
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js nao encontrado!
    echo 📥 Instale Node.js: https://nodejs.org
    pause
    exit /b 1
)

echo [3/4] Verificando dependencias...
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    where pnpm >nul 2>nul
    if errorlevel 1 (
        call npm install
    ) else (
        call pnpm install
    )
)

echo [4/4] Iniciando servidor...
echo.

start "" "http://localhost:8080"
node server.js

pause