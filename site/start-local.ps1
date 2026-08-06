$siteRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $siteRoot

if (-not $env:JINHEXI_ADMIN_PASSWORD) {
  $env:JINHEXI_ADMIN_PASSWORD = "jinhexi2026"
}

node server.js
