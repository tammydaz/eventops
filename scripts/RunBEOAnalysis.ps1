Add-Type -AssemblyName System.IO.Compression.FileSystem

$sampleFile = "c:\eventops\docs\beo_sample_list.txt"
$outputFile = "c:\eventops\docs\BEO_RAW_DUMP.txt"
$files = Get-Content $sampleFile | Where-Object { $_.Trim() -ne "" }

Write-Host "Starting BEO extraction - $($files.Count) files" -ForegroundColor Cyan
Set-Content $outputFile "" -Encoding UTF8

function Read-XlsxText($path) {
    try {
        $zip = [System.IO.Compression.ZipFile]::OpenRead($path)

        # Shared strings: just grab every <t> text content in order
        $ss = @()
        $ssEntry = $zip.Entries | Where-Object { $_.FullName -eq "xl/sharedStrings.xml" }
        if ($ssEntry) {
            $sr = New-Object System.IO.StreamReader($ssEntry.Open())
            $xml = $sr.ReadToEnd(); $sr.Close()
            $ss = [regex]::Matches($xml, '<t(?:\s[^>]*)?>([^<]*)</t>') | ForEach-Object { $_.Groups[1].Value }
        }

        # Sheet: find every cell, resolve value
        $sheetEntry = $zip.Entries | Where-Object { $_.FullName -like "xl/worksheets/sheet1*" } | Select-Object -First 1
        $lines = @()
        if ($sheetEntry) {
            $sr = New-Object System.IO.StreamReader($sheetEntry.Open())
            $xml = $sr.ReadToEnd(); $sr.Close()

            # Split by rows
            $rows = [regex]::Matches($xml, '<row\b[^>]*>(.*?)</row>', 'Singleline')
            foreach ($row in $rows) {
                $vals = @()
                # Each cell
                $cells = [regex]::Matches($row.Value, '<c\b([^>]*)>(.*?)</c>', 'Singleline')
                foreach ($cell in $cells) {
                    $attrs = $cell.Groups[1].Value
                    $inner = $cell.Groups[2].Value
                    $isShared = $attrs -match 't="s"'
                    $vMatch = [regex]::Match($inner, '<v>([^<]*)</v>')
                    $tMatch = [regex]::Match($inner, '<t[^>]*>([^<]*)</t>')
                    if ($isShared -and $vMatch.Success) {
                        $idx = [int]$vMatch.Groups[1].Value
                        if ($idx -ge 0 -and $idx -lt $ss.Count) { $vals += $ss[$idx] }
                    } elseif ($tMatch.Success) {
                        $vals += $tMatch.Groups[1].Value
                    } elseif ($vMatch.Success) {
                        $vals += $vMatch.Groups[1].Value
                    }
                }
                $line = ($vals | Where-Object { $_ -and $_.Trim() -ne "" }) -join "  |  "
                if ($line.Trim()) { $lines += $line }
            }
        }
        $zip.Dispose()
        return $lines -join "`n"
    } catch { return "ERROR: $_" }
}

$i = 0
foreach ($f in $files) {
    $i++
    $name = [System.IO.Path]::GetFileNameWithoutExtension($f)
    Write-Host "[$i/$($files.Count)] $name" -ForegroundColor Yellow
    $text = Read-XlsxText $f
    Add-Content $outputFile "=== FILE $i`: $name ===" -Encoding UTF8
    Add-Content $outputFile $text -Encoding UTF8
    Add-Content $outputFile "" -Encoding UTF8
    [GC]::Collect()
}

$kb = [math]::Round((Get-Item $outputFile).Length / 1KB, 1)
Write-Host "DONE - $outputFile ($kb KB)" -ForegroundColor Green
