$siteRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $siteRoot

if (-not $env:JINHEXI_ADMIN_PASSWORD) {
  $env:JINHEXI_ADMIN_PASSWORD = Read-Host "请输入本地后台密码"
}

node server.js
