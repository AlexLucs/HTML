$Version = "0.2"
$YtDlpCommand = "dl"
$ConcurrentFragments = 16
$LogDirectory = "."

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
Write-Host "Download de trechos de live do X" -ForegroundColor Cyan
$separator = "-" * 100
Write-Host "$separator" -ForegroundColor Cyan
Write-Host "Digite 'X' e Enter para sair a qualquer momento" -ForegroundColor DarkYellow
Write-Host "$separator" -ForegroundColor Cyan

if (-not (Get-Command $YtDlpCommand -ErrorAction SilentlyContinue)) {
  Write-Host "ERRO: Comando '$YtDlpCommand' não encontrado no PATH" -ForegroundColor Red
  Write-Host "Instale o yt-dlp ou altere a variável `$YtDlpCommand no início do script" -ForegroundColor Red
  exit
}
if (-not (Test-Path $LogDirectory)) {
  New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null
}

$LogFile = $null
function Write-Log {
  param([string]$Message, [string]$Level = "INFO")
  if (-not $LogFile) { return }
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$timestamp [$Level] $Message" | Out-File -FilePath $LogFile -Append -Encoding UTF8
}

function Test-ExitRequest {
  param([string]$userInput)
  if ($null -ne $userInput -and $userInput.Trim().ToLower() -eq 'x') {
    Write-Host "Saída solicitada pelo usuário" -ForegroundColor Red
    exit
  }
}

function Test-ValidBroadcastUrl {
  param([string]$url)
  if ([string]::IsNullOrWhiteSpace($url)) { return $false }
  $url = $url.Trim()
  $lowerUrl = $url.ToLower()
  if ($lowerUrl -match '^(?:https?://)?(?:www\.)?(?:x|twitter)\.com/i/broadcasts/[a-z0-9_-]{13}$') {
    return $true
  }
  if ($lowerUrl -match '^[a-z0-9_-]{13}$') {
    return $true
  }
  return $false
}

function Convert-TimeInputToSeconds {
  param([string]$timeStr)
  $timeStr = $timeStr.Trim()
  if ([string]::IsNullOrWhiteSpace($timeStr)) { return 0 }
  $inputLower = $timeStr.ToLower()
  if ($inputLower -match '[hms]') {
    $total = 0
    if ($inputLower -match '(\d+)\s*h') { $total += [int]$Matches[1] * 3600 }
    if ($inputLower -match '(\d+)\s*m') { $total += [int]$Matches[1] * 60 }
    if ($inputLower -match '(\d+)\s*s') { $total += [int]$Matches[1] }
    if ($total -eq 0) { throw "Nenhum valor numérico encontrado com símbolos h, m ou s em: $timeStr" }
  } else {
    $clean = $timeStr -replace '\.',':'
    $parts = ($clean -split ':') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
    if ($parts.Count -ne 3) {
      throw "A entrada deve ser no formato HH:MM:SS, HH.MM.SS ou XXhXXmXXs`nExemplo: 01:23:45, 02.15.30, 1h23m45s, 1h1s, 20m..."
    }
    $h = [int]$parts[0]
    $m = [int]$parts[1]
    $s = [int]$parts[2]
    $total = ($h * 3600) + ($m * 60) + $s
  }
  if ($total -gt 43200) { throw "Tempo máximo permitido por trecho é 12 horas (12:00:00)." }
  return $total
}

function Format-TimeForFilename {
  param([int]$totalSeconds)
  if ($totalSeconds -le 0) { return "00h00m00s" }
  $h = [int][math]::Floor($totalSeconds / 3600)
  $rem = $totalSeconds % 3600
  $m = [int][math]::Floor($rem / 60)
  $s = $rem % 60
  if ($h -gt 0) { return "{0:D2}h{1:D2}m{2:D2}s" -f $h,$m,$s }
  elseif ($m -gt 0) { return "{0:D2}m{1:D2}s" -f $m,$s }
  else { return "{0:D2}s" -f $s }
}

