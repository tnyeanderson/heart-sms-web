import mqtt from 'mqtt';
import joypixels from 'emoji-toolkit';
import router from '@/router/';
import store from '@/store/';
import { Api, Util, Url, Crypto, Notifications, SessionCache, Platform, i18n } from '@/utils';

export default class Stream {
    constructor() {
        this.socket = null;
        this.open();
    }

    static topicPrefix = 'heartsms/';

    /**
     * Open reconnecting mqtt websocket.
     */
    open() {
        // Generate a client id for graceful reconnection if we don't have one
        if (!store.state.client_id)
            store.commit('client_id', Math.floor(Math.random() * 10000));

        this.socket = mqtt.connect(Url.get('websocket'), {
            clientId: store.state.client_id
        });

        this.socket.on('connect', this.onConnect);
        this.socket.on('message', this.handleMessage);
        this.socket.on('offline', this.onConnectionLost);
    }

    close() {
        if (this.socket) {
            this.socket.end();
        }
    }

    onConnect() {
        // Close connection on logout
        store.state.msgbus.$on('logout-btn', () => this.end());

        console.log();

        this.subscribe(Stream.topicPrefix + store.state.account_id);
    }

    onConnectionLost() {
        Util.snackbar(i18n.t('api.disconnected'));
        store.state.msgbus.$emit('refresh-btn');
        Util.snackbar(i18n.t('api.back'));
    }


    /**
     * Handle incoming socket data
     * @param message - Paho Message
     */
    handleMessage(topic, message) {
        // message is a buffer
        var msg = JSON.parse(message.toString());
        console.log(msg);

        // Store last ping to maintain data connection
        store.commit('last_ping', Date.now() / 1000 >> 0);

        // Ignore bad messages
        if (typeof msg == "undefined")
            return;

        const operation = msg.operation;

        // Parse any emojis
        if (typeof msg.content.data != "undefined")
            msg.content.data = joypixels.toImage(
                msg.content.data
            );


        if (operation == "added_message") {
            let message = msg.content;
            message.message_from = message.from;
            message = Crypto.decryptMessage(message);

            this.notify(message);

            SessionCache.cacheMessage(message);
            SessionCache.updateConversation(message);

            store.state.msgbus.$emit('newMessage', message);
        } else if (operation == "removed_message") {
            let message = msg.content;

            SessionCache.deleteMessage(message.id);

            store.state.msgbus.$emit('deletedMessage', message.id);
        } else if (operation == "read_conversation") {
            const id = msg.content.id;

            SessionCache.readConversation(id, 'index_public_unarchived');
            SessionCache.readConversation(id, 'index_archived');

            store.state.msgbus.$emit('conversationRead', id);
        } else if (operation == "updated_conversation") {
            const conversation = Crypto.decryptConversation(msg.content);
            conversation.conversation_id = conversation.id; // Normalize ID

            if (conversation.snippet) {
                SessionCache.updateConversationSnippet(conversation.id, conversation.snippet, 'index_public_unarchived');
                SessionCache.updateConversationSnippet(conversation.id, conversation.snippet, 'index_archived');
                SessionCache.updateConversationSnippet(conversation.id, conversation.snippet, 'index_private');
            }

            SessionCache.readConversation(conversation.id, 'index_public_unarchived', conversation.read);
            SessionCache.readConversation(conversation.id, 'index_archived', conversation.read);

            store.state.msgbus.$emit('newMessage', conversation);
        } else if (operation == "update_message_type") {
            const id = msg.content.id;
            const message_type = msg.content.message_type;

            SessionCache.updateMessageType(id, message_type);
            store.state.msgbus.$emit('updateMessageType-' + id, { message_type });
        } else if (operation == "added_conversation") {
            const id = msg.content.id;

            SessionCache.invalidateConversations('index_public_unarchived');
            store.state.msgbus.$emit('addedConversation', { id });
        } else if (operation == "removed_conversation") {
            const id = msg.content.id;

            SessionCache.removeConversation(id, 'index_public_unarchived');
            SessionCache.removeConversation(id, 'index_archived');
            SessionCache.removeConversation(id, 'index_private');
            store.state.msgbus.$emit('removedConversation', { id });
        } else if (operation == "archive_conversation") {
            const id = msg.content.id;

            if (msg.content.archive) {
                SessionCache.removeConversation(id, 'index_public_unarchived');
                SessionCache.invalidateConversations('index_archived');
            } else {
                SessionCache.removeConversation(id, 'index_archived');
                SessionCache.invalidateConversations('index_public_unarchived');
            }

            store.state.msgbus.$emit('removedConversation', { id });
        }
    }

    /**
     * Submit notification for message
     * @param message  - message object
     */
    notify(message) {
        if (Notifications.needsPermission() && !store.state.notifications)
            return;

        if (message.type != 0)
            return;

        if (!Platform.isWebsite()) {
            return;
        }

        // fetch through the API instead of the session cache, since the session
        // cache doesn't know about the mute/private settings
        Api.conversations.getById(message.conversation_id).then(conversation => {
            if (conversation == null || conversation.mute) {
                return;
            }

            const title = conversation.title;
            const snippet = conversation.private_notifications ? "" : Util.generateSnippet(message);

            const link = "/thread/" + message.conversation_id;

            const notification = Notifications.notify(title, {
                icon: require('@/../public/images/android-desktop.png'),
                body: snippet
            });

            notification.onclick = () => {
                window.focus();
                router.push(link).catch(() => {});
            };
        });
    }
}
