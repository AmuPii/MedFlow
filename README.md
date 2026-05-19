# MedFlow Desktop

Aplicativo desktop para controle diário de uso de medicamentos, com calendário interativo, notificações nativas do Windows e persistência local.

## Stack

- Frontend: React + Vite (JavaScript)
- Backend: Python + FastAPI + SQLite
- Desktop: Electron
- Build Windows: electron-builder + PyInstaller

## Funcionalidades implementadas

- Calendário mensal com navegação entre meses
- Registro diário por dia:
  - `taken` (tomado) -> verde
  - `missed` (não tomado) -> vermelho
  - `neutral` (sem registro) -> neutro
- Modal de edição por clique no dia
- Notificação nativa diária no horário configurado:
  - "Você já tomou seu remédio hoje?"
- Persistência local:
  - SQLite com histórico e configurações
  - Backup automático diário em JSON + cópia do banco
- Estatísticas:
  - Aderência percentual
  - Totais de tomado/não tomado
  - Streak atual e melhor streak
- Interface dark moderna e responsiva (desktop + tablet/mobile)

## Estrutura

```text
MedFlow/
├─ electron/
│  ├─ main.js
│  ├─ preload.js
│  ├─ notificationUtils.js
│  └─ tests/notificationUtils.test.cjs
├─ frontend/
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ components/
│  │  ├─ services/api.js
│  │  ├─ styles/global.css
│  │  └─ utils/calendar.js
│  ├─ tests/
│  ├─ package.json
│  └─ vite.config.js
├─ backend/
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ database.py
│  │  ├─ services.py
│  │  └─ schemas.py
│  ├─ tests/
│  ├─ requirements.txt
│  └─ run_server.py
├─ scripts/
│  ├─ build-backend.ps1
│  ├─ build-clean.ps1
│  └─ build-exe.ps1
└─ package.json
```

## Pré-requisitos

- Node.js 20+
- Python 3.11+
- Windows 10/11

## Rodar em desenvolvimento

1. Instalar dependências JS raiz:

```powershell
npm install
```

2. Instalar dependências do frontend:

```powershell
npm run install:frontend
```

3. Instalar dependências Python:

```powershell
python -m pip install -r backend\requirements.txt
```

4. Subir tudo (backend + frontend + Electron):

```powershell
npm run dev
```

## Testes automatizados

Executa:
- testes frontend (Vitest + Testing Library)
- testes backend (Pytest + FastAPI TestClient)
- testes de lógica de notificação (Node test runner)

```powershell
npm run test
```

## Gerar executável `.exe`

### Método recomendado (Windows)

1. Feche qualquer instância aberta do MedFlow.
2. Execute o build limpo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-clean.ps1
```

3. Ao final do script, valide:
- `.\backend\bin\medflow_backend.exe` existe
- `.\dist\win-unpacked\resources\backend\medflow_backend.exe` existe

4. Instale pelo arquivo gerado em `.\dist\` (instalador NSIS).
5. Abra o app pelo Menu Iniciar (`MedFlow`).

### Opção rápida (sem limpeza)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-exe.ps1
```

### Opção manual

```powershell
npm run build:frontend
npm run build:backend
npm run pack:win
```

O instalador será gerado em `dist/`.

## Persistência de dados

No app empacotado, os dados são salvos no diretório `userData` do Electron, incluindo:

- `medflow.db`
- pasta `backups/` com snapshot JSON diário

## Observações

- O backend sobe localmente em `127.0.0.1:8765`.
- O frontend conversa com a API local via HTTP.
- A notificação é nativa do Windows (Electron Notification).
