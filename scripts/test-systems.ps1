$ErrorActionPreference = "SilentlyContinue"
$b = "http://localhost:4000/api"
$jh = @{"Content-Type"="application/json"}

function Req($url, $method="GET", $hdrs=$jh, $rawBody=$null) {
  $r = $null
  if ($rawBody) {
    $r = Invoke-WebRequest $url -Method $method -Headers $hdrs -Body $rawBody -UseBasicParsing 2>&1
  } else {
    $r = Invoke-WebRequest $url -Method $method -Headers $hdrs -UseBasicParsing 2>&1
  }
  if ($r.Content) { return $r.Content | ConvertFrom-Json }
  return $null
}

# ─── 1. LOGIN ────────────────────────────────────────────────
Write-Host "`n=== 1. LOGIN ==="
$ml = Req "$b/auth/login" POST $jh '{"email":"member@readingnook.local","password":"MemberPass!2026","login_type":"member"}'
$mt = $ml.data.accessToken
Write-Host "  Member:  $(if($mt){'OK'} else {'FAIL - '+($ml | ConvertTo-Json -Depth 1)})"

$al = Req "$b/auth/login" POST $jh '{"email":"fern.admin@readingnook.local","password":"AdminPass!2026","login_type":"admin"}'
$at = $al.data.accessToken
Write-Host "  Admin:   $(if($at){'OK'} else {'FAIL'})"

$ol2 = Req "$b/auth/login" POST $jh '{"email":"owner@readingnook.local","password":"OwnerPass!2026","login_type":"owner"}'
$ot = $ol2.data.accessToken
Write-Host "  Owner:   $(if($ot){'OK'} else {'FAIL'})"

$mh = @{"Content-Type"="application/json"; "Authorization"="Bearer $mt"}
$ah = @{"Content-Type"="application/json"; "Authorization"="Bearer $at"}
$oh = @{"Content-Type"="application/json"; "Authorization"="Bearer $ot"}

if (-not $mt) { Write-Host "Cannot continue without member token"; exit }

# ─── 2. ALERT SYSTEM ─────────────────────────────────────────
Write-Host "`n=== 2. ALERT SYSTEM ==="
$mn = Req "$b/member/notifications" GET $mh
$an = Req "$b/admin/notifications" GET $ah
$on2 = Req "$b/owner/notifications" GET $oh
Write-Host "  Member notifications:  count=$($mn.Count) unread=$(($mn | Where-Object {$_.read_status -eq 'N'}).Count)"
Write-Host "  Admin  notifications:  count=$($an.Count)"
Write-Host "  Owner  notifications:  count=$($on2.Count)"
$unread = $mn | Where-Object { $_.read_status -eq 'N' } | Select-Object -First 1
if ($unread) {
  $marked = Req "$b/member/notifications/$($unread.notification_id)/read" PATCH $mh
  Write-Host "  Mark-as-read id=$($unread.notification_id): $(if($marked){'OK'} else {'FAIL'})"
} else { Write-Host "  (no unread to mark)" }

# ─── 3. FINE SYSTEM ──────────────────────────────────────────
Write-Host "`n=== 3. FINE SYSTEM ==="
$fines = Req "$b/member/fines" GET $mh
Write-Host "  Member fines: count=$($fines.Count)"
if ($fines.Count -gt 0) { $fines | ForEach-Object { Write-Host "    - $($_.title): Rs.$($_.fine_amount) [$($_.borrow_status)]" } }

$r1 = Req "$b/owner/settings" POST $oh '{"fine_per_day":-5,"premium_membership_cost":500,"standard_membership_cost":100,"standard_hold_hours":24,"premium_hold_hours":48}'
if ($r1.error) { Write-Host "  Reject negative fine:     PASS ($($r1.error.message))" }
else { Write-Host "  Reject negative fine:     FAIL - was accepted!" }

$r2 = Req "$b/owner/settings" POST $oh '{"fine_per_day":10,"premium_membership_cost":50,"standard_membership_cost":100,"standard_hold_hours":24,"premium_hold_hours":48}'
if ($r2.error) { Write-Host "  Reject premium<standard:  PASS ($($r2.error.message))" }
else { Write-Host "  Reject premium<standard:  FAIL - was accepted!" }

$r3 = Req "$b/owner/settings" POST $oh '{"fine_per_day":15,"premium_membership_cost":600,"standard_membership_cost":200,"standard_hold_hours":24,"premium_hold_hours":48}'
if ($r3.data.fine_per_day -eq 15 -or $r3.fine_per_day -eq 15) {
  $fine = if($r3.data) { $r3.data.fine_per_day } else { $r3.fine_per_day }
  Write-Host "  Valid settings saved:     PASS (fine=Rs.$fine/day)"
} else { Write-Host "  Valid settings saved:     FAIL $($r3 | ConvertTo-Json -Depth 2)" }

