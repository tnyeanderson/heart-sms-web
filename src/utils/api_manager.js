import store from '@/store/';
import axios from 'axios';
import https from 'https';

import {
    Account,
    AutoReply,
    Blacklist,
    Contacts,
    Conversations,
    Devices,
    Drafts,
    Folders,
    Messages,
    ScheduledMessages,
    Stream,
    Templates
} from '@/utils/api/';

export default class Api {

    static agent = axios.create({
        httpsAgent: new https.Agent({  
            rejectUnauthorized: (process.env.NODE_ENV === 'development')
        })
    });

    static Stream = Stream

    static account = Account
    static autoReplies = AutoReply
    static blacklist = Blacklist
    static contacts = Contacts
    static conversations = Conversations
    static devices = Devices
    static drafts = Drafts
    static folders = Folders
    static messages = Messages
    static scheduledMessages = ScheduledMessages
    static templates = Templates

    static generateId () {
        const min = 1;
        const max = 922337203685477;

        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static rejectHandler (e, callback = null) {
        if (e.response && e.response.status === 401) {
            return store.state.msgbus.$emit('logout-btn');
        }

        if (callback) {
            return callback(e);
        }
    }

    static get(url) {
        return Api.agent.get(url);
    }

    static post(url, body) {
        return Api.agent.post(url, body, { 'Content-Type': 'application/json' });
    }
}
