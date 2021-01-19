#!/bin/sh

CONFIGPATH="/usr/share/nginx/html/config"
CONFIGNAME="web-config.js"

# This will also be the default 
DEFAULT_API_URL='localhost:5000'
DEFAULT_WEBSOCKETS_URL='localhost:5050'
DEFAULT_MQTT_URL='localhost'
DEFAULT_USE_SSL='false'

function outputtofile() {
    # Create the config directory if needed
    mkdir -p "$CONFIGPATH"

    # This generates the current configuration as a JS file at <web>/config/web-config.js
    cat << EOF > "$CONFIGPATH/$CONFIGNAME"
var heartConfig = {
    "api": {
        "baseUrl": "$API_URL",
        "websocketsUrl": "$WEBSOCKETS_URL",
        "mqttUrl": "$MQTT_URL",
        "useSSL": $USE_SSL
    }
}
EOF

    rm "$CONFIGPATH/$CONFIGNAME.example"
}

# If a config file is present, use it
if [ ! -f "$CONFIGPATH/$CONFIGNAME" ]; then
    # A config file does not yet exist
    echo "Setting configuration"

    # If a HEART_* environment variable isn't set, use the default value
    API_URL="${HEART_API_URL:-$DEFAULT_API_URL}"
    WEBSOCKETS_URL="${HEART_WEBSOCKETS_URL:-$DEFAULT_WEBSOCKETS_URL}"
    MQTT_URL="${HEART_MQTT_URL:-$DEFAULT_MQTT_URL}"
    USE_SSL="${HEART_USE_SSL:-$DEFAULT_USE_SSL}"

    outputtofile
fi

nginx -g "daemon off;"