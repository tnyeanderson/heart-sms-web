import store from '@/store';

export default class Url {
    static urls = {
        "login":                "accounts/login/",
        "update_setting":       "accounts/update_setting",
        "messages":             "messages/",
        "remove_message":       "messages/remove/",
        "add_message":          "messages/add/",
        "new_thread":           "messages/forward_to_phone",
        "folders":              "folders/",
        "remove_folder":        "folders/remove/",
        "conversations":        "conversations/",
        "conversation":         "conversations/",
        "update_conversation":  "conversations/update/",
        "read":                 "conversations/read/",
        "archive":              "conversations/archive/",
        "unarchive":            "conversations/unarchive/",
        "delete":               "conversations/remove/",
        "dismiss":              "accounts/dismissed_notification/",
        "settings":             "accounts/settings/",
        "websocket":            "stream",
        "media":                "media/",
        "add_media":            "media/add",
        "contacts":             "contacts/simple/",
        "remove_contact":       "contacts/remove_ids/",
        "blacklists":           "blacklists",
        "remove_blacklist":     "blacklists/remove/",
        "create_blacklist":     "blacklists/add/",
        "scheduled":            "scheduled_messages",
        "remove_scheduled":     "scheduled_messages/remove/",
        "create_scheduled":     "scheduled_messages/add/",
        "account_stats":        "accounts/count",
        "drafts":               "drafts",
        "drafts_conversation":  "drafts/",
        "create_drafts":        "drafts/add/",
        "remove_drafts":        "drafts/remove/",
        "replace_drafts":       "drafts/replace/",
        "devices":              "devices",
        "remove_device":        "devices/remove/",
        "templates":            "templates",
        "create_template":      "templates/add/",
        "update_template":      "templates/update/",
        "remove_template":      "templates/remove/",
        "auto_replies":         "auto_replies",
        "remove_auto_reply":    "auto_replies/remove/",
    }

    static getBaseUrl (isWebsocket) {
        if (isWebsocket) {
            return this.getProtocol(isWebsocket) + store.state.config.api.websocketsUrl + '/';
        }

        return this.getProtocol() + store.state.config.api.baseUrl + '/';
    }

    static getApiVersion () {
        return "api/v1/";
    }

    static getAccountParam () {
        return "?account_id=" + store.state.account_id;
    }

    static getAccountPayload () {
        return {
            account_id: store.state.account_id
        };
    }

    static getProtocol (isWebsocket) {
        if (isWebsocket) {
            return (store.state.config.api.useSSL) ? "wss://" : "ws://";
        } else {
            return (store.state.config.api.useSSL) ? "https://" : "http://";
        }
    }

    static get (name) {
        var isWebsocket = (name == "websocket");

        // If SSL is not on in production, just fail 
        if (process.env.NODE_ENV === 'production' && !store.state.config.api.useSSL) {
            console.log("SSL is required in production when calling the API. No calls will be made");
            return false;
        }

        return Url.getBaseUrl(isWebsocket) + Url.getApiVersion() + Url.urls[name];
    }
}
