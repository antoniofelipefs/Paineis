# 🚀 Como executar o SLA Painel localmente

## ✅ Pré-requisitos
1. **Node.js** instalado (versão 16 ou superior)
   - Download: https://nodejs.org
   - Verificar instalação: `node --version`

2. **PNPM** instalado
   - Instalar: `npm install -g pnpm`
   - Verificar instalação: `pnpm --version`

## 📋 Instruções de uso

### Método 1: Duplo clique no arquivo .bat (Windows)
1. Localize o arquivo `iniciar-painel-npm.bat` na pasta do projeto
2. Dê um **duplo clique** no arquivo
3. O script tentará usar PNPM primeiro, depois NPM se PNPM não estiver disponível
4. O navegador abrirá automaticamente em `http://localhost:8080`
5. Mantenha a janela do terminal aberta enquanto usar o painel

**Arquivos disponíveis:**
- `iniciar-painel.bat` - Versão original (requer PNPM)
- `iniciar-painel-npm.bat` - Versão compatível (usa NPM ou PNPM)

### Método 2: Via terminal (Windows/Linux/Mac)
```bash
# Navegar para a pasta do projeto
cd caminho/para/Painel-SLA

# Instalar dependências (primeira vez apenas)
pnpm install

# Fazer build do projeto
pnpm run build

# Iniciar servidor local
node server.js
```

## 🌐 Acessando o painel
- **URL local:** http://localhost:8080
- **Porta:** 8080

## ⚠️ Importante
- Mantenha a janela do terminal/cmd aberta enquanto usar o painel
- Para parar o servidor: Pressione **Ctrl+C** no terminal
- Se a porta 4173 estiver ocupada, o sistema mostrará erro

## 🔧 Solução de problemas

### Erro "Node.js não encontrado"
- Instale o Node.js: https://nodejs.org
- Reinicie o terminal/cmd após a instalação

### Erro "pnpm não encontrado"
**Opção 1:** Instalar PNPM
```bash
npm install -g pnpm
```

**Opção 2:** Usar o arquivo compatível
- Use `iniciar-painel-npm.bat` em vez de `iniciar-painel.bat`
- Este arquivo funciona com NPM (que vem com Node.js)

### Porta 8080 já está em uso
- Feche outros serviços na porta 8080
- Ou modifique a porta no arquivo `server.js` (linha 6)

### Página não carrega
1. Verifique se o build foi executado: `pnpm run build`
2. Verifique se existe a pasta `dist`
3. Verifique se não há erros no terminal

## 📁 Estrutura de arquivos necessários
```
Painel-SLA/
├── iniciar-painel.bat    # Arquivo para iniciar (Windows)
├── server.js             # Servidor local Node.js
├── dist/                 # Arquivos compilados (gerado pelo build)
├── package.json          # Configurações do projeto
└── src/                  # Código fonte
```

## ✅ Teste rápido
1. Duplo clique em `iniciar-painel.bat`
2. Aguarde a mensagem "Servidor iniciado com sucesso!"
3. Navegador deve abrir automaticamente
4. Se não abrir, acesse manualmente: http://localhost:8080