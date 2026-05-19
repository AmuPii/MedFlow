$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\.."
npm install
npm run install:frontend
python -m pip install -r backend\requirements.txt
npm run pack:win

