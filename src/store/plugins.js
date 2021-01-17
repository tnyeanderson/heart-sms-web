
import { KEYS } from '@/store/state.js';

// called when the store is initialize
const localStoreSync = store => {
    const local_items = {
        'config': KEYS.CONFIG,
        'compose_contacts': KEYS.COMPOSE_CONTACTS,
        'contacts': KEYS.CONTACTS,
        'conversations': KEYS.CONVERSATIONS,
        'clearContacts': KEYS.CONTACTS,
        'username': KEYS.USERNAME,
        'account_id': KEYS.ACCOUNT_ID,
        'hash': KEYS.HASH,
        'salt': KEYS.SALT,
        'theme_base': KEYS.THEME.BASE,
        'theme_global_default': KEYS.THEME.GLOBAL_DEFAULT,
        'theme_global_dark': KEYS.THEME.GLOBAL_DARK,
        'theme_global_accent': KEYS.THEME.GLOBAL_ACCENT,
        'theme_use_global': KEYS.THEME.USE_GLOBAL,
        'theme_conversation_categories': KEYS.THEME.CONVERSATION_CATEGORIES,
        'theme_message_timestamp': KEYS.THEME.MESSAGE_TIMESTAMP,
        'theme_apply_appbar_color': KEYS.THEME.APPLY_APPBAR_COLOR,
        'notifications': KEYS.NOTIFICATIONS,
        'enter_to_send': KEYS.ENTER_TO_SEND,
        'archive_after_send': KEYS.ARCHIVE_AFTER_SEND,
        'larger_app_bar': KEYS.LARGER_APP_BAR,
        'unread_count_in_sidebar': KEYS.UNREAD_COUNT_IN_SIDEBAR,
        'subscription_type': KEYS.SUBSCRIPTION_TYPE,
    };

    // called after every mutation.
    store.subscribe((mutation, state) => {
        // Only save if in local_items array
        if (!Object.keys(local_items).contains(mutation.type))
            return;

        let key = local_items[mutation.type];
        let value = JSON.stringify(state[mutation.type]);

        window.localStorage.setItem(key, value);
    });
};


export default [ localStoreSync ];
