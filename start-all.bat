@echo off
echo Starting Eventure-v4 landscape...
start cmd /k "cd gateway && pnpm dev"
start cmd /k "cd services\auth-service && pnpm dev"
pause
