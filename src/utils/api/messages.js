import Vue from 'vue';
import store from '@/store/';
import joypixels from 'emoji-toolkit';
//import firebase from 'firebase/app';
//import 'firebase/storage';
import ImageCompressor from '@xkeshi/image-compressor';
import { Api, Util, Url, Crypto, SessionCache, Platform } from '@/utils/';

export default class Messages {

    static get(conversation_id, offset = 0) {
        const limit = 70;
        const constructed_url =
            Url.get('messages') + Url.getAccountParam()
            + "&conversation_id=" + conversation_id + "&limit=" + limit
            + "&web=true&offset=" + offset;

        const promise = new Promise((resolve, reject) => {
            if (!SessionCache.hasMessages(conversation_id) || offset > 0) {
                Api.get(constructed_url)
                    .then(response => {
                        response = response.data;

                        // Decrypt Conversations items
                        for (let i = 0; i < response.length; i++) {
                            const message = Crypto.decryptMessage(response[i]);
                            if (message != null)
                                response[i] = message;
                        }

                        if (offset == 0) {
                            SessionCache.putMessages(response, conversation_id);
                        }

                        resolve(response);
                    })
                    .catch(response => Api.rejectHandler(response, reject));
            } else {
                resolve(SessionCache.getMessages(conversation_id));
            }
        });

        return promise;
    }

    static delete(id) {
        let constructed_url = Url.get('remove_message') + id + Url.getAccountParam();
        Api.post(constructed_url);
    }

    static send(data, mime_type, thread_id, message_id = null) {
        let account_id = store.state.account_id;

        let id = message_id || Api.generateId();

        let snippet = mime_type == "text/plain" ? ("You: " + data) : "<i>Picture Message</i>";

        let encrypted = Crypto.encrypt(data);
        let snippetEncrypted = Crypto.encrypt(snippet);

        let timestamp = new Date().getTime();

        // Define request
        let request = {
            account_id: account_id,
            messages: [
                {
                    device_id: id,
                    device_conversation_id: thread_id,
                    message_type: 2,
                    data: encrypted,
                    timestamp: timestamp,
                    mime_type: Crypto.encrypt(mime_type),
                    read: true,
                    seen: true,
                    sent_device: Platform.getPlatformIdentifier()
                }
            ]
        };

        let conversationRequest = {
            account_id: account_id,
            read: true,
            timestamp: timestamp,
            snippet: snippetEncrypted
        };

        // Update on servers
        let constructed_url = Url.get('add_message');
        Api.post(constructed_url, request, { 'Content-Type': 'application/json' })
            .catch(response => console.log(response));

        constructed_url = Url.get('update_conversation') + thread_id;
        Api.post(constructed_url, conversationRequest, { 'Content-Type': 'application/json' })
            .catch(response => console.log(response));

        // Submit event
        let event_object = {
            device_id: id,
            conversation_id: thread_id,
            timestamp: timestamp,
            mime_type: mime_type,
            message_type: 2,
            data: joypixels.toImage(Util.entityEncode(data)),
            read: true,
            snippet: snippet
        };

        store.state.msgbus.$emit('newMessage', event_object);
    }

    static media = {
        get: (image_id) => {
            const constructed_url = Url.get('media') + image_id + Url.getAccountParam();
            const promise = new Promise((resolve, reject) => {
                Api.get(constructed_url)
                    .then(response => resolve(response))
                    .catch(response => Api.rejectHandler(response, reject));
            });

            return promise;
        },
        compress: (file, compress = null) => {
            if (!file.type.startsWith("image/"))
                return Util.snackbar("File type not supported");

            if (compress < 0.05 && compress != null)
                return Util.snackbar("Image too large");

            if (compress == null)
                compress = 0.6;

            // Disallow large non-image files
            if ((file.type.startsWith("image/") || !file.type === "image/gif")
                && file.size > 1024 * 1024) {
                return new ImageCompressor(file, {
                    quality: compress,
                    maxWidth: 1500,
                    maxHeight: 1500,
                    success: (result) => Api.messages.media.compress(result, compress * 0.7),
                    error: () => null
                });
            }

            store.commit('loaded_media', file);
            Vue.nextTick(() => Util.scrollToBottom(250)); // TODO this is a side effect - should be in thread, not api
        },
        send: (file, send) => {
            store.commit('media_sending', true);

            const reader = new FileReader();
            reader.onload = (e) => {
                let encryptedFile = Crypto.encryptData(new Uint8Array(e.target.result));
                encryptedFile = new TextEncoder('utf-8').encode(encryptedFile);

                const id = Api.generateId();

                var constructed_url = Url.get('add_media') + Url.getAccountParam();
                var request = {
                    message_id: id,
                    data: encryptedFile
                };

                // Add to db
                new Promise((resolve) => {
                    Api.post(constructed_url, request, { 'Content-Type': 'application/json' })
                        .then(response => {
                            // Send message
                            send(file, id);

                            // Make url
                            // TODO: What is the point of this??
                            const constructed_url = Url.get('media') + id + Url.getAccountParam();
                            Api.get(constructed_url);

                            // Empty loaded media
                            store.commit('loaded_media', null);
                            store.commit('media_sending', false);

                            resolve(response);
                        });
                });
            };

            reader.readAsArrayBuffer(file);
        }
    }

}
