param(
  [Parameter(Mandatory=$true)][string]$Owner,
  [Parameter(Mandatory=$true)][string]$Repo,
  [Parameter(Mandatory=$true)][string]$Branch
)

$ErrorActionPreference = 'Stop'

# Compose base URLs
$base = "https://api.github.com/repos/$Owner/$Repo"
$branchEnc = [uri]::EscapeDataString($Branch)

# Get latest runs for the branch
$runsUri = "$base/actions/runs?branch=$branchEnc&per_page=5"
$runs = Invoke-RestMethod -Uri $runsUri -UserAgent 'TraeAI-CI-Monitor'

if (-not $runs.workflow_runs) {
  Write-Output "NO_RUNS"
  exit 0
}

# Pick the newest run
$run = $runs.workflow_runs | Sort-Object -Property created_at -Descending | Select-Object -First 1

# Fetch jobs and artifacts for that run
$jobsUri = "$base/actions/runs/$($run.id)/jobs"
$jobs = Invoke-RestMethod -Uri $jobsUri -UserAgent 'TraeAI-CI-Monitor'

$artsUri = "$base/actions/runs/$($run.id)/artifacts"
$arts = Invoke-RestMethod -Uri $artsUri -UserAgent 'TraeAI-CI-Monitor'

# Build result object
$out = [PSCustomObject]@{
  run = [PSCustomObject]@{
    id = $run.id
    status = $run.status
    conclusion = $run.conclusion
    html_url = $run.html_url
    name = $run.name
    event = $run.event
    created_at = $run.created_at
    updated_at = $run.updated_at
  }
  jobs = @()
  artifacts = @()
}

foreach ($j in $jobs.jobs) {
  $out.jobs += [PSCustomObject]@{
    id = $j.id
    name = $j.name
    status = $j.status
    conclusion = $j.conclusion
    html_url = $j.html_url
    started_at = $j.started_at
    completed_at = $j.completed_at
  }
}

foreach ($a in $arts.artifacts) {
  # Construct a human-friendly artifact page URL (UI link)
  $artifactPage = "https://github.com/$Owner/$Repo/actions/runs/$($run.id)/artifacts/$($a.id)"
  $out.artifacts += [PSCustomObject]@{
    id = $a.id
    name = $a.name
    size_in_bytes = $a.size_in_bytes
    expired = $a.expired
    archive_download_url = $a.archive_download_url
    html_url = $artifactPage
  }
}

$out | ConvertTo-Json -Depth 6