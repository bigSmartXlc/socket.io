<!-- im客户端 入口 -->
<template>
    <div class="imClient-wrapper">
        <audio controls style="display:none" ref="tipsplay">
            <source src="../../assets/sourse/tips.mp3" />
        </audio>
        <div class="imClient-inner">
            <header class="imClient-header">
                <div class="name-wrapper position-v-mid">
                    <span v-if="chatInfoEn.chatState == 'robot'">在线客服-访客端</span>
                    <span v-else-if="chatInfoEn.chatState == 'agent'">您正在与客服{{ serverChatEn.serverChatName }}对话</span>
                </div>
                <div class="opr-wrapper position-v-mid">
                    <!-- <i class="fa fa-indent sm_Show" @click="toggleRightList()"></i>
                        <el-tooltip content="评分" placement="bottom" effect="light">
                            <i class="fa fa-star-half-full" @click="showRateDialog()"></i>
                        </el-tooltip>
                        <el-tooltip content="留言" placement="bottom" effect="light">
                            <i class="fa fa-envelope-o" @click="showLeaveDialog()"></i>
                        </el-tooltip>
                        <el-tooltip content="结束会话" placement="bottom" effect="light">
                            <i class="fa fa-close" @click="closeChat()"></i>
                        </el-tooltip> -->
                </div>
            </header>
            <main class="imClient-main">
                <!-- 聊天框 -->
                <div class="item imClientChat-wrapper">
                    <!-- 聊天记录 -->
                    <common-chat ref="common_chat" :chatInfoEn="chatInfoEn" :oprRoleName="'client'" @sendMsg="sendMsg"
                        @sendFile="sendFile" @history="history" @chatCallback="chatCallback">
                    </common-chat>
                </div>
                <!-- 信息区域 -->
                <div class="item imClientInfo-wrapper" :class="{ record_show: recordShow }">
                    <article class="imClientInfo-notice-wrapper">
                        <header class="imClientInfo-item-header">
                            公告
                            <i class="fa fa-close info_close sm_Show" @click="toggleRightList()"></i>
                        </header>
                        <main class="imClientInfo-notice-main">
                            <p class="link">github：
                                <a href="https://github.com/polk6/vue-im" target="_blank">github.com/polk6/vue-im</a>
                            </p>
                            <p class="link">blog：
                                <a href="https://www.cnblogs.com/polk6/p/vue-im.html"
                                    target="_blank">cnblogs.com/polk6/p/vue-im.html</a>
                            </p>
                        </main>
                    </article>
                    <!-- 常见问题 -->
                    <article class="imClientInfo-faq-wrapper">
                        <header class="imClientInfo-item-header">
                            常见问题
                        </header>
                        <main class="imClientInfo-faq-main">
                            <el-collapse v-model="faqSelected" accordion>
                                <el-collapse-item v-for="(faqItem, index) in faqList" :key="index" :name="index"
                                    :title="faqItem.title">
                                    <div v-html="faqItem.content"></div>
                                </el-collapse-item>
                            </el-collapse>
                        </main>
                    </article>
                </div>
            </main>
        </div>
        <!-- 转接客服dialog -->
        <el-dialog title="请选择客服" :visible.sync="transferDialogVisible" :close-on-press-escape="false">
            <im-transfer ref="im_transfer" @submit="transferDialog_submit"></im-transfer>
        </el-dialog>
        <!-- 满意度dialog -->
        <el-dialog :visible.sync="rateDialogVisible" :close-on-press-escape="false">
            <im-rate ref="im_rate"></im-rate>
        </el-dialog>
        <!-- 离线留言dialog -->
        <el-dialog :visible.sync="leaveDialogVisible" :close-on-press-escape="false">
            <im-leave ref="im_leave"></im-leave>
        </el-dialog>
        <!-- 结束会话dialog -->
        <el-dialog :visible.sync="logoutDialogVisible" :close-on-press-escape="false">
            <p class="title">结束本次会话？</p>
            <div class="footer">
                <el-button type="primary" @click="logoutDialog_cancel">取消</el-button>
                <el-button type="primary" @click="logoutDialog_submit">结束会话</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script >
