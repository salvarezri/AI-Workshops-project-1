$ErrorActionPreference = "Stop"

$localNode = "C:\Users\santi\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$node = Get-Command node -ErrorAction SilentlyContinue

if ($node) {
  & $node.Source "$PSScriptRoot\server.js"
} elseif (Test-Path $localNode) {
  & $localNode "$PSScriptRoot\server.js"
} else {
  Write-Error "Node.js was not found. Install Node.js or run this inside Codex with the bundled runtime available."
}
