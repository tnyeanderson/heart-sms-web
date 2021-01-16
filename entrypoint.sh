#!/bin/sh

CONFIGPATH="/usr/share/nginx/html/config"
CONFIGNAME="web-config.js"

if [ ! -f "$CONFIGPATH/$CONFIGNAME" ]; then
    echo "Copying default config files..."
    cp "/root/${CONFIGNAME}.example" "$CONFIGPATH/$CONFIGNAME"
fi

nginx -g "daemon off;"