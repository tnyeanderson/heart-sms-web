import store from '@/store';

const api_base_url = process.env.VUE_APP_API_BASE_URL || "localhost:5000";
const ws_base_url = process.env.VUE_APP_WEBSOCKETS_BASE_URL || "localhost:5050";

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
        "remove_template":      "templates/remove/",
        "auto_replies":         "auto_replies",
        "remove_auto_reply":    "auto_replies/remove/",
    }

    static getBaseUrl () {
        return api_base_url + '/';
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

    static get (name) {
        let protocol = "http://";
        let baseurl = Url.getBaseUrl();
        if(name == "websocket") {
            protocol = "ws://";
            baseurl = ws_base_url;
        }

        return protocol + baseurl + Url.getApiVersion() + Url.urls[name];
    }
}
