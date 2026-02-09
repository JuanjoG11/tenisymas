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
$body = $bodyObject | ConvertTo-Json -Compress
try {
    $response = Invoke-RestMethod -Uri "https://nrlaadaggmpjtdmtntoz.supabase.co/rest/v1/products" -Method Post -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    Write-Output "SUCCESS: Product added"
    Write-Output ($response | ConvertTo-Json)
} catch {
    Write-Error $_.Exception.Message
    $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errResp = $streamReader.ReadToEnd()
    Write-Error $errResp
}
