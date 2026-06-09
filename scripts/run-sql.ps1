param(
  [string]$File = "test.sql",
  [string]$Container = "library-db",
  [string]$Password = "Password@123456",
  [string]$Database = "LibraryDB"
)

if (-not (Test-Path $File)) {
  throw "SQL file not found: $File"
}

$target = "/tmp/" + [System.IO.Path]::GetFileName($File)
docker cp $File "${Container}:$target"
docker exec $Container /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $Password -d $Database -C -i $target

