$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\.."

Write-Host "1/7 Encerrando processos antigos..." -ForegroundColor Cyan
Get-Process -Name "MedFlow","medflow_backend","electron" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "2/7 Limpando artefatos anteriores..." -ForegroundColor Cyan
Remove-Item -Recurse -Force .\dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\backend\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\backend\bin -ErrorAction SilentlyContinue
Remove-Item -Force .\backend\medflow_backend.spec -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\frontend\dist -ErrorAction SilentlyContinue

Write-Host "3/7 Instalando dependências Node..." -ForegroundColor Cyan
npm install
npm run install:frontend

Write-Host "4/7 Instalando dependências Python..." -ForegroundColor Cyan
python -m pip install -r .\backend\requirements.txt

Write-Host "5/7 Gerando backend .exe..." -ForegroundColor Cyan
npm run build:backend

if (-not (Test-Path .\backend\bin\medflow_backend.exe)) {
  throw "Backend .exe não foi gerado em backend\\bin\\medflow_backend.exe"
}

Write-Host "6/7 Empacotando app Windows..." -ForegroundColor Cyan
npm run pack:win

Write-Host "7/7 Validando arquivo backend no pacote..." -ForegroundColor Cyan
$packedBackend = ".\dist\win-unpacked\resources\backend\medflow_backend.exe"
if (-not (Test-Path $packedBackend)) {
  throw "Backend não foi incluído no pacote: $packedBackend"
}

Write-Host ""
Write-Host "Build concluído com sucesso." -ForegroundColor Green
Write-Host "Backend no pacote: $packedBackend" -ForegroundColor Green
Write-Host "Executável: .\dist\win-unpacked\MedFlow.exe" -ForegroundColor Green

