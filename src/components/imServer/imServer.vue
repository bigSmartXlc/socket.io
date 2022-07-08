<!-- im服务端入口 -->
<template>
    <div class="imServer-wrapper">
        <main class="imServer-main">
            <im-record :class="{record_show:recordShow}" class="item im-record" @selectedChat="selectedChat()" @toggleUserList = toggleUserList></im-record>
            <im-chat v-if="storeSelectedChatEn!=null" ref="im_chat" class="item im-chat" @toggleUserList = toggleUserList></im-chat>
        </main>
    </div>
</template>

<script >
import imRecord from './imRecord.vue';
import imChat from './imChat.vue';

export default {
    components: {
        imRecord: imRecord,
        imChat: imChat
    },
    data() {
        return {
            recordShow:false,
            socket: null
        };
    },
    computed: {
        storeSelectedChatEn() {
            return this.$store.imServerStore.getters.selectedChatEn;
        }
    },
    watch: {},
    methods: {
        //切换用户列表显示隐藏
        toggleUserList(){
            this.recordShow = !this.recordShow
        },
        /**
         * 选中了会话
         */
        selectedChat: function() {}
    },
    mounted() {
        this.$store.imServerStore.dispatch('SERVER_ON');
    },
    destroyed() {
        this.$store.imServerStore.dispatch('SERVER_OFF');
    }
};
</script>

<style lang="less">
@import '../../common/css/base.less';

.imServer-wrapper {
    #common-wrapper();
}
@media only screen and (max-width: 550px) {
    .im-record{
        position: fixed;
        width: 0 !important;
        z-index: 1000;
        background: #e6e6e6;
        overflow: hidden;
        left: 0;
        top: 0;
    }
    .record_show{
        width: 280px !important;
    }
    .im-chat {
            width: 100% !important;
        }
}
.imServer-wrapper {
    width: 100%;
    height: 100%;
    position: absolute;
    overflow: hidden;
    .imServer-main {
        height: 100%;
        max-width: 100%;
        position: relative;
        & > .item {
            float: left;
            border-right: 1px solid #e6e6e6;
            height: 100%;
        }
        & > .im-record {
            max-width: 280px;
        }
        & > .im-chat {
            width: calc(~'99% - 280px');
        }
    }
}
</style>
