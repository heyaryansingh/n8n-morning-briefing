$path = 'C:\Aryan\GitHub Projects\n8n-morning-briefing'
$logFile = 'C:\Aryan\GitHub Projects\n8n-morning-briefing\file-watcher.log'

# Clear previous log if exists
if (Test-Path $logFile) { Remove-Item $logFile }

# Create the FileSystemWatcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $path
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]::FileName -bor [System.IO.NotifyFilters]::LastWrite -bor [System.IO.NotifyFilters]::DirectoryName

# Event handlers
$onChange = {
    $details = $Event.SourceEventArgs
    $filePath = $details.FullPath
    $changeType = $details.ChangeType
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    
    $basePath = 'C:\Aryan\GitHub Projects\n8n-morning-briefing'
    $relativePath = $filePath.Replace($basePath, '').TrimStart('\')
    
    # Check if file matches our criteria
    $match = $false
    if ($relativePath -match '^workflows\.*\.json$') { $match = $true }
    if ($relativePath -match '^(prompts|templates)\.*\.md$') { $match = $true }
    
    if ($match) {
        $logEntry = "[$timestamp] $changeType : $relativePath"
        Add-Content -Path 'C:\Aryan\GitHub Projects\n8n-morning-briefing\file-watcher.log' -Value $logEntry
        Write-Host $logEntry
    }
}

$onRenamed = {
    $details = $Event.SourceEventArgs
    $oldPath = $details.OldFullPath
    $newPath = $details.FullPath
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    
    $basePath = 'C:\Aryan\GitHub Projects\n8n-morning-briefing'
    $oldRelative = $oldPath.Replace($basePath, '').TrimStart('\')
    $newRelative = $newPath.Replace($basePath, '').TrimStart('\')
    
    # Check if either path matches our criteria
    $match = $false
    if ($oldRelative -match '^workflows\.*\.json$') { $match = $true }
    if ($newRelative -match '^workflows\.*\.json$') { $match = $true }
    if ($oldRelative -match '^(prompts|templates)\.*\.md$') { $match = $true }
    if ($newRelative -match '^(prompts|templates)\.*\.md$') { $match = $true }
    
    if ($match) {
        $logEntry = "[$timestamp] Renamed : $oldRelative -> $newRelative"
        Add-Content -Path 'C:\Aryan\GitHub Projects\n8n-morning-briefing\file-watcher.log' -Value $logEntry
        Write-Host $logEntry
    }
}

# Register events
Register-ObjectEvent $watcher 'Changed' -Action $onChange | Out-Null
Register-ObjectEvent $watcher 'Created' -Action $onChange | Out-Null
Register-ObjectEvent $watcher 'Deleted' -Action $onChange | Out-Null
Register-ObjectEvent $watcher 'Renamed' -Action $onRenamed | Out-Null

$startTime = Get-Date
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] FileSystemWatcher started"
Write-Host "Monitoring: $path"
Write-Host "Watching for:"
Write-Host "  - *.json files in workflows/"
Write-Host "  - *.md files in prompts/ or templates/"
Write-Host ""
Write-Host "Monitoring for 2 minutes..."
Add-Content -Path $logFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] FileSystemWatcher started - monitoring for 2 minutes"

# Monitor for 2 minutes
$endTime = $startTime.AddMinutes(2)
while ((Get-Date) -lt $endTime) {
    Start-Sleep -Seconds 10
    $remaining = [math]::Round(($endTime - (Get-Date)).TotalSeconds)
    Write-Host "... $remaining seconds remaining"
}

# Cleanup
Get-EventSubscriber | Unregister-Event
$watcher.EnableRaisingEvents = $false
$watcher.Dispose()

Write-Host ""
Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] FileSystemWatcher stopped"
Add-Content -Path $logFile -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] FileSystemWatcher stopped"

Write-Host ""
Write-Host "=== Log Summary ==="
if (Test-Path $logFile) {
    Get-Content $logFile
} else {
    Write-Host 'No events logged'
}
