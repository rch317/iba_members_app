#!/usr/bin/env bash
# =============================================================================
# IBA Membership App — EC2 bootstrap script
# Tested on: Amazon Linux 2023
#
# Usage (as ec2-user):
#   curl -fsSL https://raw.githubusercontent.com/rch317/iba_members_app/main/scripts/setup.sh | bash
#
# Or after cloning:
#   bash scripts/setup.sh
# =============================================================================
set -euo pipefail

REPO_URL="git@github.com:rch317/iba_members_app.git"
APP_DIR="/home/ec2-user/app"
NODE_VERSION="24"
APP_PORT="3001"

echo "================================================================"
echo " IBA Membership App — Server Setup"
echo "================================================================"

# --- System packages ---------------------------------------------------------
echo ""
echo ">> Installing system packages..."
sudo yum update -y -q
sudo yum install -y -q git

# nginx and certbot via amazon-linux-extras on AL2
sudo amazon-linux-extras enable nginx1 epel -y
sudo yum install -y -q nginx certbot python2-certbot-nginx

# --- Node.js via nvm ---------------------------------------------------------
echo ""
echo ">> Installing Node.js ${NODE_VERSION} via nvm..."
if [[ ! -d "$HOME/.nvm" ]]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"
# shellcheck source=/dev/null
source "$NVM_DIR/nvm.sh"
nvm install "$NODE_VERSION"
nvm alias default "$NODE_VERSION"
nvm use default

NODE_BIN=$(dirname "$(which node)")
echo "   Node $(node -v) at $NODE_BIN"

# --- PM2 ---------------------------------------------------------------------
echo ""
echo ">> Installing PM2..."
npm install -g pm2 --silent

# --- Clone / update repo -----------------------------------------------------
echo ""
if [[ -d "$APP_DIR/.git" ]]; then
  echo ">> Repo already exists — pulling latest..."
  git -C "$APP_DIR" pull
else
  echo ">> Cloning repo to $APP_DIR..."
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# --- .env setup --------------------------------------------------------------
echo ""
if [[ -f "$APP_DIR/.env" ]]; then
  echo ">> .env already exists — skipping."
else
  echo ">> Creating .env..."
  echo "   You'll be prompted for each value. Press Enter to leave blank for now."
  echo ""

  read -rp "   MONGO_URI: "              MONGO_URI
  read -rp "   GOOGLE_CLIENT_ID: "       GOOGLE_CLIENT_ID
  read -rp "   GOOGLE_CLIENT_SECRET: "   GOOGLE_CLIENT_SECRET
  read -rp "   GOOGLE_CALLBACK_URL: "    GOOGLE_CALLBACK_URL
  SESSION_SECRET=$(openssl rand -hex 32)
  echo "   SESSION_SECRET: (auto-generated)"

  cat > "$APP_DIR/.env" <<EOF
PORT=${APP_PORT}
MONGO_URI=${MONGO_URI}

GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL}

SESSION_SECRET=${SESSION_SECRET}
EOF

  chmod 600 "$APP_DIR/.env"
  echo "   .env written (mode 600)"
fi

# --- npm install -------------------------------------------------------------
echo ""
echo ">> Installing Node dependencies..."
npm ci --omit=dev

# --- PM2 start / restart -----------------------------------------------------
echo ""
if pm2 describe iba-membership &>/dev/null; then
  echo ">> Restarting app with PM2..."
  pm2 restart iba-membership
else
  echo ">> Starting app with PM2..."
  pm2 start src/server.js \
    --name iba-membership \
    --env production \
    --log /home/ec2-user/logs/app.log \
    --error /home/ec2-user/logs/error.log \
    --time
fi

# Save PM2 process list and configure startup
pm2 save
# Generate and install the startup hook (runs app on reboot)
sudo env PATH="$PATH:$NODE_BIN" pm2 startup systemd -u ec2-user --hp /home/ec2-user

# --- nginx reverse proxy -----------------------------------------------------
echo ""
echo ">> Configuring nginx..."
sudo tee /etc/nginx/conf.d/iba-membership.conf > /dev/null <<NGINX
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# --- Firewall ----------------------------------------------------------------
echo ""
echo ">> Opening ports 80 and 443 in firewalld (if active)..."
if systemctl is-active --quiet firewalld; then
  sudo firewall-cmd --permanent --add-service=http
  sudo firewall-cmd --permanent --add-service=https
  sudo firewall-cmd --reload
fi

# --- Health check ------------------------------------------------------------
echo ""
echo ">> Waiting for app to start..."
sleep 3
if curl -sf http://localhost:${APP_PORT}/health > /dev/null; then
  echo "   Health check passed!"
else
  echo "   WARNING: Health check failed. Check logs: pm2 logs iba-membership"
fi

# --- Done --------------------------------------------------------------------
echo ""
echo "================================================================"
echo " Setup complete!"
echo ""
echo " App:    http://$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo '<your-ec2-ip>')"
echo " Health: http://$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo '<your-ec2-ip>')/health"
echo ""
echo " Useful commands:"
echo "   pm2 logs iba-membership     # live logs"
echo "   pm2 status                  # process status"
echo "   pm2 restart iba-membership  # restart after code changes"
echo ""
echo " To add HTTPS (after setting a domain in DNS):"
echo "   sudo certbot --nginx -d your-domain.com"
echo "================================================================"
