import axios from 'axios';
import store from '@/store/';
import { Api, Util, Url, Crypto} from '@/utils/';

export default class Account {

    static login(username, password) {
        var hashedPassword = Crypto.getHash(password);

        const promise = new Promise((resolve, reject) => {
            const constructed_url = Url.get('login');
            const request = {
                username,
                password: hashedPassword
            };

            axios.post(constructed_url, request, { 'Content-Type': 'application/json' })
                .then((response) => resolve(response))
                .catch((error) => reject(error));

        });

        return promise;
    }

    static get() {
        const constructed_url = Url.get('account_stats') + Url.getAccountParam();
        const promise = new Promise((resolve, reject) => {
            axios.get(constructed_url)
                .then((response) => resolve(response))
                .catch((error) => reject(error));
        });

        return promise;
    }

    static settings = {
        get: () => {
            let constructed_url = Url.get('settings') + Url.getAccountParam();
            const promise = new Promise((resolve, reject) => {
                axios.get(constructed_url)
                    .then(response => {
                        response = response.data;

                        const colors = {
                            'default': Util.expandColor(response.color),
                            'dark': Util.expandColor(response.color_dark),
                            'accent': Util.expandColor(response.color_accent),
                        };

                        if (colors.default == 'rgba(255,255,255,1)' && colors.dark == 'rgba(255,255,255,1)' && colors.accent == 'rgba(255,255,255,1)') {
                            colors.default = store.theme_global_default;
                            colors.dark = store.theme_global_dark;
                            colors.accent = store.theme_global_default_accent;
                        }

                        store.commit('theme_base', response.base_theme);
                        store.commit('theme_use_global', response.use_global_theme);
                        store.commit('theme_apply_appbar_color', response.apply_primary_color_to_toolbar);
                        store.commit('theme_conversation_categories', response.conversation_categories);
                        store.commit('theme_message_timestamp', response.message_timestamp);
                        store.commit('subscription_type', response.subscription_type + '');
                        store.commit('theme_global', colors);
                        store.commit('colors', colors);

                        resolve(response);
                    }).catch(response => Api.rejectHandler(response, reject));
            });

            return promise;
        },
        update: (setting, type, value) => {
            let constructed_url = Url.get("update_setting") +
                "?pref=" + setting
                + "&type=" + type
                + "&value=" + value;

            new Promise((resolve, reject) => {
                axios.post(constructed_url, Url.getAccountPayload(),
                    { 'Content-Type': 'application/json' })
                    .then(() => resolve(true))
                    .catch(response => Api.rejectHandler(response, reject));
            });
        }
    }

}
