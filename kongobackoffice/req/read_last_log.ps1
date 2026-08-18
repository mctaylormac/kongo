# Script utilitaire pour l'Agent Archiviste
# Affiche le contenu du fichier le plus récent dans le dossier /req

$reqDir = "req"
if (Test-Path $reqDir) {
    $lastLog = Get-ChildItem $reqDir -Filter *.txt | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($lastLog) {
        Write-Host "--- DERNIER LOG TROUVÉ : $($lastLog.Name) ---"
        Get-Content $lastLog.FullName
    } else {
        Write-Host "Aucun log trouvé dans $reqDir"
    }
} else {
    Write-Host "Le dossier $reqDir n'existe pas."
}
