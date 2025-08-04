# Instruções para Deploy do Dashboard SLA

Este é um guia passo-a-passo para instalar e executar o Dashboard SLA em seu computador Windows.

## Opção 1: Usando o build de produção (Recomendado)

### Passo 1: Baixar os arquivos
1. Baixe a pasta `dist` completa
2. Baixe o arquivo `sla-dashboard-launcher.html`

### Passo 2: Configuração
1. Coloque o arquivo `sla-dashboard-launcher.html` na **mesma pasta** onde você extraiu a pasta `dist`
2. A estrutura de pastas deve ficar assim:
   ```
   sua-pasta/
   ├── dist/
   │   ├── assets/
   │   ├── data/
   │   ├── images/
   │   ├── index.html
   │   └── ...
   └── sla-dashboard-launcher.html
   ```

### Passo 3: Execução
1. Abra o arquivo `sla-dashboard-launcher.html` no seu navegador
2. O launcher verificará a conexão com a API e abrirá o dashboard

## Opção 2: Usando Electron (Alternativa)

Se preferir executar o dashboard como um aplicativo desktop:

### Passo 1: Requisitos
1. Instale o Node.js (https://nodejs.org)

### Passo 2: Configuração
1. Baixe os seguintes arquivos:
   - Pasta `dist` completa
   - `sla-dashboard-electron.js`
   - `package-electron.json`

2. Renomeie `package-electron.json` para `package.json`

3. Abra um prompt de comando na pasta e execute:
   ```
   npm install electron express
   npm start
   ```

4. O aplicativo será aberto automaticamente como uma janela desktop

## Solução de problemas

Se encontrar uma página em branco:
1. Verifique se a estrutura de pastas está correta
2. Verifique se todos os arquivos foram baixados
3. Tente usar um servidor web local como o Live Server (extensão do VS Code)