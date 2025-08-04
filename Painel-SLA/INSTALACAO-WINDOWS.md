# Instruções para Instalação em Windows

## Requisitos

- Node.js versão 16 ou superior
- NPM (geralmente instalado com o Node.js)

## Opção 1: Executar diretamente (Mais simples)

1. Extraia todos os arquivos da pasta `dist` para uma pasta de sua preferência
2. Abra o arquivo `index.html` em um navegador web moderno (Chrome, Firefox, Edge)
3. O painel de SLA será carregado diretamente no navegador

## Opção 2: Configurar como aplicação Electron (Recomendado para uso contínuo)

Esta opção permite que o painel seja executado como uma aplicação desktop em Windows.

### Passos para configuração:

1. Instale o Node.js e NPM (se ainda não estiverem instalados)
   - Baixe em: https://nodejs.org/en/download/
   - Siga as instruções de instalação padrão

2. Abra o Prompt de Comando (CMD) como administrador
   - Pressione `Win + X` e selecione "Prompt de Comando (Admin)" ou "Windows PowerShell (Admin)"

3. Navegue até a pasta onde você extraiu os arquivos do SLA Dashboard
   ```
   cd caminho\para\pasta\sla-dashboard
   ```

4. Renomeie o arquivo `package-electron.json` para `package.json`
   ```
   rename package-electron.json package.json
   ```

5. Instale as dependências necessárias
   ```
   npm install
   ```

6. Execute o aplicativo localmente para teste
   ```
   npm start
   ```

7. Para criar um instalador Windows
   ```
   npm run build
   ```
   - O instalador será criado na pasta `electron-dist`
   - Execute o arquivo `.exe` gerado para instalar o aplicativo no Windows

## Resolução de Problemas

1. **Erro de conexão com a API**
   - Verifique sua conexão de internet
   - Confirme que a API da LogicalApps está acessível da sua rede

2. **Erro ao executar npm install**
   - Certifique-se que o Node.js está instalado corretamente
   - Execute o CMD como administrador
   - Se necessário, instale o pacote electron globalmente:
     ```
     npm install -g electron
     ```

3. **Dashboard não atualiza automaticamente**
   - O dashboard está configurado para atualizar a cada 30 segundos
   - Confirme que não há bloqueios de rede impedindo as requisições

## Configuração para TV/Monitor de Parede

Para melhor exibição em TVs:
1. Inicie o dashboard no modo de tela cheia (F11 no navegador)
2. O modo escuro já está ativo por padrão, ideal para monitores
3. Considere aumentar o zoom do navegador para melhor visualização em TVs distantes

## Suporte

Em caso de dúvidas ou problemas com a instalação, entre em contato com a equipe de suporte.