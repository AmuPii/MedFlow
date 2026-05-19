$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\.."
python -m pip install -r backend\requirements.txt
python -m PyInstaller --noconfirm --onefile --name medflow_backend --distpath backend\bin --workpath backend\build --specpath backend backend\run_server.py