do {
  do {
    Write-Host "Cole o link da live ou o ID da transmissão" -ForegroundColor Yellow
    Write-Host "URL/ID: " -NoNewline -ForegroundColor Green
    $Url = Read-Host
    Test-ExitRequest $Url
    if (-not (Test-ValidBroadcastUrl $Url)) {
      Write-Host "URL/ID inválido." -ForegroundColor Red
      Write-Host "Exemplos válidos:" -ForegroundColor Red
      Write-Host " • https://x.com/i/broadcasts/XXXXXXXXXXXXX" -ForegroundColor Red
      Write-Host " • XXXXXXXXXXXXX (apenas o ID - 13 caracteres)" -ForegroundColor Red
      continue
    }
    $trimmedUrl = $Url.Trim()
    $lowerUrl = $trimmedUrl.ToLower()
    if ($lowerUrl -match '^[a-z0-9_-]{13}$') {
      $Url = "https://x.com/i/broadcasts/$trimmedUrl"
      Write-Host "→ ID detectado. Convertido para URL completa." -ForegroundColor DarkCyan
    } elseif ($Url -notmatch '^https?://') {
      $Url = "https://$Url"
    }
    $broadcastId = if ($Url -match '/broadcasts/([a-z0-9_-]{13})') { $Matches[1] } else { "unknown" }
    $LogFile = "$LogDirectory\yt-dlp_$broadcastId`_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
    Write-Log "=== Script iniciado - Versão $Version ==="
    Write-Log "Comando yt-dlp: $YtDlpCommand"
    Write-Log "Fragmentos concorrentes: $ConcurrentFragments"
    Write-Log "URL da transmissão: $Url"
    Write-Host "→ URL válida: $Url" -ForegroundColor DarkCyan
    Write-Host "→ Log criado: $LogFile" -ForegroundColor DarkCyan
    break
  } while ($true)

  $sections = @()
  do {
    $index = $sections.Count + 1
    Write-Host "=== Trecho $index ===" -ForegroundColor Magenta
    do {
      Write-Host "Digite o tempo de INÍCIO." -ForegroundColor Yellow
      Write-Host "Ex: 2h, 1h45m, 3725s, 02:15:30, 02.15.30, enter para 00:00:00" -ForegroundColor DarkGray
      Write-Host "Início: " -NoNewline -ForegroundColor Green
      $StartInput = Read-Host
      Test-ExitRequest $StartInput
      try {
        $StartSeconds = Convert-TimeInputToSeconds $StartInput
        $StartPretty = Format-TimeForFilename $StartSeconds
        Write-Host "→ Início: $StartPretty" -ForegroundColor DarkCyan
        break
      }
      catch {
        Write-Host "Formato inválido: $($_.Exception.Message)" -ForegroundColor Red
      }
    } while ($true)

    do {
      Write-Host "Digite o tempo de FIM." -ForegroundColor Yellow
      Write-Host "Ex: 2h, 1h45m, 3725s, 02:15:30, 02.15.30, enter para o fim da live" -ForegroundColor DarkGray
      Write-Host "Fim: " -NoNewline -ForegroundColor Green
      $EndInput = Read-Host
      Test-ExitRequest $EndInput
      try {
        if ([string]::IsNullOrWhiteSpace($EndInput)) {
          $EndSeconds = $null
          $IsToEnd = $true
          Write-Host "→ Até o final da live" -ForegroundColor DarkCyan
          break
        }
        $EndSeconds = Convert-TimeInputToSeconds $EndInput
        if ($EndSeconds -le $StartSeconds) {
          Write-Host "Erro: O tempo final deve ser maior que o inicial" -ForegroundColor Red
          continue
        }
        $EndPretty = Format-TimeForFilename $EndSeconds
        Write-Host "→ Fim: $EndPretty" -ForegroundColor DarkCyan
        $IsToEnd = $false
        break
      }
      catch {
        Write-Host "Formato inválido: $($_.Exception.Message)" -ForegroundColor Red
      }
    } while ($true)

    $sections += [pscustomobject]@{
      StartSeconds = $StartSeconds
      EndSeconds = $EndSeconds
      IsToEnd = $IsToEnd
    }

    Write-Host "O que deseja fazer agora?" -ForegroundColor Yellow
    Write-Host " [A] Adicionar novo trecho" -ForegroundColor DarkGray
    Write-Host " [D] Prosseguir com os downloads" -ForegroundColor DarkGray
    Write-Host " [C] Corrigir o último trecho" -ForegroundColor DarkGray
    Write-Host "Opção (Enter = D): " -NoNewline -ForegroundColor Green
    $choice = Read-Host
    Test-ExitRequest $choice
    $choice = $choice.Trim().ToLower()
    if ($choice -in @('c','corrigir')) {
      if ($sections.Count -gt 0) {
        if ($sections.Count -eq 1) { $sections = @() } else { $sections = $sections[0..($sections.Count - 2)] }
        Write-Host "Último trecho removido para correção" -ForegroundColor Cyan
        continue
      }
    }
    elseif ($choice -in @('a','adicionar')) {
      continue
    }
    else {
      break
    }
  } while ($true)

  Write-Log "Total de trechos configurados: $($sections.Count)"
  for ($i = 0; $i -lt $sections.Count; $i++) {
    $sec = $sections[$i]
    $s = Format-TimeForFilename $sec.StartSeconds
    $e = if ($sec.IsToEnd) { "Fim da live" } else { Format-TimeForFilename $sec.EndSeconds }
    Write-Log "Trecho $($i+1): Início $s → Fim $e"
  }

  Write-Host "$separator" -ForegroundColor Cyan
  Write-Host "Total de trechos configurados: $($sections.Count)" -ForegroundColor Green
  Write-Host "$separator" -ForegroundColor Cyan

  if ($sections.Count -eq 0) {
    Write-Host "Nenhum trecho configurado" -ForegroundColor Yellow
    continue
  }

  $confirm = Read-Host "Prosseguir com o download de todos os trechos? [S/n] "
  Test-ExitRequest $confirm
  if ($confirm.Trim().ToLower() -eq 'n') {
    Write-Log "Operação cancelada pelo usuário" -Level "WARN"
    Write-Host "Operação cancelada." -ForegroundColor Yellow
    continue
  }
  Write-Log "Usuário confirmou prosseguimento"

  Write-Host "$separator" -ForegroundColor Cyan
  Write-Host "Iniciando download de $($sections.Count) trecho(s)..." -ForegroundColor Green
  Write-Host "Logs sendo salvos em: $LogFile" -ForegroundColor DarkCyan
  Write-Host "$separator" -ForegroundColor Cyan

  $results = @()
  $isPS7OrHigher = $PSVersionTable.PSVersion.Major -ge 7
  if ($isPS7OrHigher) {
    $originalProgressView = $PSStyle.Progress.View
    $originalProgressStyle = $PSStyle.Progress.Style
    $PSStyle.Progress.View = 'Minimal'
    $PSStyle.Progress.Style = $PSStyle.Foreground.BrightCyan
  } else {
    $originalFG = $Host.PrivateData.ProgressForegroundColor
    $originalBG = $Host.PrivateData.ProgressBackgroundColor
    $Host.PrivateData.ProgressForegroundColor = "Cyan"
    $Host.PrivateData.ProgressBackgroundColor = "DarkGray"
  }

  for ($i = 0; $i -lt $sections.Count; $i++) {
    $section = $sections[$i]
    $num = "{0:D2}" -f ($i + 1)
    $totalPadded = "{0:D2}" -f $sections.Count
    $startFmt = Format-TimeForFilename $section.StartSeconds
    $endFmt = if ($section.IsToEnd) { "End" } else { Format-TimeForFilename $section.EndSeconds }
    $range = "*$($section.StartSeconds)"
    if (-not $section.IsToEnd) {
      $range += "-$($section.EndSeconds)"
    } else {
      $range += "-inf"
    }
    $displayRange = "$startFmt-$endFmt"
    $outputTemplate = "[%(uploader_id)s] [%(title)s] [%(id)s] [${startFmt}-${endFmt}].%(ext)s"
    $percentComplete = [math]::Round((($i + 1) / $sections.Count) * 100,0)
    Write-Progress -Activity "Download de trechos de live do X" `
       -Status "Processando trecho $num de $totalPadded" `
       -CurrentOperation "Range: $displayRange" `
       -PercentComplete $percentComplete
    Write-Host "Baixando trecho $num → $displayRange" -ForegroundColor Cyan
    Write-Log "Iniciando download trecho $num → $displayRange (range: $range)"

    $ExtArgument1 = "ffmpeg_i:-hwaccel cuda -hwaccel_output_format cuda"
    $ExtArgument2 = "ffmpeg_o:-c:v hevc_nvenc -preset p6 -rc constqp -qp 20 -c:a copy"
    $ExtArgument3 = "ffmpeg"
    $args = @(
      "--ignore-config",
      "--abort-on-error",
      "--force-overwrites",
      "--restrict-filenames",
      "--download-sections",$range,
      "--force-keyframes-at-cuts",
      "--concurrent-fragments",$ConcurrentFragments,
      "--external-downloader",$ExtArgument3,
      "--external-downloader-args",$ExtArgument1,
      "--external-downloader-args",$ExtArgument2,
      "--output",$outputTemplate,
      $Url
    )

    try {
      $output = & $YtDlpCommand @args 2>&1 | Tee-Object -FilePath $LogFile -Append
      $filename = "Não detectado"
      foreach ($line in $output) {
        if ($line -match '\[download\]\s+Destination:\s+(.+)') {
          $filename = $Matches[1].Trim()
          break
        }
      }
      $success = ($LASTEXITCODE -eq 0)
      $statusText = if ($success) { "✅ Concluído com sucesso" } else { "❌ Falha na execução" }
      $results += [pscustomobject]@{
        Numero = $num
        Range = "$startFmt - $endFmt"
        Filename = $filename
        Status = $statusText
        Sucesso = $success
      }
      Write-Log "Trecho $num finalizado → $statusText | Arquivo: $filename"
      if ($success) {
        Write-Host "Trecho $num concluído: $filename" -ForegroundColor Green
      } else {
        Write-Host "Trecho $num falhou" -ForegroundColor Red
      }
    }
    catch {
      $results += [pscustomobject]@{
        Numero = $num
        Range = "$startFmt - $endFmt"
        Filename = "Erro na execução"
        Status = "❌ Erro: $($_.Exception.Message)"
        Sucesso = $false
      }
      Write-Log "ERRO ao baixar trecho $num : $($_.Exception.Message)" -Level "ERROR"
      Write-Host "Erro ao baixar trecho $num : $($_.Exception.Message)" -ForegroundColor Red
    }
  }

  Write-Progress -Activity "Download de trechos de live do X" -Completed
  if ($isPS7OrHigher) {
    $PSStyle.Progress.View = $originalProgressView
    $PSStyle.Progress.Style = $originalProgressStyle
  } else {
    $Host.PrivateData.ProgressForegroundColor = $originalFG
    $Host.PrivateData.ProgressBackgroundColor = $originalBG
  }

  Write-Host "$separator" -ForegroundColor Cyan
  Write-Host "RESUMO DOS DOWNLOADS" -ForegroundColor Cyan
  Write-Host $separator -ForegroundColor Cyan
  $successCount = ($results | Where-Object { $_.Sucesso }).Count
  $totalCount = $results.Count
  Write-Host "Total de trechos processados : $totalCount" -ForegroundColor White
  Write-Host "Downloads concluídos com sucesso : $successCount" -ForegroundColor White
  Write-Log "=== RESUMO FINAL ==="
  Write-Log "Total de trechos: $totalCount | Sucessos: $successCount"
  foreach ($res in $results) {
    Write-Host "Trecho $($res.Numero) [Range: $($res.Range)]" -ForegroundColor Yellow
    Write-Host "Arquivo : $($res.Filename)" -ForegroundColor White
    if ($res.Sucesso) {
      Write-Host "Status : $($res.Status)" -ForegroundColor Green
    } else {
      Write-Host "Status : $($res.Status)" -ForegroundColor Red
    }
    Write-Log "Trecho $($res.Numero) [Range: $($res.Range)] → $($res.Status) | Arquivo: $($res.Filename)"
  }
  if ($successCount -eq $totalCount) {
    Write-Host "`nTodos os downloads foram concluídos com sucesso" -ForegroundColor Green
    Write-Log "Todos os downloads concluídos com sucesso"
  } elseif ($successCount -gt 0) {
    Write-Host "Alguns downloads falharam. Verifique o log para detalhes." -ForegroundColor Yellow
    Write-Log "Alguns downloads falharam" -Level "WARN"
  } else {
    Write-Host "Nenhum download foi concluído com sucesso." -ForegroundColor Red
    Write-Log "Nenhum download foi concluído com sucesso" -Level "ERROR"
  }

  Write-Host "$separator" -ForegroundColor Cyan
  Write-Host "Processo finalizado em $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkCyan

  $resposta = Read-Host "`nDeseja processar outra transmissão? [S/n] "
  Test-ExitRequest $resposta
  if ($resposta.Trim().ToLower() -eq 'n') {
    break
  }
  $sections = @()

} while ($true)