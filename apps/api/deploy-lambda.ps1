# Lambda Deployment - Build Leve

# Remove node_modules e .serverless anteriores
Write-Host "🧹 Limpando builds anteriores..."
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .serverless -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Instala apenas dependências de produção
Write-Host "📦 Instalando apenas dependências de produção..."
npm install --omit=dev

# Gera Prisma Client
Write-Host "🔧 Gerando Prisma Client..."
npx prisma generate

# Build
Write-Host "🏗️ Fazendo build..."
npx nest build

# Verifica tamanho
Write-Host "📊 Verificando tamanho do pacote..."
$size = (Get-ChildItem -Recurse node_modules | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Tamanho node_modules: $([math]::Round($size, 2)) MB"

# Deploy
Write-Host "🚀 Fazendo deploy..."
npx sls deploy --stage prod

# Reinstala dependências de dev para desenvolvimento local  
Write-Host "🔄 Reinstalando todas as dependências..."
npm install

Write-Host "✅ Concluído!"
