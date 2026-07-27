$siteRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $siteRoot

if (-not $env:JHI_ADMIN_PASSWORD) {
  $env:JHI_ADMIN_PASSWORD = "jhi2026"
}

node server.js
