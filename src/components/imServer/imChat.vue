<!-- 聊天记录 -->
<template>
    <div class="imChat-wrapper">
        <!-- 头部 -->
        <header class="imChat-header">
            <div>
                <i class="fa fa-indent sm_Show" style="margin-right:15px" @click="toggleUserList()"></i>
                <span class="name">{{storeSelectedChatEn.clientChatName}}</span>
                <!-- <span class="time">{{getAccessTimeStr(storeSelectedChatEn.accessTime)}}</span> -->
                <span v-show="storeSelectedChatEn.state=='on' " class="on-line">在线</span>
                <span v-show="storeSelectedChatEn.state=='off' " class="off-line ">离线</span>
            </div>
            <div class="jinyan_btn" style="">
                <el-select v-model="user_cf" placeholder="用户状态" class="user_cf">
                    <el-option
                    v-for="(key,value) in state_option"
                    :key="value"
                    :label="key"
                    :value="value">
                    </el-option>
                </el-select>
                <img v-show="user_cf!='NONE'" src="../../../static/image/jinggao.png" width="15px"/>
            </div>
        </header>
        <main class="imChat-main">
            <!-- 聊天框区域 -->
            <common-chat ref="common_chat" :chatInfoEn="storeSelectedChatEn" :oprRoleName="'server'" @sendMsg="sendMsg" @sendFile="sendFile" @history='history'></common-chat>
        </main>
    </div>
</template>

<script>
import commonChat from '@/components/common/common_chat.vue';
import api from '@/api/apilist.js'
export default {
    components: {
        commonChat: commonChat
    },
    data() {
        return {
        };
    },
    computed: {
        user_cf:{
            get(){
                return this.$store.imServerStore.getters.user_cf
            },
            set(val){
                this.$store.imServerStore.dispatch('reset_user_cf',{user_cf:val})
            }
        },
        state_option(){
            return this.$store.imServerStore.getters.state_option;
        },
        storeSelectedChatEn() {
            return this.$store.imServerStore.getters.selectedChatEn;
        },
        storeHaveNewMsgDelegate() {
            return this.$store.imServerStore.getters.haveNewMsgDelegate;
        },
        storeServerChatEn() {
            return this.$store.imServerStore.getters.serverChatEn;
        }
    },
    watch: {
        storeSelectedChatEn(value) {
            this.$refs.common_chat.goEnd();
        },
        storeHaveNewMsgDelegate(value) {
            this.$refs.common_chat.goEnd();
        }
    },
    methods: {
        //切换用户列表显示
        toggleUserList(){
            this.$emit('toggleUserList')
        },
        sendFile:function(res){
             this.$store.imServerStore.dispatch('sendFile', {
                file: res.file,
                successCallbcak:res.successCallbcak
            });
        },
        /**
         * 发送消息
         * @param {Object} rs 回调对象
         */
        sendMsg: function(rs) {
            var msg = rs.msg;
            msg.role = 'server';
            msg.avatarUrl = this.storeServerChatEn.avatarUrl;
            // 1.socket发送消息
            this.$store.imServerStore.dispatch('sendMsg', {
                client_id: this.storeSelectedChatEn.client_id,
                msg: msg
            });

            // 2.附加到此chat对象的msg集合里
            this.$store.imServerStore.dispatch('addChatMsg', {
                auth_id: this.storeSelectedChatEn.auth_id,
                msg: msg,
                successCallback: ()=> {
                    this.goEnd()
                }
            });
        },
        //查看历史记录
        history(){
            let start_time
            if(this.storeSelectedChatEn.msgList.length>0){
                start_time = this.$ak.Utils.getDateTimeStr(this.storeSelectedChatEn.msgList[0].createTime, 'Y-m-d H:i:s')
            }else{
                start_time = this.$ak.Utils.getDateTimeStr(new Date(), 'Y-m-d H:i:s')
            }
            this.$http.get({
                url: api.history,
                params:{
                    user_type: this.storeSelectedChatEn.user_type,
                    auth_id:this.storeSelectedChatEn.auth_id,
                    start_time
                },
                successCallback: (res) => {
                    if(res.data.data.length==0){
                        this.$message('已全部加载');
                        return false
                        }
                    this.$store.imServerStore.dispatch('get_history',{
                        client_id: this.storeSelectedChatEn.client_id,
                        data:res.data.data,
                         successCallback: ()=>{
                            setTimeout(()=>{
                                this.$store.imServerStore.commit('set_currentPage', res.data.currentPage);  
                            },500)
                    }
                    })
                      
                }
            })
        },
        goEnd: function() {
            this.$refs.common_chat.goEnd();
        },

        /**
         * 获取chat的访问时间
         * @param {Date} accessTime 问时间
         */
        getAccessTimeStr: function(accessTime) {
            return this.$ak.Utils.getDateTimeStr(accessTime, 'Y-m-d H:i:s');
        }
    },
};
</script>
<style lang="less" scoped>
@media screen and (min-width:550px) {
    .sm_Show{
        display: none !important;
    }
}
.imChat-wrapper {
    .imChat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 50px;
        padding-left: 10px;
        border-bottom: 1px solid #e6e6e6;
        font-size: 16px;
        .jinyan_btn{
            border:solid 1px #238de4;
            border-radius: 5px;
            margin-right: 15px;
            vertical-align:baseline;
            min-width:140px;
            padding-left: 10px;
            img{
                margin-top: 12px;
                margin-right:5px
            }
        }
        span {
            margin-right: 20px;
        }
        .on-line {
            color: #70ed3a;
        }
        .off-line {
            color: #bbbbbb;
        }
        .user_cf{
            float: right;
            margin-right: 10px;
            width: 110px;
        }
        /deep/ .el-input__inner{
            padding: 0 !important;
            border: none !important;
        }
    }
    .imChat-main {
        height: calc(~'100% - 50px');
    }
}
</style>

