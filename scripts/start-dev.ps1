Copy-Item .env.example .env -ErrorAction SilentlyContinue
Copy-Item backend/.env.example backend/.env -ErrorAction SilentlyContinue
Copy-Item frontend/.env.example frontend/.env -ErrorAction SilentlyContinue
docker compose up -d
npm install
npm run install:all
Write-Host "Run your existing schema against LibraryDB, then run: npm run seed"
Write-Host "Start the app with: npm run dev"
