<!-- im服务端入口 -->
<template>
    <div class="imServer-wrapper">
        <main class="imServer-main">
            <im-record :class="{record_show:recordShow}" class="item im-record" @selectedChat="selectedChat()" @toggleUserList = toggleUserList></im-record>
            <im-chat v-show="user_info.user_type!=''" ref="im_chat" class="item im-chat" @toggleUserList = toggleUserList></im-chat>
            <div class="user_info"  v-if="user_info.user_type=='sdk-user'">
                <el-card class="box-card">
                    <div slot="header" class="clearfix">
                        <span>用户详情</span>
                    </div>
                    <el-row>
                        <el-col :span="12">
                            <span class='info_key'> 用户名：</span>
                        {{user_info.userBasicInfo.name}}
                        </el-col>
                        <el-col :span="12">
                            <span class='info_key'>注册日期：</span>
                            {{user_info.userBasicInfo.regTime}}
                        </el-col>
                        <el-col :span="12">
                            <span class='info_key'>平台币余额：</span>
                            {{user_info.userBasicInfo.costs}}
                        </el-col>
                        <el-col :span="12">
                            <span class='info_key'>来源子包：</span>
                            {{user_info.userBasicInfo.subPackageName}}
                        </el-col>
                         <el-col :span="12">
                            <span class='info_key'>总消费金额：</span>
                            {{user_info.userBasicInfo.userCoinBalance}}
                        </el-col>
                        <el-col :span="12">
                            <span class='info_key'>注册IP：</span>
                            {{user_info.userBasicInfo.regIp}}
                        </el-col>
                        <el-col :span="12">
                            <span class='info_key'>手机号码：</span>
                            {{user_info.userBasicInfo.mobile}}
                        </el-col>
                        <el-col :span="12">
                            <span class='info_key'>uid：</span>
                            {{user_info.userBasicInfo.uid}}
                        </el-col>
                        
                        <el-col :span="12">
                            <span class='info_key'>注册设备编码：</span>
                            {{user_info.userBasicInfo.deviceUuid}}
                        </el-col>
                       
                        <el-col :span="12">
                            <span class='info_key'>VIP等级：</span>
                            {{user_info.userBasicInfo.vipLevel}}
                        </el-col>
                    </el-row>
                </el-card>
                <el-card class="box-card">
                    <div slot="header" class="clearfix">
                        <span>玩家角色</span>
                    </div>
                    <el-table
                    :data="user_info.rolesList.data"
                    height="270"
                    style="width: 100%">
                    <el-table-column
                        prop="gameName"
                        label="游戏名称"
                        width="180">
                    </el-table-column>
                    <el-table-column
                        prop="createdAt"
                        label="创建时间"
                        width="180">
                    </el-table-column>
                    <el-table-column
                        prop="roleLevel"
                        label="角色等级">
                    </el-table-column>
                     <el-table-column
                        prop="roleName"
                        label="角色名">
                    </el-table-column>
                     <el-table-column
                        prop="roleVip"
                        label="角色VIP等级">
                    </el-table-column>
                     <el-table-column
                        prop="serverName"
                        label="服务器名称">
                    </el-table-column>
                     <el-table-column
                        prop="union"
                        label="工会">
                    </el-table-column>
                </el-table>
                </el-card>
                <el-card class="box-card">
                    <div slot="header" class="clearfix">
                        <span>登陆日志</span>
                    </div>
                     <el-table
                    :data="user_info.loginLogsList.data"
                    height="270"
                    style="width: 100%">
                    <el-table-column
                        prop="gameName"
                        label="游戏名称"
                        width="180">
                    </el-table-column>
                    <el-table-column
                        prop="loginTime"
                        label="登陆时间"
                        width="180">
                    </el-table-column>
                    <el-table-column
                        prop="loginIp"
                        label="登录IP">
                    </el-table-column>
                     <el-table-column
                        prop="drivceBrand"
                        label="设备品牌">
                    </el-table-column>
                     <el-table-column
                        prop="drivceModel"
                        label="设备型号">
                    </el-table-column>
                     <el-table-column
                        prop="drivceSn"
                        label="设备序列号">
                    </el-table-column>
                     <el-table-column
                        prop="IDFA"
                        label="IDFA">
                    </el-table-column>
                     <el-table-column
                        prop="IDFV"
                        label="IDFV">
                    </el-table-column>
                     <el-table-column
                        prop="AndroidId"
                        label="AndroidId">
                    </el-table-column>
                </el-table>
                </el-card>
            </div>
            <div class="user_info" v-if="user_info.user_type=='cps-user'">
                <el-card class="box-card">
                    <div slot="header" class="clearfix">
                        <span>代理详情</span>
                    </div>
                    <el-row>
                        <el-col :span="24">
                            <span class='info_key'> 代理：</span>
                        {{user_info.name}}
                        </el-col>
                        <el-col :span="24">
                            <span class='info_key'> 渠道名称：</span>
                        {{user_info.channel}}
                        </el-col>
                        <el-col :span="24">
                            <span class='info_key'>代理等级：</span>
                            {{user_info.level}}
                        </el-col>
                        <el-col :span="24">
                            <span class='info_key'>平台币余额：</span>
                            {{user_info.userCoinBalance}}
                        </el-col>
                        <el-col :span="24">
                            <span class='info_key'>手机号码：</span>
                            {{user_info.mobile}}
                        </el-col>
                    </el-row>
                </el-card>
            </div>
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
        },
        user_info() {
            return this.$store.imServerStore.getters.user_info;
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
        }
    },
    mounted() {
        let parames = this.getUrlParams(window.location.href)
        this.$store.imServerStore.commit('save_header',parames)
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
            width: 280px;
        }
        & > .im-chat {
            width: calc(~'38% - 140px');
        }
        &>.user_info{
            display: inline-block;
            width: calc(~'60% - 140px');
            height: 100%;
            .info_key{
                display: inline-block;
                width: 120px;
                margin-bottom: 10px;
                text-align: justify;
                text-justify:distribute-all-lines; // 这行必加，兼容ie浏览器
                text-align-last: justify;
            }
        }
    }
}
</style>
