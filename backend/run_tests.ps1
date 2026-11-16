param(
    [switch]$LiveGemini
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path "reports" | Out-Null

$pytestArgs = @(
    "-m", "not gemini_live",
    "-v",
    "--tb=long",
    "--durations=10",
    "--html=reports/test-report.html",
    "--self-contained-html",
    "--junitxml=reports/junit.xml",
    "--cov=users",
    "--cov=projects",
    "--cov=ai",
    "--cov-report=term-missing",
    "--cov-report=xml:reports/coverage.xml",
    "--cov-report=html:reports/htmlcov"
)

if ($LiveGemini) {
    $env:RUN_GEMINI_LIVE = "1"

    $pytestArgs = @(
        "-m", "gemini_live",
        "-v",
        "--tb=long",
        "--html=reports/gemini-live.html",
        "--self-contained-html"
    )
}

try {
    & python -m pytest @pytestArgs 2>&1 |
        Tee-Object -FilePath "reports/debug.log"

    $result = $LASTEXITCODE
}
finally {
    if ($LiveGemini) {
        Remove-Item Env:RUN_GEMINI_LIVE -ErrorAction SilentlyContinue
    }
}

exit $result