<!-- im服务端入口 -->
<template>
    <div class="imServer-wrapper">
        <main class="imServer-main">
            <im-record :class="{record_show:recordShow}" class="item im-record" @selectedChat="selectedChat()" @toggleUserList = toggleUserList></im-record>
            <im-chat ref="im_chat" class="item im-chat" @toggleUserList = toggleUserList></im-chat>
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
            socket: null,
            serve_socket:null,
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
        selectedChat: function() {},
            getUrlParams(url) {
            // 通过 ? 分割获取后面的参数字符串
            let urlStr = url.split('?')[1]
            // 创建空对象存储参数
            let obj = {};
            // 再通过 & 将每一个参数单独分割出来
            let paramsArr = urlStr.split('&')
            for(let i = 0,len = paramsArr.length;i < len;i++){
                // 再通过 = 将每一个参数分割为 key:value 的形式
                let arr = paramsArr[i].split('=')
                obj[arr[0]] = arr[1];
            }
            return obj
        },
        serve_init(){
              this.serve_socket = new WebSocket("ws://114.55.211.2:7272")
            this.serve_socket.onmessage = (res)=>{
                var data = JSON.parse(res.data)
                switch(data.type){
                    case 'init':
                        http.post({
                            url: api.kefu_init,
                            params:{
                                user_type: 'kefu-user',
                                client_id: data.client_id,
                                type: data.type,
                                uid:1,
                                token:context.state.header.token
                            },
                            successCallback: (res) => {
                                console.log(res);
                                if(res.code==10000){
            
                                }
                            }
                        });
                        break
                    case 'say':
                        break
                        case 'ask':
                            context.dispatch('addChatMsg', {
                            clientChatId: data.clientChatEn.clientChatId,
                            msg: {
                                contentType: 'text',
                                content: data.msg
                            }
                        });


                }
            }
        }
    },
    mounted() {
          let parames = this.getUrlParams(window.location.href)
            console.log(parames);
        // if(parames){
        //     this.header.USERID=parames.uid
        //     this.header.token=parames.token
        //     this.header.user_type=parames.user_type
        // }
        this.$store.imServerStore.commit('save_header',parames)
        this.$store.imServerStore.dispatch('SERVER_ON');
        // this.serve_init()
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
