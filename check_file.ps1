# Check line count
$path = 'D:\\Senior Project New\\forum-page-build\\UI-FEATURE-DESCRIPTION.txt'
$content = Get-Content $path -Encoding UTF8
Write-Output "Lines: $($content.Count)"

# Show last 20 lines
for ($i = $content.Count - 20; $i -lt $content.Count; $i++) {
    Write-Output $content[$i]
}