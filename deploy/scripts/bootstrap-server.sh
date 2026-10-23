#!/usr/bin/env bash
# ==============================================================================
# DollShop - Автоматизированная подготовка боевого сервера VPS в Беларуси (Step 7.6)
# Поддерживает: Ubuntu 22.04 LTS / 24.04 LTS на hoster.by / hb.by
# Настраивает: часовой пояс Минска, SWAP 2ГБ, Docker CE, UFW, Fail2ban, deploy user
# ==============================================================================

set -euo pipefail

# Проверка запуска от root
if [ "$(id -u)" -ne 0 ]; then
  echo "❌ Ошибка: скрипт должен быть запущен с правами суперпользователя (sudo)." >&2
  exit 1
fi

echo "========================================================================"
echo "🚀 Начало инициализации сервера DollShop (Республика Беларусь)"
echo "========================================================================"

# 1. Часовой пояс Минска
echo "🕒 Настройка часового пояса Europe/Minsk..."
timedatectl set-timezone Europe/Minsk
systemctl restart systemd-timesyncd 2>/dev/null || true

# 2. Создание SWAP файла 2 ГБ (для стабильности при 2-4 ГБ RAM)
if [ "$(swapon --show | wc -l)" -le 1 ]; then
  echo "💾 Настройка файла подкачки (SWAP 2GB)..."
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
  fi
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' > /etc/sysctl.d/99-dollshop.conf
  echo 'fs.file-max=2097152' >> /etc/sysctl.d/99-dollshop.conf
  echo 'net.core.somaxconn=1024' >> /etc/sysctl.d/99-dollshop.conf
  sysctl -p /etc/sysctl.d/99-dollshop.conf
  echo "✅ SWAP 2GB успешно подключен."
else
  echo "ℹ️ SWAP уже настроен."
fi

# 3. Обновление пакетов ОС
echo "📦 Обновление системных пакетов Ubuntu..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -y -q
apt-get install -y -q \
  ca-certificates \
  curl \
  gnupg \
  lsb-release \
  git \
  ufw \
  fail2ban \
  htop \
  jq \
  logrotate \
  openssl \
  tar \
  gzip

# 4. Установка официального Docker CE и Docker Compose
if ! command -v docker >/dev/null 2>&1; then
  echo "🐳 Установка официального Docker Community Edition..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
  chmod a+r /etc/apt/keyrings/docker.gpg

  UBUNTU_CODENAME="$(lsb_release -cs)"
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    ${UBUNTU_CODENAME} stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -q
  apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
  echo "✅ Docker CE успешно установлен."
else
  echo "ℹ️ Docker уже установлен."
fi

# Настройка ротации логов контейнеров Docker (чтобы не забивать диск)
mkdir -p /etc/docker
cat <<'EOF' > /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl reload docker 2>/dev/null || systemctl restart docker

# 5. Создание системного пользователя deploy для CI/CD и релизов
DEPLOY_USER="deploy"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  echo "👤 Создание пользователя '${DEPLOY_USER}'..."
  useradd -m -s /bin/bash -G sudo,docker "$DEPLOY_USER"
  # Настройка бескомпромиссного sudo без пароля для деплоя
  echo "${DEPLOY_USER} ALL=(ALL) NOPASSWD:ALL" > "/etc/sudoers.d/${DEPLOY_USER}"
  chmod 0440 "/etc/sudoers.d/${DEPLOY_USER}"
  echo "✅ Пользователь '${DEPLOY_USER}' создан и добавлен в группы sudo, docker."
else
  usermod -aG docker "$DEPLOY_USER"
fi

# 6. Настройка брандмауэра UFW (строго по правилам безопасности РБ)
echo "🛡️ Настройка файрвола UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH || ufw allow 22/tcp
ufw allow 80/tcp comment 'HTTP Let’s Encrypt'
ufw allow 443/tcp comment 'HTTPS Production'
# Порт 5432 СУБД оставляем закрытым для внешнего мира!
ufw --force enable
echo "✅ UFW активирован: разрешены порты 22, 80, 443. Порт 5432 закрыт."

# 7. Настройка Fail2ban для защиты SSH
echo "🔒 Настройка fail2ban..."
cat <<'EOF' > /etc/fail2ban/jail.local
[DEFAULT]
bantime  = 86400
findtime = 600
maxretry = 4

[sshd]
enabled = true
port    = ssh
backend = systemd
EOF
systemctl enable fail2ban
systemctl restart fail2ban

# 8. Создание каталогов проекта
echo "📁 Создание каталогов проекта в /opt/dollshop..."
mkdir -p /opt/dollshop/{backups,media,nginx/ssl}
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" /opt/dollshop

echo "========================================================================"
echo "🎉 Сервер успешно подготовлен к деплою DollShop!"
echo "   - Пользователь для деплоя: ${DEPLOY_USER}"
echo "   - Корневой каталог проекта: /opt/dollshop"
echo "   - Каталог резервных копий:  /opt/dollshop/backups"
echo "   - Часовой пояс:             Europe/Minsk"
echo "   - Брандмауэр UFW:           80, 443, 22 разрешены"
echo "========================================================================"
