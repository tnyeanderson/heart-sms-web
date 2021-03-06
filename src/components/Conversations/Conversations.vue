<template>
    <div id="conversation-list" class="page-content">
        <!-- Spinner On load -->
        <spinner v-if="conversations.length === 0 && loading" class="spinner" />

        <div v-if="showSearch" id="quick_find">
            <div>
                <input id="search-bar" v-model="searchQuery" class="quick_find fixed_pos" type="text text_box" placeholder="Search conversations..." autocomplete="off" autocorrect="off" spellcheck="false">
            </div>
        </div>

        <!-- If no Messages -->
        <p v-if="conversations.length === 0 && !loading" class="empty-message">
            {{ $t('conversations.noconv') }}
        </p>

        <!-- Conversation items -->
        <transition-group name="flip-list" tag="div">
            <component :is="conversation.title ? 'ConversationItem' : 'DayLabel'"
                       v-for="conversation in conversations"
                       :key="conversation.hash ? conversation.hash : conversation.label"
                       :conversation-data="conversation"
                       :show-pinned="conversation.pinned && !showConversationCategories"
                       :archive="isArchive"
                       :small="small"
                       :is-selected="selectedConversations.indexOf(conversation) !== -1"
                       :is-selecting="selectedConversations.length > 0"
            />
        </transition-group>

        <button v-if="!small" v-mdl tag="button" class="compose mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored" :style="composeStyle" @click="$router.push('/compose');">
            <i class="material-icons md-light">add</i>
        </button>
    </div>
</template>

<script>
import Vue from 'vue';
import Hash from 'object-hash';
import { Util, Api, i18n, SessionCache, TimeUtils } from '@/utils';
import ConversationItem from './ConversationItem.vue';
import DayLabel from './DayLabel.vue';
import Spinner from '@/components/Spinner.vue';
import unreadCountMixin from '@/mixins/unreadCountMixin.js';
import joypixels from 'emoji-toolkit';