import commonChat from '@/components/common/common_chat.vue';
import imRate from './imRate.vue';
import imLeave from './imLeave.vue';
import imTransfer from './imTransfer.vue';
import api from '@/api/apilist.js'
import mp3 from '@/assets/sourse/tips.mp3'
export default {
    components: {
        commonChat: commonChat,
        imRate: imRate,
        imLeave: imLeave,
        imTransfer: imTransfer
    },
    data() {
        return {
            ws: null,
            header: {},
            user_obj: {},
            recordShow: false,
            socket: null,
            chatInfoEn: {
                chatState: 'agent', // chat状态；robot 机器人、agent 客服
                inputContent: '', // 输入框内容
                msgList: [], // 消息列表
                state: 'off', // 连接状态;on ：在线；off：离线
                lastMsgShowTime: null // 最后一个消息的显示时间
            }, // 会话信息，包括聊天记录、状态
            clientChatEn: {
                clientChatId: '',
                clientChatName: '',
                avatarUrl: 'static/image/im_client_avatar.png'
            }, // 当前账号的信息
            serverChatEn: {
                serverChatName: '',
                avatarUrl: 'static/image/im_client_avatar.png'
            }, // 服务端chat信息
            robotEn: {
                robotName: '小旺',
                avatarUrl: 'static/image/im_robot_avatar.png'
            }, // 机器人信息
            faqList: [
                { title: '今天周几', content: '今天周一' },
                { title: '今天周几', content: '今天周二' },
                { title: '今天周几', content: '今天周三' },
                { title: '今天周几', content: '今天周四' },
                { title: '今天周几', content: '今天周五' }
            ],
            faqSelected: '-1',
            inputContent_setTimeout: null, // 输入文字时在输入结束才修改具体内容
            selectionRange: null, // 输入框选中的区域
            shortcutMsgList: [], // 聊天区域的快捷回复列表
            logoutDialogVisible: false, // 结束会话显示
            transferDialogVisible: false, // 转接人工dialog
            rateDialogVisible: false, // 评价dialog
            leaveDialogVisible: false // 留言dialog
        };
    },
    computed: {},
    watch: {},
    methods: {
        //切换右侧信息
        toggleRightList() {
            this.recordShow = !this.recordShow
        },
        /**
         * 注册账号信息
         */
        regClientChatEn: function () {
            this.$data.clientChatEn.clientChatId = Number.parseInt(Date.now() + Math.random());
            // 名称格式：姓+6位数字
            var userName = '';
            switch (this.$data.clientChatEn.clientChatId % 5) {
                case 0:
                    userName = '张';
                    break;
                case 1:
                    userName = '李';
                    break;
                case 2:
                    userName = '王';
                    break;
                case 3:
                    userName = '赵';
                    break;
                case 4:
                    userName = '孙';
                    break;
            }
            var tmpId = this.$data.clientChatEn.clientChatId.toString();
            userName += tmpId.substr(tmpId.length - 6, 6);
            this.$data.clientChatEn.clientChatName = userName;

            // 模拟消息
            this.addChatMsg({
                role: 'robot',
                avatarUrl: this.$data.robotEn.avatarUrl,
                contentType: 'transformServer'
            });
        },

        /**
         * 注册socket
         * @param {String} serverChatId 服务端chatId
         */
        reg_ws() {
            this.ws = new WebSocket("ws://114.55.211.2:7272")
            this.ws.onmessage = (res) => {
                var data = JSON.parse(res.data)
                switch (data.type) {
                    case 'init':
                        this.can_say(data)
                        break
                    case 'say':
                        this.user_obj = JSON.parse(JSON.stringify(data))
                        if (this.header.user_type == 'visitor') {
                            this.$ak.Utils.setCookie('USERID', this.user_obj.auth_id)
                        }
                        this.chatInfoEn.state = 'on'
                        if (data.msg) {
                            var msg = {}
                            msg.role = 'server'
                            if (data.msg_type == '2') {
                                msg.contentType = 'file'
                            } else if (data.msg_type == '5') {
                                msg.contentType = 'image'
                            } else if (data.msg_type == '3') {
                                msg.contentType = 'video'
                            } else if (data.msg_type == '4') {
                                msg.contentType = 'sound'
                            } else {
                                msg.contentType = 'text'
                            }
                            msg.avatarUrl = 'static/image/im_client_avatar.png'
                            msg.fileUrl = data.msg
                            msg.content = data.msg
                            msg.state = 'success'
                            this.addChatMsg(msg, () => {
                                this.$refs.common_chat.goEnd();
                            });
                        }
                        break
                    case 'stop':
                        console.log(data);
                        this.$message(data.msg);
                        break

                }
            }

            //监听离开页面断开连接
            window.addEventListener('beforeunload', () => {
                this.closeChat();
            });
        },
        //查询是否客服是否连通
        can_say(data) {
            this.$http.post({
                url: api.ws_init,
                params: {
                    user_type: this.header.user_type,
                    client_id: data.client_id,
                    type: data.type,
                    uid: this.header.USERID,
                    token: this.header.token
                },
                headers: this.header.user_type == 'cps-user' ? {
                    USERID: this.header.USERID,
                    token: this.header.token
                } : {},
                successCallback: (res) => {
                    if (res.code == 10000) {

                    }
                }
            });
        },
        // 获取用户聊天记录
        history() {
            let start_time
            if (this.chatInfoEn.msgList.length > 0) {
                start_time = this.$ak.Utils.getDateTimeStr(this.chatInfoEn.msgList[0].createTime, 'Y-m-d H:i:s')
            } else {
                start_time = this.$ak.Utils.getDateTimeStr(new Date(), 'Y-m-d H:i:s')
            }
            this.$http.get({
                url: api.history,
                params: {
                    user_type: this.header.user_type,
                    auth_id: this.user_obj.auth_id,
                    // page:this.carrentPage+1,
                    start_time
                },
                headers: this.header.user_type == 'cps-user' ? {
                    USERID: this.header.USERID,
                    token: this.header.token
                } : {},
                successCallback: (res) => {
                    if (res.code == 100000) {
                        if (res.data.data.length == 0) {
                            this.$message('已加载完');
                            return false
                        }
                        // this.carrentPage = res.data.currentPage
                        var data = res.data.data
                        data.forEach(item => {
                            let contentType
                            if (item.msgType == '5') {
                                contentType = 'file'
                            } else if (item.msgType == '2') {
                                contentType = 'image'
                            } else if (item.msgType == '3') {
                                contentType = 'video'
                            } else if (item.msgType == '4') {
                                contentType = 'sound'
                            } else {
                                contentType = 'text'
                            }
                            let role
                            let avatarUrl
                            if (item.msgCategory != 1) {
                                role = 'server'
                                avatarUrl = 'static/image/im_client_server.png'
                            } else {
                                avatarUrl = 'static/image/im_client_avatar.png'
                                role = 'client'
                            }
                            let msg = {
                                role: role,
                                contentType,
                                avatarUrl,
                                fileUrl: item.msg,
                                content: item.msg,
                                createTime: item.createdAt,
                                state: 'success'
                            }
                            this.addChatMsg(msg, () => { }, true)
                        })
                    }
                }
            });
        },
        regSocket: function (serverChatId) {
            his.$data.socket = require('socket.io-client')('http://localhost:3001');
            this.$data.socket.on('connect', () => {
                // 客户端上线
                this.$data.socket.emit('CLIENT_ON', {
                    clientChatEn: this.$data.clientChatEn,
                    serverChatId: serverChatId
                });

                // 服务端链接
                this.$data.socket.on('SERVER_CONNECTED', (data) => {
                    // 1)获取客服消息
                    this.$data.serverChatEn = data.serverChatEn;

                    // 2)添加消息
                    this.addChatMsg({
                        role: 'sys',
                        contentType: 'text',
                        content: '客服 ' + data.serverChatEn.serverChatName + ' 为你服务'
                    });
                });

                // 接受服务端信息
                this.$data.socket.on('SERVER_SEND_MSG', (data) => {
                    data.msg.avatarUrl = this.$data.serverChatEn.avatarUrl;
                    this.addChatMsg(data.msg, () => {
                        this.$refs.common_chat.goEnd();
                    });
                });

                // 离开
                window.addEventListener('beforeunload', () => {
                    this.closeChat();
                });
            });
        },

        /**
         * 结束会话
         */
        closeChat: function () {
            // if (this.$data.chatInfoEn.chatState == 'agent') {
            //     this.$data.socket.emit('CLIENT_OFF', {
            //         clientChatEn: this.$data.clientChatEn,
            //         serverChatId: this.$data.serverChatEn.serverChatId
            //     });
            //     this.$data.socket.close();
            //     this.$data.chatInfoEn.state = 'off';
            // }
        },

        /**
         * 添加chat对象的msg
         * @param {Object} msg 消息对象；eg：{role:'sys',content:'含有新的消息'}
         * @param {String} msg.role 消息所有者身份；eg：'sys'系统消息；
         * @param {String} msg.contentType 消息类型；text:文本(默认)；image:图片
         * @param {String} msg.content 消息内容
         * @param {Function} successCallback 添加消息后的回调
         */
        addChatMsg: function (msg, successCallback, history = false) {
            // 1.设定默认值
            msg.role = msg.role == undefined ? 'sys' : msg.role;
            msg.contentType = msg.contentType == undefined ? 'text' : msg.contentType;
            var msgList = this.$data.chatInfoEn.msgList ? this.$data.chatInfoEn.msgList : [];
            msg.createTime = msg.createTime == undefined ? new Date() : msg.createTime;
            // 2.插入消息
            // 1)插入日期
            // 实际场景中，在消息上方是否显示时间是由后台传递给前台的消息中附加上的，可参考 微信Web版
            // 此处进行手动设置，5分钟之内的消息，只显示一次消息
            msg.createTime = new Date(msg.createTime);
            if (this.$data.chatInfoEn.lastMsgShowTime == null || msg.createTime.getTime() - this.$data.chatInfoEn.lastMsgShowTime.getTime() > 1000 * 60 * 5) {
                msgList.push({
                    role: 'sys',
                    contentType: 'text',
                    content: this.$ak.Utils.getDateTimeStr(msg.createTime, 'Y-m-d H:i:s'),
                    createTime: this.$ak.Utils.getDateTimeStr(msg.createTime, 'Y-m-d H:i:s')
                });
                this.$data.chatInfoEn.lastMsgShowTime = msg.createTime;
            }

            // 2)插入消息
            if (history) {
                msgList.unshift(msg);
            } else {
                msgList.push(msg);
            }
            // 3.设置chat对象相关属性
            this.$data.chatInfoEn.msgList = msgList;
            // 4.回调
            successCallback && successCallback();
        },
        /**
       * 文件上传
       * @param {Object} rs 回调对象
       */
        sendFile: function (res) {
            res.file.append('auth_id', this.user_obj.auth_id);
            res.file.append('client_id', this.user_obj.client_id);
            res.file.append('type', this.user_obj.type);
            res.file.append('user_type', this.header.user_type);
            res.file.append('msg', '');
            this.$http.uploadFile({
                url: api.ws_chat,
                params: res.file,
                successCallback: (rs) => {
                    if (rs.code == 100000 || rs.code == 110007) {
                        var msg = {}
                        msg.role = 'client'
                        if (rs.data.msg_type == '5') {
                            msg.contentType = 'image'
                        } else if (rs.data.msg_type == '2') {
                            msg.contentType = 'file'
                        } else if (rs.data.msg_type == '3') {
                            msg.contentType = 'video'
                        } else if (rs.data.msg_type == '4') {
                            msg.contentType = 'sound'
                        }
                        msg.avatarUrl = 'static/image/im_client_avatar.png'
                        msg.fileUrl = rs.data.url
                        msg.state = 'success'
                        this.addChatMsg(msg, () => {
                            this.goEnd();
                            res.successCallbcak()
                        });
                    }
                }
            });
        },
        /**
         * 发送消息
         * @param {Object} rs 回调对象
         */
        sendMsg: function (rs) {
            this.$http.post({
                url: api.ws_chat,
                params: {
                    ...this.user_obj,
                    user_type: this.header.user_type,//cps/sdk/kefu/visitor
                    msg: rs.msg.content,
                    msg_type: 1 //1文本2文件3视频4音频5其他
                },
                successCallback: (res) => {
                    if (res.code == 100000) {
                        var msg = rs.msg
                        msg.role = 'client'
                        msg.avatarUrl = 'static/image/im_client_avatar.png'
                        rs.successCallbcak()
                        this.addChatMsg(msg, function () {
                            this.goEnd();
                        });
                    }
                },
                failCallback: (res) => {
                    if (res.code == 110007) {
                        var msg = rs.msg
                        msg.role = 'client'
                        msg.avatarUrl = 'static/image/im_client_avatar.png'
                        rs.successCallbcak()
                        this.addChatMsg(msg, function () {
                            this.goEnd();
                        });
                    }
                }
            });
        },

        /**
         * 显示转接客服Dialog
         */
        transferDialog_show: function () {
            this.$data.transferDialogVisible = true;
            this.$nextTick(() => {
                this.$refs.im_transfer.init();
            });
        },

        /**
         * 转接客服dialog_提交
         */
        transferDialog_submit: function (rs) {
            this.$data.transferDialogVisible = false;
            this.$data.chatInfoEn.chatState = 'agent';
            this.regSocket(rs.serverChatId);
        },

        /**
         * 注销dialog_提交
         */
        logoutDialog_submit: function () {
            this.$data.logoutDialogVisible = false;
            this.addChatMsg({
                role: 'sys',
                content: '本次会话已结束'
            });
        },

        /**
         * 注销dialog_取消
         */
        logoutDialog_cancel: function () {
            this.$data.logoutDialogVisible = false;
        },

        /**
         * 聊天记录滚动到底部
         */
        goEnd: function () {
            this.$refs.common_chat.goEnd();
        },

        /**
         * chat回调
         */
        chatCallback: function (rs) {
            // if (rs.eventType == 'transformServer') {
            //     this.transferDialog_show();
            // }
        },
        /**
         * 显示评分dialog
         */
        showRateDialog: function () {
            this.$data.rateDialogVisible = true;
            this.$nextTick(() => {
                this.$refs.im_rate.init();
            });
        },
        /**
         * 显示留言dialog
         */
        showLeaveDialog: function () {
            this.$data.leaveDialogVisible = true;
            this.$nextTick(() => {
                this.$refs.im_leave.init();
            });
        },
        //获取url参数
        getUrlParams(url) {
            if (url.indexOf('?') > 0) {
                // 通过 ? 分割获取后面的参数字符串
                let urlStr = url.split('?')[1]
                // 创建空对象存储参数
                let obj = {};
                // 再通过 & 将每一个参数单独分割出来
                let paramsArr = urlStr.split('&')
                for (let i = 0, len = paramsArr.length; i < len; i++) {
                    // 再通过 = 将每一个参数分割为 key:value 的形式
                    let arr = paramsArr[i].split('=')
                    obj[arr[0]] = arr[1];
                }
                return obj
            } else {
                return null
            }
        },
        playAudio() {
            this.$refs.tipsplay.play()
        },
    },
    mounted() {
        // this.regClientChatEn();
        // this.regSocket()
        //获取URL参数
        let parames = this.getUrlParams(window.location.href)
        if (parames) {
            this.header.USERID = parames.uid
            this.header.token = parames.token
            this.header.user_type = parames.user_type
        } else {
            this.header.user_type = 'visitor'
            if (this.$ak.Utils.getCookie('USERID')) {
                this.header.USERID = this.$ak.Utils.getCookie('USERID')
            }
        }
        this.reg_ws()
    }
};
</script>

