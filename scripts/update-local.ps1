param([string]$Workbook)
$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectDirectory
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw '请先安装Node.js 24 LTS，然后重新打开此工具。' }
if (-not (Test-Path -LiteralPath 'node_modules')) { throw '请按维护说明安装项目依赖，再运行数据更新。' }
if ($Workbook) { & node 'scripts/import-workbook.mjs' $Workbook } else { & node 'scripts/import-workbook.mjs' }
if ($LASTEXITCODE -ne 0) { throw '数据未更新，请按上面的行号修正表格。' }
& node 'scripts/validate-data.mjs'
if ($LASTEXITCODE -ne 0) { throw '数据校验失败。' }
Write-Host '数据已更新。请运行本地预览，确认后提交并手动发布。' -ForegroundColor Green
