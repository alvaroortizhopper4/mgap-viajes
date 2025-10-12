# Configuración de DNS para MGAP Gestión de Choferes

## Información de DNS
DNS Servers: a.share-dns.com, b.share-dns.net

## Registros DNS recomendados

### Registros principales
@ IN A [TU_IP_SERVIDOR]                    # Dominio raíz
www IN A [TU_IP_SERVIDOR]                  # www.tudominio.com

### Subdominios para la aplicación
api IN A [TU_IP_SERVIDOR]                  # api.tudominio.com (Backend)
app IN A [TU_IP_SERVIDOR]                  # app.tudominio.com (Frontend)
admin IN A [TU_IP_SERVIDOR]                # admin.tudominio.com (Panel admin)
viajes IN A [TU_IP_SERVIDOR]               # viajes.tudominio.com (App principal)

### Registros de correo (opcional)
mail IN A [TU_IP_SERVIDOR]
@ IN MX 10 mail.tudominio.com

## Configuración del servidor web (Nginx)

server {
    server_name tudominio.com www.tudominio.com;
    return 301 https://app.tudominio.com$request_uri;
}

server {
    listen 443 ssl;
    server_name app.tudominio.com viajes.tudominio.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    root /var/www/mgap-frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl;
    server_name api.tudominio.com;
    
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

## Variables de entorno para producción

# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mgap-viajes
JWT_SECRET=[GENERA_UN_SECRET_SEGURO]
FRONTEND_URL=https://app.tudominio.com

# Frontend
REACT_APP_API_URL=https://api.tudominio.com
REACT_APP_NODE_ENV=production