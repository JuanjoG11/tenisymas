[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$headers = @{
    "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybGFhZGFnZ21wanRkbXRudG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTM0NjksImV4cCI6MjA4NTAyOTQ2OX0.B7RLhRRvuz5jAsRAHLhWIPtW3KdhEEAKzoKV3DfeoJE"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybGFhZGFnZ21wanRkbXRudG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NTM0NjksImV4cCI6MjA4NTAyOTQ2OX0.B7RLhRRvuz5jAsRAHLhWIPtW3KdhEEAKzoKV3DfeoJE"
    "Content-Type" = "application/json"
}
$bodyObject = @{
    name = "Colección petos 1"
    category = "petos"
    price = "$150.000"
    sizes = @("S", "M", "L", "XL")
    image = "images/uniformes-main.png"
}
$bodyJson = $bodyObject | ConvertTo-Json -Compress
$bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyJson)

try {
    $response = Invoke-RestMethod -Uri "https://nrlaadaggmpjtdmtntoz.supabase.co/rest/v1/products" -Method Post -Headers $headers -Body $bodyBytes
    Write-Output "SUCCESS"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errText = $reader.ReadToEnd()
        Write-Output "DETAILS: $errText"
    }
}
