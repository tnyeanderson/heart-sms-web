<template>
    <div id="account-list" v-mdl class="page-content">
        <h4>Get Help</h4>
        <div class="item">
            <div class="mdl-color-text--grey-600">
                There is a very extensive FAQ section for the Pulse app on which Heart is based. Before opening an issue, do a quick search to free up time for both of us. You will probably find your answer, very easily.<br><br>If you don't find what you are looking for, feel free to reach out and I will be more than happy to get back to you as quickly as I am able.
            </div>
        </div>
        <div class="click-item" :href="urls.help" @click.stop.prevent="routeTo(urls.help)">
            <div class="mdl-color-text--grey-900">
                Help Page
            </div>
            <div class="mdl-color-text--grey-600">
                Search here, first!
            </div>
        </div>

        <h4>Information</h4>
        <div class="click-item mdl-color-text--grey-900" @click="routeTo('https://github.com/tnyeanderson/heart-sms-web/releases')">
            Web App Changelog
        </div>
        <div class="click-item mdl-color-text--grey-900" @click="routeTo('https://github.com/klinker-apps/pulse-sms-issues/issues/344')">
            Web Shortcut Keys
        </div>

        <h4>Contributions</h4>
        <div class="item">
            <div class="mdl-color-text--grey-900">
                © 2019 Luke and Jake Klinker (original creators of Pulse)
            </div>
        </div>
        <div class="click-item" @click="routeTo('https://github.com/tnyeanderson/heart-sms-web/')">
            <div class="mdl-color-text--grey-900">
                Heart's web app is open-source
            </div>
            <div class="mdl-color-text--grey-600">
                Thanks to everyone that has contributed their ideas and code!
            </div>
        </div>
        <div class="item">
            <div class="mdl-color-text--grey-900">
                Special Thanks
            </div>
            <div class="mdl-color-text--grey-600">
                Solomon Rubin for creating the base for this web app.
            </div>
        </div>
    </div>
</template>

<script>
import License from '@/components/License';

export default {
    name: 'HelpFeedback',
    components: {
        License
    },

    data () {
        return {
            title: 'Help and Feedback',
            loading: false,
            urls: {
                help: 'https://github.com/tnyeanderson/heart-sms-web/issues',
                overview: 'https://github.com/tnyeanderson/heart-sms-web'
            }
        };
    },

    mounted () {
        this.$store.commit('title', this.title);
    },

    methods: {
        routeTo (route) {
            window.open(route, '_blank');
        }
    }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
    @import "../assets/scss/_vars.scss";

    .item, .click-item {
        position: relative;
        width: 100%;
        padding: 12px;
        line-height: 18px;
    }

    .item:hover, .click-item:hover {
         background: #E0E0E0;
    }

    .click-item:hover {
        cursor: pointer;
    }

    body.dark {
        .item:hover, .click-item:hover {
            background: #202020;
        }
    }

</style>
