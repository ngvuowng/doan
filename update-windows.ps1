# Lay code moi nhat tu GitHub roi chay lai website tren may Windows.
# Cach dung: nhap dup update-windows.cmd (nam canh file nay).
# Sau khi khoi dong lai may cung chay file nay: khong co code moi thi chi bat lai web, khong build lai.
#
# File chi dung ky tu ASCII: Windows PowerShell 5.1 doc file khong co BOM theo bang ma ANSI,
# chu Viet co dau se bi vo va co the lam hong cu phap.

$root = $PSScriptRoot
$backend = Join-Path $root 'backend'
$frontend = Join-Path $root 'frontend'
$py = Join-Path $backend '.venv\Scripts\python.exe'
$pidFile = Join-Path $env:TEMP 'halona-pids.txt'
# Commit cua lan chay thanh cong gan nhat. Nam trong .next nen da bi git bo qua,
# va tu mat khi build hong (.next bi xoa) -> lan sau build lai tu dau.
$stamp = Join-Path $frontend '.next\deployed-commit'

function Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Check($what) { if ($LASTEXITCODE -ne 0) { throw "Loi o buoc: $what" } }
# Co file nao khop mau thay doi tu lan chay truoc khong (khong ro thi coi nhu co).
function Changed($pattern) {
  if ($null -eq $changed) { return $true }
  return [bool]($changed | Where-Object { $_ -like $pattern })
}

# Mo mot cua so PowerShell rieng chay lenh, tra ve process de lan sau tat ca cay tien trinh.
function Open-Window($title, $dir, $command) {
  Start-Process powershell -PassThru -WorkingDirectory $dir -ArgumentList @(
    '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command',
    "`$host.UI.RawUI.WindowTitle = '$title'; $command"
  )
}

try {
  Step 'Tat backend va frontend dang chay'
  if (Test-Path $pidFile) {
    foreach ($line in Get-Content $pidFile) {
      # So PID co the da duoc cap cho tien trinh khac sau khi khoi dong lai may,
      # nen chi tat khi thoi diem bat dau khop dung cua so lan truoc mo.
      $id, $ticks = $line -split '\|'
      $p = Get-Process -Id $id -ErrorAction SilentlyContinue
      if ($p -and $p.StartTime.Ticks -eq [long]$ticks) { taskkill /T /F /PID $id *> $null }
    }
    Remove-Item $pidFile
  }
  # Ca tien trinh bat bang tay (khong nam trong $pidFile) van dang giu cong.
  foreach ($port in 8000, 3000) {
    Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $_.OwningProcess -gt 4 } |
      ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  }

  Step 'Lay code moi tu GitHub'
  Set-Location $root
  # npm tren may nay co the da ghi lai file lock; bo thay doi do de git pull khong bi chan.
  git checkout -- frontend/package-lock.json
  git pull --ff-only
  Check 'git pull. May nay co file bi sua tay? Xem bang: git status'

  # So voi commit cua lan chay thanh cong truoc (khong phai voi truoc khi pull), nen
  # git pull bang tay hay lan truoc build loi thi lan nay van biet can lam lai gi.
  # $changed = $null nghia la khong biet, cai va build lai het.
  $changed = $null
  if (Test-Path $stamp) {
    $changed = @(git diff --name-only (Get-Content $stamp).Trim() HEAD)
    if ($LASTEXITCODE -ne 0) { $changed = $null }
  }
  if ($null -eq $changed) { Write-Host 'Chua ro lan chay truoc, se cai va build lai tu dau' }
  else { Write-Host "$($changed.Count) file thay doi tu lan chay truoc" }

  Step 'Bat CSDL (Docker)'
  docker compose up -d
  Check 'docker compose. Docker Desktop da mo chua?'

  Step 'Backend'
  Set-Location $backend
  if (Changed 'backend/requirements.txt') {
    & $py -m pip install -r requirements.txt
    Check 'pip install'
  }
  & $py -m alembic upgrade head
  Check 'alembic upgrade head'
  $be = Open-Window 'Halona backend' $backend "& '$py' -m uvicorn app.main:app --port 8000"

  # npm run build doc du lieu that tu API, nen phai doi backend len truoc.
  $up = $false
  for ($i = 0; $i -lt 60 -and -not $up; $i++) {
    try {
      Invoke-WebRequest 'http://127.0.0.1:8000/api/health' -UseBasicParsing -TimeoutSec 2 | Out-Null
      $up = $true
    } catch { Start-Sleep -Seconds 1 }
  }
  if (-not $up) { throw 'Backend khong len sau 60 giay. Xem loi trong cua so "Halona backend".' }

  Step 'Frontend'
  Set-Location $frontend
  if (-not (Test-Path 'node_modules') -or (Changed 'frontend/package-lock.json')) {
    npm ci
    Check 'npm ci'
  }
  # Next luu anh da toi uu theo URL (giu toi 4 gio). Anh moi trung ten file cu se van hien
  # ban cu, nen xoa bo nho dem nay moi khi thu muc anh thay doi.
  if ((Changed 'frontend/public/images/*') -and (Test-Path '.next\cache\images')) {
    Remove-Item '.next\cache\images' -Recurse -Force
    Write-Host 'Da xoa bo nho dem anh cu cua Next'
  }
  if (-not (Test-Path '.next\BUILD_ID') -or (Changed 'frontend/*')) {
    npm run build
    Check 'npm run build'
  } else {
    Write-Host 'Khong co thay doi o frontend, dung lai ban build cu'
  }
  $fe = Open-Window 'Halona frontend' $frontend 'npm start'

  $be, $fe | ForEach-Object { "$($_.Id)|$($_.StartTime.Ticks)" } | Set-Content $pidFile
  Set-Location $root
  git rev-parse HEAD | Set-Content $stamp
  Write-Host "`nXong. Web: http://localhost:3000 va https://nguyenvuong.id.vn" -ForegroundColor Green
} catch {
  Write-Host "`nLOI: $_" -ForegroundColor Red
  exit 1
}
