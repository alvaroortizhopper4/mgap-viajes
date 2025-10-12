#!/bin/bash

# Script de despliegue para MGAP Gestión de Choferes
# Uso: ./deploy.sh [production|staging]

ENV=${1:-production}
DOMAIN="tudominio.com"  # Cambiar por tu dominio real

echo "🚀 Iniciando despliegue para entorno: $ENV"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecutar desde el directorio raíz del proyecto"
    exit 1
fi

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm ci --production

# Compilar frontend
echo "🏗️ Compilando frontend..."
cd ../frontend
npm ci
npm run build

# Crear estructura de directorios
echo "📁 Creando estructura de directorios..."
sudo mkdir -p /var/www/mgap-frontend
sudo mkdir -p /var/www/mgap-backend
sudo mkdir -p /var/log/mgap

# Copiar archivos compilados
echo "📋 Copiando archivos..."
sudo cp -r dist/* /var/www/mgap-frontend/
sudo cp -r ../backend/* /var/www/mgap-backend/

# Configurar permisos
sudo chown -R www-data:www-data /var/www/mgap-frontend
sudo chown -R node:node /var/www/mgap-backend
sudo chmod -R 755 /var/www/mgap-frontend
sudo chmod -R 755 /var/www/mgap-backend

# Configurar variables de entorno
echo "⚙️ Configurando variables de entorno..."
sudo cp ../backend/.env.$ENV /var/www/mgap-backend/.env

# Reiniciar servicios
echo "🔄 Reiniciando servicios..."
sudo systemctl restart nginx
sudo systemctl restart mgap-backend  # Si tienes un servicio systemd

# Verificar SSL
echo "🔒 Verificando certificados SSL..."
if [ "$ENV" = "production" ]; then
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d app.$DOMAIN -d api.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

echo "✅ Despliegue completado para $ENV"
echo "🌐 Aplicación disponible en:"
echo "   - Frontend: https://app.$DOMAIN"
echo "   - API: https://api.$DOMAIN"
echo "   - Admin: https://admin.$DOMAIN"

# Verificar estado de los servicios
echo "📊 Estado de servicios:"
sudo systemctl status nginx --no-pager -l
sudo systemctl status mgap-backend --no-pager -l

echo "📝 Logs disponibles en:"
echo "   - Nginx: /var/log/nginx/"
echo "   - MGAP: /var/log/mgap/"
echo "   - PM2: pm2 logs (si usas PM2)"