#!/bin/sh

CONFIGPATH="/usr/share/nginx/html/config"
CONFIGNAME="web-config.json"

if [ ! -f "$CONFIGPATH/$CONFIGNAME" ]; then
    echo "Copying default config files..."
    cp /root/web-config.json.example "$CONFIGPATH/$CONFIGNAME"
fi

nginx -g "daemon off;"