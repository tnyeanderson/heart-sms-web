import Vue from 'vue';
import VueRouter from 'vue-router';

import store from '@/store/';

import Login from '@/components/Login.vue';
import Settings from '@/components/Settings.vue';
import Experiments from '@/components/Experiments.vue';
import ConversationSettings from '@/components/Thread/Settings.vue';
import Passcode from '@/components/Passcode.vue';
import HelpFeedback from '@/components/HelpFeedback.vue';
import License from '@/components/License.vue';
import Thread from '@/components/Thread/';
import Compose from '@/components/Compose/';
import Conversations from '@/components/Conversations/';
import Folders from '@/components/Folders/';
import { Blacklists, CreateBlacklist } from '@/components/Blacklists/';
import { ScheduledMessages, CreateScheduledMessage, EditScheduledMessage } from '@/components/ScheduledMessages/';
import { Account, Drafts, Devices, Contacts, Templates, CreateTemplate, EditTemplate, AutoReplies, AccountFolders } from '@/components/Account/';

Vue.use(VueRouter);

const router = new VueRouter({
    mode: 'history',
    routes: [
        {
            path: '/',
            name: 'conversations-list',
            component: Conversations,
            props: { index: 'index_public_unarchived', small: false }
        },
        {
            path: '/archived',
            name: 'conversations-list-archived',
            component: Conversations,
            props: { index: 'index_archived', small: false }
        },
        {
            path: '/unread',
            name: 'conversations-list-unread',
            component: Conversations,
            props: { index: 'index_public_unread', small: false }
        },
        {
            path: '/private',
            name: 'conversations-list-private',
            component: Conversations,
            props: { index: 'index_private', small: false }
        },
        {
            path: '/folder/:folderId',
            name: 'conversations-list-folder',
            component: Conversations,
            props: true
        },
        {
            path: '/thread/:threadId',
            name: 'thread',
            component: Thread,
            props: true
        },
        {
            path: '/thread/:threadId/archived',
            name: 'thread-archived',
            component: Thread,
            props: true
        },
        {
            path: '/compose',
            name: 'Compose',
            component: Compose
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/settings',
            name: 'settings',
            component: Settings
        },
        {
            path: '/experiments',
            name: 'experiments',
            component: Experiments
        },
        {
            path: '/thread/:conversationId/settings',
            name: 'conversation-settings',
            component: ConversationSettings,
            props: true
        },
        {
            path: '/folders',
            name: 'folders',
            component: Folders
        },
        {
            path: '/blacklists',
            name: 'blacklists',
            component: Blacklists
        },
        {
            path: '/blacklists/new',
            name: 'create-blacklist',
            component: CreateBlacklist
        },
        {
            path: '/passcode',
            name: 'passcode',
            component: Passcode
        },
        {
            path: '/scheduled',
            name: 'scheduled-messages',
            component: ScheduledMessages
        },
        {
            path: '/scheduled/new',
            name: 'create-scheduled-message',
            component: CreateScheduledMessage
        },
        {
            path: '/scheduled/edit/:messageId',
            name: 'edit-scheduled-message',
            component: EditScheduledMessage,
            props: true
        },
        {
            path: '/help_feedback',
            name: 'help-feedback',
            component: HelpFeedback
        },
        {
            path: '/license',
            name: 'license',
            component: License
        },
        {
            path: '/account',
            name: 'account',
            component: Account
        },
        {
            path: '/account/devices',
            name: 'devices',
            component: Devices
        },
        {
            path: '/account/drafts',
            name: 'drafts',
            component: Drafts
        },
        {
            path: '/account/contacts',
            name: 'contacts',
            component: Contacts
        },
        {
            path: '/account/templates',
            name: 'templates',
            component: Templates
        },
        {
            path: '/account/templates/new',
            name: 'create-template',
            component: CreateTemplate
        },
        {
            path: '/account/templates/edit/:templateId',
            name: 'edit-template', 
            component: EditTemplate,
            props: true
        },
        {
            path: '/account/autoreply',
            name: 'auto-replies',
            component: AutoReplies
        },
        {
            path: '/account/folders',
            name: 'account-folders',
            component: AccountFolders
        }
    ]
});

router.beforeEach((to, from, next) => {
    if (!to.name) {
        return next('/').catch(() => {});
    } else if (to.name === 'login') {
        return next();
    } else if (store.state.account_id === '') {
        return next({ name: 'login' });
    } else {
        next();
    }
});

// This script is a work around for github pages deployments.
// If a redirect session is created, delete and redirect
var redirect = sessionStorage.redirect;
delete sessionStorage.redirect;

if (redirect && redirect !== location.href) {
    router.replace(redirect.split(location.host)[1]);
}

export default router;