<style lang="less">
@import '../../common/css/base.less';

.imClient-wrapper {
    min-height: 375px;
    height: 100%;
    max-height: 700px;
    #common-wrapper();
}

.imClient-inner {
    max-width: 850px;
    height: 100%;
    margin: 0 auto;
    overflow: hidden;
    box-shadow: 0 1px 5px 2px #ccc;

    .imClient-header {
        position: relative;
        height: 35px;
        box-sizing: border-box;
        background: #1072b5;
        font-size: 13px;
        color: #ffffff;

        .name-wrapper {
            margin-left: 20px;
        }

        .logo {
            height: 45px;
            width: auto;
        }

        .opr-wrapper {
            right: 20px;
            font-size: 16px;
            cursor: pointer;

            .fa {
                margin-left: 10px;
            }
        }
    }

    .imClient-main {
        max-width: 100%;
        height: calc(~'100% - 35px');
        padding-bottom: 20px;

        // position: relative;
        &:after {
            content: "";
            display: block;
            visibility: hidden;
            clear: both;
        }

        &>.item {
            float: left;
            height: 100%;
            border-top-width: 0px;
            border-right-width: 0px;
            box-sizing: border-box;

            &:last-child {
                border-right-width: 1px;
            }
        }

        &>.imClientChat-wrapper {
            // max-width: 550px;
            width: 100%;
            border-right: 1px solid #ccc;
        }

        &>.imClientInfo-wrapper {
            //    width: 300px;
            display: none;
        }
    }
}