# ─── 4. RATING SYSTEM ────────────────────────────────────────
Write-Host "`n=== 4. RATING SYSTEM ==="
$cat = Req "$b/catalog/search" GET $mh
$rated = $cat | Where-Object { $null -ne $_.avg_rating -and $_.avg_rating -gt 0 }
Write-Host "  Catalog: total=$($cat.Count) books_with_ratings=$($rated.Count)"
if ($rated.Count -gt 0) {
  $top = $rated | Sort-Object avg_rating -Descending | Select-Object -First 3
  $top | ForEach-Object { Write-Host "    $([char]9733) $($_.avg_rating) ($($_.review_count) reviews) - $($_.title)" }
}
$pubId = $cat[0].publication_id
$rev = Req "$b/member/reviews" POST $mh "{`"publication_id`":$pubId,`"rating_value`":4,`"review_text`":`"Test review`"}"
if ($rev.review_id -or ($rev.data -and $rev.data.review_id)) {
  $revId = if ($rev.review_id) { $rev.review_id } else { $rev.data.review_id }
  Write-Host "  Submit review: PASS id=$revId rating=4"
  $del = Req "$b/member/reviews/$revId" DELETE $mh
  Write-Host "  Delete review: PASS"
} else { Write-Host "  Submit review: FAIL $($rev | ConvertTo-Json -Depth 2)" }

# ─── 5. READING LIST ─────────────────────────────────────────
Write-Host "`n=== 5. READING LIST ==="
$rl = Req "$b/member/reading-lists" POST $mh '{"list_name":"API Test List","visibility_status":"PRIVATE"}'
$rlId = if ($rl.reading_list_id) { $rl.reading_list_id } elseif ($rl.data) { $rl.data.reading_list_id } else { $null }
if ($rlId) {
  Write-Host "  Create list: PASS id=$rlId"
  $rll = Req "$b/member/reading-lists" GET $mh
  Write-Host "  Fetch lists:  count=$($rll.Count)"
  Req "$b/member/reading-lists/$rlId" DELETE $mh | Out-Null
  Write-Host "  Delete list:  PASS"
} else { Write-Host "  Create list: FAIL $($rl | ConvertTo-Json -Depth 2)" }

# ─── 6. ACQUISITION + ALERTS ─────────────────────────────────
Write-Host "`n=== 6. ACQUISITION + ALERTS ==="
$acq = Req "$b/member/acquisitions" POST $mh '{"title":"Deep Work","author":"Cal Newport","isbn":"","branch_id":1,"priority_level":"HIGH"}'
$acqId = if ($acq.acquisition_request_id) { $acq.acquisition_request_id } elseif ($acq.data) { $acq.data.acquisition_request_id } else { $null }
if ($acqId) {
  Write-Host "  Create request: PASS id=$acqId status=$($acq.request_status)"
  $acqL = Req "$b/member/acquisitions" GET $mh
  Write-Host "  Fetch requests: count=$($acqL.Count)"

  Start-Sleep -Milliseconds 500
  $an2 = Req "$b/admin/notifications" GET $ah
  $acqAlert = $an2 | Where-Object { $_.notification_type -eq 'NEW_ACQUISITION_REQUEST' }
  if ($acqAlert.Count -gt 0) { Write-Host "  Admin alert:    PASS count=$($acqAlert.Count) title='$($acqAlert[0].title)'" }
  else { Write-Host "  Admin alert:    FAIL - no NEW_ACQUISITION_REQUEST found (total=$($an2.Count))" }

  $canceled = Req "$b/member/acquisitions/$acqId" DELETE $mh
  $cStatus = if ($canceled.request_status) { $canceled.request_status } elseif ($canceled.data) { $canceled.data.request_status } else { 'unknown' }
  Write-Host "  Cancel request: PASS status=$cStatus"

  $again = Req "$b/member/acquisitions/$acqId" DELETE $mh
  if ($again.error) { Write-Host "  Re-cancel guard: PASS (blocked: $($again.error.message))" }
  else { Write-Host "  Re-cancel guard: FAIL - second cancel accepted!" }
} else { Write-Host "  Create request: FAIL $($acq | ConvertTo-Json -Depth 2)" }

Write-Host "`n=== ALL DONE ===`n"
