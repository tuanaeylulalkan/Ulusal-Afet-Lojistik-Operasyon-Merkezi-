$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
$listener.Start()
Write-Host "Sunucu baslatildi: http://127.0.0.1:$port/"

try {
    while ($true) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath.Replace('/', '\')
        $fullPath = Join-Path "c:\Users\tuana\Desktop\afet lojstik" $localPath
        
        if (Test-Path -PathType Container $fullPath) {
            $fullPath = Join-Path $fullPath "index.html"
        }
        
        if (Test-Path -PathType Leaf $fullPath) {
            $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
            $mime = "application/octet-stream"
            switch ($ext) {
                ".html" { $mime = "text/html" }
                ".js" { $mime = "application/javascript" }
                ".css" { $mime = "text/css" }
                ".json" { $mime = "application/json" }
                ".svg" { $mime = "image/svg+xml" }
            }
            $buffer = [System.IO.File]::ReadAllBytes($fullPath)
            $response.ContentType = $mime
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
}
finally {
    $listener.Stop()
}
