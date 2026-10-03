# 只打包公开项目文件，不带依赖、构建结果、原始表格与本地备份。
param([string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
$projectDirectory = (Resolve-Path -LiteralPath (Split-Path -Parent $PSScriptRoot)).Path
$projectName = Split-Path -Leaf $projectDirectory
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $projectDirectory 'outputs' }
$null = New-Item -ItemType Directory -Path $OutputDirectory -Force
$outputPath = (Resolve-Path -LiteralPath $OutputDirectory).Path
$staging = Join-Path $projectDirectory ('.local\package-' + [Guid]::NewGuid().ToString('N'))
$stagingProject = Join-Path $staging $projectName
$null = New-Item -ItemType Directory -Path $stagingProject -Force
$files = @('.gitignore', 'README.md', 'index.html', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'tsconfig.json', 'vite.config.ts', '更新网站数据.cmd')
$folders = @('.github', 'docs', 'src', 'shared', 'scripts', 'public', 'tests')
foreach ($name in $files + $folders) {
  Copy-Item -LiteralPath (Join-Path $projectDirectory $name) -Destination $stagingProject -Recurse
}
foreach ($name in @('local-imports', 'local-snapshots')) {
  $directory = Join-Path $stagingProject $name
  $null = New-Item -ItemType Directory -Path $directory
  Copy-Item -LiteralPath (Join-Path $projectDirectory "$name\.gitkeep") -Destination $directory
}
$unexpected = Get-ChildItem -LiteralPath $stagingProject -Recurse -Force -File | Where-Object {
  $_.Extension -in @('.xlsx', '.xls', '.csv', '.zip', '.log') -or $_.Name -like '.env*'
}
if ($unexpected) { throw '待打包目录包含原始表格、凭据或多余文件，请检查。' }
$archive = Join-Path $outputPath "$projectName-源码.zip"
Compress-Archive -LiteralPath $stagingProject -DestinationPath $archive -Force
Write-Host "源码包已保存：$archive" -ForegroundColor Green