export default {
    name: 'Conversations',
    components: {
        ConversationItem,
        DayLabel,
        Spinner
    },
    mixins: [unreadCountMixin],
    props: ['small', 'index', 'folderId', 'folderName'],

    data () {
        return {
            title: '',
            loading: true,
            conversations: [],
            unFilteredAllConversations: [],
            margin: 0,
            searchClicked: false,
            searchQuery: '',
            selectedConversations: []
        };
    },

    computed: {
        isArchive () {
            return this.index === 'index_archived';
        },

        composeStyle () {
            return 'background: ' + this.$store.state.colors_accent + ';';
        },

        showSearch () {
            return this.searchClicked && !this.small;
        },

        showConversationCategories () {
            return this.$store.state.theme_conversation_categories;
        }
    },

    watch: {
        '$route' (to, from) { // Update index on route change
            // Only update if list page
            if (to.name !== from.name && to.name.indexOf('conversations-list') >= 0) {
                this.conversations = [];
                this.unFilteredAllConversations = [];

                this.fetchConversations();
            }

            this.clearSelected();
        },

        '$store.state.theme_conversation_categories' () {
            this.processConversations(this.unFilteredAllConversations, true);
        },

        'searchQuery' (to) {
            to = to.toLowerCase();
            const filteredConversations = [];

            for (const i in this.unFilteredAllConversations) {
                const conversation = this.unFilteredAllConversations[i];

                if (typeof conversation === 'function') {
                    continue;
                }

                if (conversation.title.toLowerCase().indexOf(to) > -1 ||
                        conversation.snippet.toLowerCase().indexOf(to) > -1 ||
                        conversation.phone_numbers.indexOf(to) > -1) {
                    filteredConversations.push(conversation);
                }
            }

            this.processConversations(filteredConversations, false);
        }
    },

    mounted () {
        this.$store.state.msgbus.$on('newMessage', this.updateConversation);
        this.$store.state.msgbus.$on('conversationRead', this.updateRead);
        this.$store.state.msgbus.$on('conversationSnippetUpdated', this.updateSnippet);
        this.$store.state.msgbus.$on('removedConversation', this.fetchConversations);
        this.$store.state.msgbus.$on('refresh-btn', this.refresh);
        this.$store.state.msgbus.$on('search-btn', this.toggleSearch);
        this.$store.state.msgbus.$on('searchUpdated', this.searchUpdated);
        this.$store.state.msgbus.$on('newMargin', this.updateMargin);
        this.$store.state.msgbus.$on('selectConversation', this.conversationSelected);

        this.fetchConversations();

        if (!this.small) {
            // Construct colors object from saved global theme
            const colors = {
                default: this.$store.state.theme_global_default,
                dark: this.$store.state.theme_global_dark,
                accent: this.$store.state.theme_global_accent
            };

            // Commit them to current application colors
            this.$store.commit('colors', colors);

            this.$store.state.msgbus.$on('archive-selected-btn', this.archiveSelected);
            this.$store.state.msgbus.$on('unarchive-selected-btn', this.unarchiveSelected);
            this.$store.state.msgbus.$on('delete-selected-btn', this.deleteSelected);
            this.$store.state.msgbus.$on('select-all-btn', this.selectAll);
        }
    },

    beforeDestroy () {
        this.$store.state.msgbus.$off('newMessage', this.updateConversation);
        this.$store.state.msgbus.$off('conversationRead', this.updateRead);
        this.$store.state.msgbus.$off('conversationSnippetUpdated', this.updateSnippet);
        this.$store.state.msgbus.$off('removedConversation', this.fetchConversations);
        this.$store.state.msgbus.$off('refresh-btn', this.refresh);
        this.$store.state.msgbus.$off('search-btn', this.toggleSearch);
        this.$store.state.msgbus.$off('newMargin', this.updateMargin);
        this.$store.state.msgbus.$off('selectConversation', this.conversationSelected);

        if (!this.small) {
            this.$store.state.msgbus.$off('archive-selected-btn', this.archiveSelected);
            this.$store.state.msgbus.$off('unarchive-selected-btn', this.unarchiveSelected);
            this.$store.state.msgbus.$off('delete-selected-btn', this.deleteSelected);
            this.$store.state.msgbus.$off('select-all-btn', this.selectAll);
        }
    },

    methods: {

        fetchConversations () {
            if (this.index === 'index_private') {
                const lastPasscodeEntry = this.$store.state.last_passcode_entry;

                // no recent passcode entry
                if (lastPasscodeEntry === null || lastPasscodeEntry < (Date.now() - (15 * 1000))) {
                    this.$router.push('/passcode');
                    return;
                }
            }

            // Start query
            Api.conversations.getList(this.index, this.folderId)
                .then(response => this.processConversations(response));
        },

        processConversations (response, updateUnfiltered = true) {
            if (updateUnfiltered) {
                // used for searching
                this.unFilteredAllConversations = response;
            }

            const updatedConversations = [];

            const cache = [];
            const titles = [];

            for (const i in response) {
                const item = response[i];
                if (typeof item === 'function') {
                    continue;
                }

                const title = this.calculateTitle(item);

                if (titles.indexOf(title) === -1) {
                    titles.push(title);

                    if (this.showConversationCategories) {
                        updatedConversations.push({
                            label: title,
                            hash: Hash(title)
                        });
                    }
                }

                updatedConversations.push(item);

                // Save to contact cache
                cache.push(
                    Util.generateContact(
                        item.device_id,
                        item.title,
                        item.phone_numbers,
                        item.mute,
                        item.private_notifications,
                        item.color,
                        Util.expandColor(item.color_accent),
                        Util.expandColor(item.color_light),
                        Util.expandColor(item.color_dark)
                    )
                );
            }

            this.loading = false;
            this.$store.commit('conversations', cache);
            this.conversations = updatedConversations;

            // Set unread, only on unarchived public index
            if (!this.index || this.index === 'index_public_unarchived') {
                this.updateUnreadCount();
            }

            if (!this.small) {
                this.$store.commit('loading', false);
                this.$store.commit('title', this.index === 'folder' ? this.folderName : this.title);
            }
        },

        updateConversation (eventObj) {
            if (this.searchClicked) {
                this.processConversations(this.unFilteredAllConversations);
                this.searchClicked = false;
            }

            // Find conversation
            let { conv, convIndex } = this.getConversation(eventObj.conversation_id);

            if (!conv || !convIndex) {
                // if the conversation doesn't exist, we have a problem, or it is a new conversation.
                // invalidate the refresh the list from the API.
                // It is better to fix the actual problem and update the messages correctly though, without the refresh.
                SessionCache.invalidateAllConversations();
                this.fetchConversations();

                return false;
            }

            // Update unread, only on unarchived public index
            // This check is probably not totally necessary, but it prevents
            // unnecessarily calling updateUnreadCount
            if (conv.read !== eventObj.read && !eventObj.read &&
                (!this.index || this.index === 'index_public_unarchived')) {
                this.updateUnreadCount();
            }

            // Generate new snippet
            const newSnippet = joypixels.toImage(Util.generateSnippet(eventObj));

            conv.snippet = newSnippet;
            conv.read = eventObj.read;

            conv.hash = Hash(conv);

            if (conv.timestamp === eventObj.timestamp) {
                return;
            }

            // Get start index (index after pinned items)
            let startIndex = 0;
            if (this.showConversationCategories) {
                if (this.conversations[0].label === 'Pinned' && !conv.pinned) { // If there are any pinned items
                    this.conversations.some((conv, i) => {
                        if (typeof conv.label !== 'undefined' && // Loop until we find a label
                            conv.label !== 'Pinned') { // That is not "pinned"
                            startIndex = i; // Save index and return
                            return true;
                        }
                    });
                }
            } else {
                if (this.conversations[0].pinned && !conv.pinned) { // If there are any pinned items
                    this.conversations.some((conv, i) => {
                        if (!conv.pinned) { // That is not "pinned"
                            startIndex = i; // Save index and return
                            return true;
                        }
                    });
                }
            }

            // Move conversation if required
            const showCategoryOffset = (this.showConversationCategories ? 1 : 0);
            if (convIndex !== startIndex + showCategoryOffset) {
                conv = this.conversations.splice(convIndex, 1)[0];

                // If top label is not "Today"
                // This isn't elegant, but it works
                if (this.conversations[startIndex].label !== 'Today' &&
                    this.conversations[startIndex].label !== 'Pinned' &&
                    this.showConversationCategories) {
                    const title = 'Today'; // Define title
                    const label = { // And Define Label
                        label: title,
                        hash: Hash(title)
                    };

                    // Push label and conversation
                    this.conversations.splice(startIndex, 0, label, conv);
                } else {
                    // Else, just push the converstation to index 1 (below label)
                    this.conversations.splice(startIndex + showCategoryOffset, 0, conv);
                }
            }

            // eslint-disable-next-line no-self-assign
            this.conversations = this.conversations; // Why??
        },

        updateRead (id) {
            const { conv, convIndex } = this.getConversation(id);
            if (!conv || !convIndex) {
                return false;
            }

            // Update unread, only on unarchived public index
            if (!conv.read) {
                this.updateUnreadCount();
            }

            conv.read = true;
            conv.hash = Hash(conv);
        },

        updateSnippet (id, snippet) {
            const { conv, convIndex } = this.getConversation(id);
            if (!conv || !convIndex) {
                return false;
            }

            conv.snippet = joypixels.toImage(snippet);
            conv.hash = Hash(conv);
        },

        getConversation (id) {
            let convIndex = null;
            let conv = null;

            for (convIndex in this.conversations) {
                conv = this.conversations[convIndex];

                if (id === conv.device_id) {
                    return { conv, convIndex };
                }
            }

            return { conv: null, convIndex: -1 };
        },

        /**
         * refresh
         * Force refresh messages - fetches from server
         */
        refresh () {
            this.loading = true;
            SessionCache.invalidateAllConversations();
            this.fetchConversations();
        },

        updateMargin (margin) {
            this.margin = margin;
        },

        searchUpdated (query) {
            this.searchQuery = query;
        },

        toggleSearch () {
            this.searchClicked = !this.searchClicked;

            if (this.searchClicked) {
                Vue.nextTick(() => { // Wait item to render
                    // This acts odd - sometimes (especially on /archive) this
                    // will error with search-bar is null, even within Vue.nextTick
                    // To fix this, we add a simple check before executing focus
                    const searchBar = this.$el.querySelector('#search-bar');
                    searchBar && searchBar.focus();
                });
            } else {
                this.searchQuery = '';
            }
        },

        calculateTitle (conversation) {
            if (conversation.pinned) {
                return i18n.t('conversations.pinned');
            } else if (TimeUtils.isToday(conversation.timestamp)) {
                return i18n.t('conversations.today');
            } else if (TimeUtils.isYesterday(conversation.timestamp)) {
                return i18n.t('conversations.yesterday');
            } else if (TimeUtils.isLastWeek(conversation.timestamp)) {
                return i18n.t('conversations.thisweek');
            } else if (TimeUtils.isLastMonth(conversation.timestamp)) {
                return i18n.t('conversations.thismonth');
            } else {
                return i18n.t('conversations.older');
            }
        },

        conversationSelected (conversation) {
            const index = this.selectedConversations.indexOf(conversation);
            if (index === -1) {
                this.selectedConversations.push(conversation);
            } else {
                this.selectedConversations.splice(index, 1);
            }

            this.$store.state.msgbus.$emit('currentlySelectedConversations', this.selectedConversations);
        },

        archiveSelected () {
            for (const conversation of this.selectedConversations) {
                Api.conversations.archive(conversation.device_id, true);
            }

            this.clearSelected();
        },

        unarchiveSelected () {
            for (const conversation of this.selectedConversations) {
                Api.conversations.archive(conversation.device_id, false);
            }

            this.$router.push('/');
            this.clearSelected();
        },

        deleteSelected () {
            const options = {
                okText: this.$t('dialog.continue'),
                cancelText: this.$t('dialog.cancel'),
                animation: 'fade'
            };

            const apiUtils = Api;
            const selected = this.selectedConversations;
            this.$dialog.confirm(this.$t('conversations.deleteconfirm'), options)
                .then(() => {
                    for (const conversation of selected) {
                        apiUtils.conversations.delete(conversation.device_id);
                    }
                }).catch(() => { });

            this.clearSelected();
        },

        selectAll () {
            this.selectedConversations = [...this.conversations];
            this.$store.state.msgbus.$emit('currentlySelectedConversations', this.selectedConversations);
        },

        clearSelected () {
            this.selectedConversations = [];
            this.$store.state.msgbus.$emit('currentlySelectedConversations', this.selectedConversations);
        }
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
    @import "../../assets/scss/_vars.scss";

    .empty-message {
        color: rgba(0, 0, 0, 0.54);
        margin: 6em auto;
        width: 9.5em;
    }

    .compose {
        position: fixed;
        bottom: 0%;
        right: 0%;
        z-index: 3;
        margin: 24px;
    }

    #conversation-list {
        margin-left: 6px;
        margin-top: 36px !important;

        position: relative;
        z-index: 10;

        @media screen and (max-width: 600px) {
            margin: 0;
        }

        .spinner {
            margin-top: 100px;
        }
    }

    #quick_find {
        white-space: nowrap;
        padding-top: 5px;
        text-align: right;
    }

    .quick_find {
        width: 215px;
        margin-top: 3px;
        border: 0px solid white;
        border-radius: 2px;
        font-size: 15px;
        background-color: white;
        color: black;
        background-position: 10px 10px;
        background-repeat: no-repeat;
        padding: 12px 16px 12px 16px;
        -webkit-transition: width 0.4s ease-in-out;
        transition: width 0.4s ease-in-out;
        box-shadow: 0px 2px 2px rgba(0, 0, 0, .3);
    }

    .quick_find:focus {
        width: 400px;
        outline: none !important;
    }

    @media (max-width:450px) {
        .quick_find:focus {
            width: 250px;
        }
    }

    .flip-list-enter, .flip-list-leave-to {
        opacity: 0;
    }

    .flip-list-leave-active {
        position: absolute;
    }

    .flip-list-move {
        transition: transform $anim-time;
    }

    body.dark {
        .empty-message {
            color: rgba(255, 255, 255, 0.54);
        }

        .quick_find {
          border: 0px solid $bg-darker;
          background-color: $bg-darker;
          color: white;
        }
    }
</style>