@media only screen and (max-width: 550px) {
    .imClientInfo-wrapper {
        position: fixed;
        width: 0 !important;
        z-index: 1000;
        background: #e6e6e6;
        overflow: hidden;
        right: 0;
        top: 0;
    }

    .record_show {
        // width: 300px !important;
    }

    .imClient-main {
        height: 95vh !important
    }
}

@media screen and (min-width:550px) {
    .sm_Show {
        display: none;
    }
}

// 信息区域
.imClientInfo-wrapper {
    width: 100%;
    height: 100%;
    background: #ffffff;

    .imClientInfo-notice-wrapper,
    .imClientInfo-faq-wrapper {
        .imClientInfo-item-header {
            font-weight: bolder;
            font-size: 16px;
            color: #1072b5;
            padding: 10px 15px 0;

            .info_close {
                float: right;
                margin-right: 10px;
            }
        }
    }

    .imClientInfo-notice-wrapper {
        .imClientInfo-notice-main {
            padding: 0 15px;

            &>.link {
                margin: 10px 0;
                font-size: 12px;
                color: #000000;
            }
        }
    }

    .imClientInfo-faq-wrapper {
        height: 380px;
        border-top: 1px solid #ccc;

        .imClientInfo-faq-main {
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;

            .el-collapse {
                border: 0px;

                .el-collapse-item__header {
                    position: relative;
                    padding: 0px 15px;
                    font-size: 12px;
                    background: transparent;
                    color: #000000;

                    &.is-active {
                        color: #f7455d;
                    }

                    .el-collapse-item__arrow {
                        position: absolute;
                        left: 267px;
                    }
                }

                .el-collapse-item__wrap {
                    background: transparent;

                    .el-collapse-item__content {
                        font-size: 12px;
                        color: #959699;
                        padding: 0px 15px 10px;
                    }
                }
            }
        }
    }
}

// element-UI
.el-dialog {
    width: 95%;
    max-width: 500px;
    background: #ffffff;
    color: #000000;
}
</style>
