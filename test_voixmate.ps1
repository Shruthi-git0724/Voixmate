# --------------------------
# VoixMate Backend Test Script
# --------------------------

# Headers for JSON
$headers = @{ "Content-Type" = "application/json" }

# --- 1️⃣ Register User ---
$body = @{ "username"="test"; "password"="1234" } | ConvertTo-Json
Write-Host "`n--- Register User ---"
try {
    $register = Invoke-RestMethod -Uri "http://127.0.0.1:5000/auth/register" -Method POST -Headers $headers -Body $body
    Write-Host $register.message
} catch {
    Write-Host $_.Exception.Message
}

# --- 2️⃣ Login User ---
Write-Host "`n--- Login User ---"
$body = @{ "username"="test"; "password"="1234" } | ConvertTo-Json
try {
    $login = Invoke-RestMethod -Uri "http://127.0.0.1:5000/auth/login" -Method POST -Headers $headers -Body $body
    $token = $login.token
    Write-Host "Token: $token"
} catch {
    Write-Host $_.Exception.Message
}

# --- 3️⃣ Get Profile ---
Write-Host "`n--- Get Profile ---"
$headersAuth = @{ "Authorization" = "Bearer $token" }
try {
    $ profile = Invoke-RestMethod -Uri "http://127.0.0.1:5000/user/profile" -Method GET -Headers $headersAuth
    Write-Host ($profile | ConvertTo-Json)
} catch {
    Write-Host $_.Exception.Message
}

# --- 4️⃣ Get All Users ---
Write-Host "`n--- Get All Users ---"
try {
    $allUsers = Invoke-RestMethod -Uri "http://127.0.0.1:5000/user/all" -Method GET
    Write-Host ($allUsers | ConvertTo-Json)
} catch {
    Write-Host $_.Exception.Message
}

Write-Host "`n✅ Backend Test Completed!"
