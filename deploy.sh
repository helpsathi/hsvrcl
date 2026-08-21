cd ~/hsvrcl
git pull origin aws
rm -rf node_modules apps/*/node_modules package-lock.json
npm install
NODE_OPTIONS="--max-old-space-size=2048" npm run build
pm2 restart all
sudo dnf install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
sudo bash -c 'cat > /etc/nginx/conf.d/helpsathi.conf << "EOF"
server {
    listen 80;
    server_name _;
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF'
sudo systemctl restart nginx
