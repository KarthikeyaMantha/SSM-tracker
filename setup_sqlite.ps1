$zipUrl = "https://sqlite.org/2026/sqlite-tools-win-x64-3530200.zip"
$zipFile = "sqlite-tools.zip"
$extractDir = "sqlite-temp"

Write-Host "Downloading SQLite tools..."
Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile

Write-Host "Extracting SQLite tools..."
Expand-Archive -Path $zipFile -DestinationPath $extractDir -Force

# Copy sqlite3.exe to the current directory
$exePath = Get-ChildItem -Path $extractDir -Filter "sqlite3.exe" -Recurse | Select-Object -First 1
if ($exePath) {
    Copy-Item -Path $exePath.FullName -Destination "." -Force
    Write-Host "sqlite3.exe extracted successfully to workspace."
} else {
    Write-Error "sqlite3.exe not found in the extracted zip."
}

# Cleanup
Write-Host "Cleaning up temporary files..."
Remove-Item -Path $zipFile -Force
Remove-Item -Path $extractDir -Recurse -Force
Write-Host "Setup complete!"
