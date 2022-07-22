/*!
 *  im服务端Store
 */

import Vue from 'vue';
import Vuex from 'vuex';
import ak from '@/common/ak.js';
import http from '@/common/http.js';
import api from '@/api/apilist.js'
import { off } from 'node-notifier';
Vue.use(Vuex);
export const imServerStore = new Vuex.Store({
    state: {
        state_option:{},
        header:null,
        user_info:{
            user_type:'',
        },
        serverChatEn: {
            serverChatId: Number.parseInt(Date.now() + Math.random()),
            serverChatName: '指悦-客服',
            avatarUrl: '/static/image/im_server_avatar.png'
        },
        selectedChatEn: {
            clientChatName:'',
            state:'end',
            accessTime:new Date(),
            currentPage:0
        }, // 选取的会话对象
        currentChatEnlist: [], // 当前chat实体集合
        notificationChatEnlist: [], // 通知chat实体集合
        haveNewMsgDelegate: null, // 当前已选中的用户含有新消息
        socket: null
    },
    mutations: {
        set_user_cf(state,val){
            var obj = JSON.parse(JSON.stringify(state.user_info))
            state.user_info = Object.assign(obj,{user_cf:val})
            // state.user_info.user_cf = val
        },
        set_currentPage(state,data){
            state.selectedChatEn.currentPage = data
        },
        //保存请求头
        save_header:function(state,data){
            state.header = data
        },
        /**
         * 触发当前选择的chat含有新的消息
         * @param {Object} payload 载荷对象
         */
        triggerHaveNewMsgDelegate: function(state, payload) {
            state.haveNewMsgDelegate = Date.now();
        },

        /**
         * 排序当前会话列表
         */
        sortCurrentChatEnlist: function(state, payload) {
            var enlist = state.currentChatEnlist.concat();

            // 排序规则：
            // 1)已关注放最前面，关注状态下按最后一条获取时间正序
            // 2)非关注状态下，按最后一条获取时间正序

            // 1.首先按最后一次更新时间排序
            for (var i = 0; i < enlist.length; i++) {
                for (var j = i; j < enlist.length; j++) {
                    var iTimeSpan = Date.parse(enlist[i].lastMsgTime);
                    var jTimeSpan = Date.parse(enlist[j].lastMsgTime);
                    if (iTimeSpan < jTimeSpan) {
                        var tmp = enlist[i];
                        enlist[i] = enlist[j];
                        enlist[j] = tmp;
                    }
                }
            }

            // 2.已关注的排在最前面并按最后一次时间倒序
            var followEnlist = [];
            var unfollowEnlist = [];
            for (var i = 0; i < enlist.length; i++) {
                var en = enlist[i];
                if (en.isFollow) {
                    followEnlist.push(en);
                } else {
                    unfollowEnlist.push(en);
                }
            }

            // 3.合并
            state.currentChatEnlist = followEnlist.concat(unfollowEnlist);
        },

        /**
         * 清除通知chat
         */
        clearNotificationChat: function(state) {
            state.notificationChatEnlist = [];
        }
    },
    actions: {
        /*
            禁言状态修改
        */
       reset_user_cf:function(context,{user_cf}){
        http.post({
            url: api.black,
            params:{
                type:user_cf,
                auth_id:context.state.selectedChatEn.auth_id
            },
            successCallback: (res) => {
                if(res.code==100000){
                    context.commit('set_user_cf',user_cf);
                }
            }
        });
       },
         /**
         * 获取历史记录
         */
        get_history:function(context,{data,successCallback}){
            data.forEach(item=>{
                let contentType
                if(item.msgType=='2'){
                    contentType = 'file'
                }else if(item.msgType=='5'){
                    contentType = 'image'
                }else if(item.msgType=='3'){
                    contentType = 'video'
                }else if(item.msgType=='4'){
                    contentType = 'sound'
                }else{
                    contentType = 'text'
                }
                let role
                let avatarUrl
                if(item.msgCategory!=1){
                    role = 'server'
                    avatarUrl = 'static/image/im_client_server.png'
                }else{
                    avatarUrl = 'static/image/im_client_avatar.png'
                    role = 'client'
                }
                let msg={
                        role: role,
                        contentType,
                        avatarUrl,
                        fileUrl:item.msg,
                        content: item.msg,
                        createTime:item.createdAt,
                        state:'success'
                    }
                context.dispatch('addChatMsg', {
                        auth_id:context.state.selectedChatEn.auth_id,
                        history:true,
                        msg
                    });
            })
            successCallback()
        },
        /**
         * 添加访客端chat对象
         * @param {Object} payload 载荷对象
         * @param {String} payload.newChatEn 新的chat对象
         */
        addClientChat: function(context, { newChatEn,isInit=false}) {
            context.dispatch('getChatEnByChatId', { auth_id: newChatEn.auth_id }).then((chatEn) => {
                if (chatEn == null) {
                    // 1)公共属性
                    newChatEn.msgList = [];
                    newChatEn.state = isInit?'off':'on';
                    newChatEn.accessTime = new Date(); // 访问时间
                    newChatEn.inputContent = ''; // 输入框内容
                    newChatEn.newMsgCount = 0;
                    newChatEn.isFollow = false; // 是否关注
                    newChatEn.lastMsgTime = null;
                    newChatEn.lastMsgShowTime = null; // 最后一个消息的显示时间
                    context.state.currentChatEnlist.push(newChatEn);
                }
                // 2)增加消息
                if(!isInit){
                    let contentType
                    if(newChatEn.msg_type=='2'){
                        contentType = 'file'
                    }else if(newChatEn.msg_type=='5'){
                        contentType = 'image'
                    }else if(newChatEn.msg_type=='3'){
                        contentType = 'video'
                    }else if(newChatEn.msg_type=='4'){
                        contentType = 'sound'
                    }else{
                        contentType = 'text'
                    }
                    context.dispatch('addChatMsg', {
                        auth_id: newChatEn.auth_id,
                        msg: {
                            role: 'client',
                            contentType,
                            fileUrl:newChatEn.msg,
                            content: newChatEn.msg
                        }
                    });
                    context.dispatch('extendChatEn', {
                        auth_id: newChatEn.auth_id,
                        extends: {
                            state: 'on',
                            zyim_id:newChatEn.zyim_id,
                            type:newChatEn.type,
                            kefu_id:newChatEn.kefu_id,
                            client_id:newChatEn.client_id
                        }
                    });
                }
            });
        },
        /**
         * 根据jobId获取chat对象
         * @param {String} auth_id 需要修改的chatEn的id，根据此id匹配当前集合或历史集合
         * @param {String} listName 指定的集合名称；e.g. currentChatEnlist、historyChatEnlist、allHistoryChatEnlist
         */
        getChatEnByChatId: function(context, { auth_id, listName }) {
            var chatEn = null;
            if (listName) {
                // 1.指定了列表
                var targetList = context.state[listName];
                for (var i = 0; i < targetList.length; i++) {
                    var tmpEn = targetList[i];
                    if (tmpEn.auth_id == auth_id) {
                        chatEn = tmpEn;
                        break;
                    }
                }
            } else {
                // 2.未指定列表
                // 1)从当前会话列表查找
                for (var i = 0; i < context.state.currentChatEnlist.length; i++) {
                    var tmpEn = context.state.currentChatEnlist[i];
                    if (tmpEn.auth_id == auth_id) {
                        chatEn = tmpEn;
                        break;
                    }
                }
            }
            return chatEn;
        },

        /**
         * 修改Chat对象的属性
         * @param {Object} payload 载荷对象
         * @param {Object} payload.auth_id 需要修改的chatEn的id，根据此id匹配当前集合或历史集合
         * @param {Array} payload.extends Chat需要变更的属性对象数组
         */
        extendChatEn: function(context, payload) {
            return context.dispatch('getChatEnByChatId', { auth_id: payload.auth_id }).then((chatEn) => {
                // 1.若没有，就附加到当前会话列表里
                if (chatEn == null) {
                    return;
                }
                // 2.extend属性
                for (var key in payload.extends) {
                    Vue.set(chatEn, key, payload.extends[key]);
                }

                // 3.若选中的当前chatEn 与 传入的一直，更新选中额chatEn
                if (context.state.selectedChatEn && context.state.selectedChatEn.auth_id == chatEn.auth_id) {
                    context.state.selectedChatEn = Object.assign({}, chatEn);
                    Vue.nextTick(function() {});
                }
                return chatEn;
            });
        },

        /**
         * 添加chat对象的msg
         * @param {String} auth_id 会话Id
         * @param {Object} msg 消息对象；eg：{role:'sys',content:'含有新的消息'}
         * @param {String} msg.role 消息所有者身份；eg：'sys'系统消息；
         * @param {String} msg.contentType 消息类型；text:文本(默认)；image:图片
         * @param {String} msg.content 消息内容
         * @param {Function} successCallback 添加消息后的回调
         */
        addChatMsg: function(context, { auth_id, msg,history=false, successCallback }) {
            context.dispatch('getChatEnByChatId', { auth_id: auth_id }).then((chatEn) => {
                if (chatEn == null) {
                    return;
                }
                // 1.设定默认值
                msg.createTime = msg.createTime == undefined ? new Date() : msg.createTime;
                msg.avatarUrl='/static/image/im_client_avatar.png'
                var msgList = chatEn.msgList ? chatEn.msgList : [];

                // 2.插入消息
                // 1)插入日期
                // 实际场景中，在消息上方是否显示时间是由后台传递给前台的消息中附加上的，可参考 微信Web版
                // 此处进行手动设置，5分钟之内的消息，只显示一次消息
                msg.createTime = new Date(msg.createTime);
                if (chatEn.lastMsgShowTime == null || msg.createTime.getTime() - chatEn.lastMsgShowTime.getTime() > 1000 * 60 * 5) {
                    msgList.push({
                        role: 'sys',
                        contentType: 'text',
                        createTime:ak.Utils.getDateTimeStr(msg.createTime, 'Y-m-d H:i:s'),
                        content: ak.Utils.getDateTimeStr(msg.createTime, 'Y-m-d H:i:s'),
                        avatarUrl:'/static/image/im_client_avatar.png'
                    });
                    chatEn.lastMsgShowTime = msg.createTime;
                }

                // 2)插入消息
                if(history == true){
                    msgList.unshift(msg)
                }else{
                    msgList.push(msg);
                }

                // 3.设置chat对象相关属性
                chatEn.msgList = msgList;
                chatEn.lastMsgTime = msg.createTime;
                switch (msg.contentType) {
                    case 'video':
                        chatEn.lastMsgContent = "[视频]";
                        break;
                    case 'text':
                        chatEn.lastMsgContent = msg.content;
                        break;
                    case 'image':
                        chatEn.lastMsgContent = '[图片]';
                        break;
                    case 'file':
                        chatEn.lastMsgContent = '[文件]';
                        break;
                    case 'sound':
                        chatEn.lastMsgContent = '[语音]';
                        break;
                }
                // 更新列表
                if (context.state.selectedChatEn && chatEn.auth_id == context.state.selectedChatEn.auth_id) {
                    chatEn.newMsgCount = 0;
                    context.state.selectedChatEn = Object.assign({}, chatEn);
                } else {
                    chatEn.newMsgCount++;
                }
                // 4.排序
                // context.commit('sortCurrentChatEnlist', {});
                // 5.加入通知
                if (msg.isNewMsg && msg.role == 'client' && msg.contentType != 'preInput') {
                    context.dispatch('addNotificationChat', {
                        chatEn: chatEn,
                        oprType: 'msg'
                    });
                }

                // 6.回调
                successCallback && successCallback();
            });
        },

        /**
         * 选中会话
         * @param {String} auth_id 选中会话Id
         */
        selectChat: function(context, { auth_id }) {
            context.dispatch('getChatEnByChatId', { auth_id: auth_id }).then((chatEn) => {
                var state = context.state;
                chatEn.newMsgCount=0; // 设置新消息为0
                // 1.设置当前选中的会话
                context.state.selectedChatEn = Object.assign({}, chatEn);
                context.commit('triggerHaveNewMsgDelegate');
                context.commit('set_currentPage',0);
                http.post({
                    url: api.user_info,
                    params:{
                        user_type:chatEn.user_type,
                        auth_id:chatEn.auth_id
                    },
                    successCallback: (res) => {
                        if(res.code==100000){
                            context.state.user_info = {}
                            var obj = {
                                user_type:chatEn.user_type,
                                user_cf:res.data.blackStatus
                            }
                            Object.assign(context.state.user_info,res.data.userInfo,obj)
                            context.state.state_option = res.data.blackSelect
                        }
                    }
                });
                // 2.刷新当前会话集合
                for (var i = 0; i < state.currentChatEnlist.length; i++) {
                    var tmpEn = state.currentChatEnlist[i];
                    if (tmpEn.auth_id == chatEn.auth_id) {
                        state.currentChatEnlist[i] = state.selectedChatEn;
                        break;
                    }
                }
            });
        },

        /**
         * 添加通知chat
         * @param {Object} chatEn 会话对象
         * @param {String} oprType 操作类型；eg：chat(添加会话)、msg(添加消息)
         */
        addNotificationChat: function(context, { chatEn, oprType }) {
            var state = context.state;
            // 当前的路由是否在im模块里，若不在im模块里，才显示通知
            if (window.polkVue.$route.name == 'im') {
                return;
            }

            // 1.判断当前通知集合里是否已存在次会话，若已存在去除此会话
            for (var i = 0; i < state.notificationChatEnlist.length; i++) {
                if (state.notificationChatEnlist[i].auth_id == chatEn.auth_id) {
                    state.notificationChatEnlist.splice(i, 1);
                    break;
                }
            }

            // 2.集合最多只能有5个
            if (state.notificationChatEnlist.length > 5) {
                state.notificationChatEnlist = state.notificationChatEnlist.splice(4);
            }

            // 3.转换后加入到当前通知集合里
            var tmpChatEn = {
                auth_id: chatEn.auth_id,
                sourceInfo_way: chatEn.sourceInfo_way,
                site: window.location.host
            };
            if (oprType == 'chat') {
                tmpChatEn.title = '新用户';
                tmpChatEn.content = '客户 ' + chatEn.clientChatName + ' 接入新会话';
            } else if (oprType == 'msg') {
                tmpChatEn.title = '客户 ' + chatEn.clientChatName + ' ' + chatEn.newMsgCount + '条新消息';
                tmpChatEn.content = chatEn.lastMsgContent;
            }

            // 4.内容大于25个截断
            if (tmpChatEn.content.length > 25) {
                tmpChatEn.content = tmpChatEn.content.substr(0, 24) + '...';
            }

            // 5.加入到集合里
            state.notificationChatEnlist.push(tmpChatEn);

            // 6.当通知数量大于5个时清除通知
            window.imServerStore_notificationList = window.imServerStore_notificationList || [];
            if (window.imServerStore_notificationList.length > 5) {
                window.imServerStore_notificationList.forEach((item, index) => {
                    item.close();
                });
                window.imServerStore_notificationList = [];
            }

            // 7.显示通知
            for (var i = 0; i < state.notificationChatEnlist.length; i++) {
                const item = state.notificationChatEnlist[i];
                // 1)已存在的通知列表是否包含此会话，若存在就关闭并移除
                for (var j = 0; j < window.imServerStore_notificationList.length; j++) {
                    if (window.imServerStore_notificationList[j].data == item.auth_id) {
                        window.imServerStore_notificationList[j].close();
                        break;
                    }
                }

                // 2)创建新的通知
                const notification = new Notification(item.title, {
                    body: item.content,
                    data: item.auth_id,
                    tag: Date.now(),
                    icon: ak.BLL.getPngFromWay(item.sourceInfo_way)
                });
                notification.onclick = function(e) {
                    window.focus();
                    window.polkVue.$router.push('im');
                    context.commit('clearNotificationChat');
                    context.dispatch('selectChat', { auth_id: item.auth_id });
                    notification.close();
                    imServerStore_notificationList = [];
                };

                notification.onclose = function(e) {
                    // remove en
                    for (var i = 0; i < state.notificationChatEnlist.length; i++) {
                        if (state.notificationChatEnlist[i].auth_id == item.auth_id) {
                            state.notificationChatEnlist.splice(i, 1);
                            break;
                        }
                    }
                    // remove notification
                    for (var i = 0; i < window.imServerStore_notificationList.length; i++) {
                        if (window.imServerStore_notificationList[i].tag == notification.tag) {
                            window.imServerStore_notificationList.splice(i, 1);
                            break;
                        }
                    }
                };

                setTimeout(function() {
                    notification && notification.close();
                }, 1000 * 10);

                window.imServerStore_notificationList.push(notification);
            }
        },

        /**
         * 服务端上线
         */
        SERVER_ON: function(context, payload) {
            context.state.socket = new WebSocket("ws://114.55.211.2:7272")
            context.state.socket.onmessage = (res)=>{
                var data = JSON.parse(res.data)
                switch(data.type){
                    case 'init':
                        http.post({
                            url: api.kefu_init,
                            params:{
                                user_type: 'kefu-user',
                                client_id: data.client_id,
                                type: data.type,
                                uid:context.state.header.uid,
                                token:context.state.header.token
                            },
                            successCallback: (res) => {
                                if(res.code==100000){
                                    const {avatorUrl,name} = res.data.kefuInfo
                                    if(name){
                                        context.state.serverChatEn.serverChatName = name
                                    }
                                    if(avatorUrl){
                                        context.state.serverChatEn.avatarUrl = avatorUrl
                                    }
                                    if(res.data.historyUserLists.length>0){
                                        res.data.historyUserLists.forEach(item=>{
                                            let clientChatName
                                            let user_type
                                            if(item.user_type==1){
                                                clientChatName = '玩家'
                                                user_type = 'sdk-user'
                                            }else if(item.user_type==2){
                                                clientChatName = '代理'
                                                user_type = 'cps-user'
                                            }else{
                                                clientChatName='游客'
                                                user_type = 'visitor'
                                            }
                                            context.dispatch('addClientChat', {
                                                isInit:true,
                                                newChatEn: {
                                                    ...item,
                                                    user_type,
                                                    clientChatName
                                                }
                                            });
                                        })
                                    }
                                }else{
                                    this.$message.error(res.message)
                                }
                            }
                        });
                        break
                    case 'say':
                        console.log('say',data);
                        break
                    case 'ask':
                        console.log('ask',data);
                        let clientChatName
                        if(data.user_type=='sdk-user'){
                            clientChatName = '玩家'
                        }else if(data.user_type=='cps-user'){
                            clientChatName = '代理'
                        }else{
                            clientChatName='游客'
                        }
                        context.dispatch('addClientChat', {
                            newChatEn: {
                                ...data,
                                clientChatName
                            }
                        });
                        break
                    case 'close':
                    for (var i = 0; i < context.state.currentChatEnlist.length; i++) {
                        var tmpEn = context.state.currentChatEnlist[i];
                        if (tmpEn.client_id == data.client_id) {
                            Vue.set(tmpEn, 'state', 'off');
                            break;
                        }
                    }      
                }
            }
        },

        /**
         * 服务端离线
         */
        // SERVER_OFF: function(context, payload) {
        //     context.state.socket.emit('SERVER_OFF', {
        //         serverChatEn: {
        //             serverChatId: context.state.serverChatEn.serverChatId,
        //             serverChatName: context.state.serverChatEn.serverChatName
        //         }
        //     });
        //     context.state.socket.close();
        //     context.state.socket = null;
        // },
        //服务端发送文件
        sendFile:function(context,eq){
            var file= eq.file
            file.append('auth_id', context.state.selectedChatEn.auth_id);
            file.append('client_id',  context.state.selectedChatEn.client_id);
            file.append('type',  context.state.selectedChatEn.type);
            file.append('user_type', context.state.selectedChatEn.user_type);
            file.append('kefu_id', context.state.selectedChatEn.kefu_id);
            file.append('zyim_id', context.state.selectedChatEn.zyim_id);
            file.append('msg', '');
            http.uploadFile({
            url: api.kefu_chat,
            params:file,
            successCallback: (rs) => {
                if(rs.code==100000){
                    var msg = {}
                    msg.role = 'server'
                    if(rs.data.msg_type=='2'){
                        msg.contentType = 'file'
                    }else if(rs.data.msg_type == '5'){
                        msg.contentType = 'image'
                    }else if(rs.data.msg_type=='3'){
                        msg.contentType = 'video'
                    }else if(rs.data.msg_type=='4'){
                        msg.contentType = 'sound'
                    }
                    msg.avatarUrl = 'static/image/im_client_avatar.png'
                    msg.fileUrl = rs.data.url
                    msg.state = 'success'
                    context.dispatch('addChatMsg', {
                        auth_id: context.state.selectedChatEn.auth_id,
                        msg: msg
                    });
                }
            }
        });
        },
        /**
         * 发送消息
         */
        sendMsg: function(context, { client_id, msg }) {
            http.post({
                url: api.kefu_chat,
                params:{
                    ...context.state.selectedChatEn,
                    // user_type: 'kefu-user',//cps/sdk/kefu/visitor
                    msg: msg.content,
                    msg_type: 1 //1文本2文件3视频4音频5其他
                },
                successCallback: (res) => {
                    if(res.code==100000){
                    }
                }
            });
        }
    },
    getters: {
        /*
        用户禁言状态列表
        */
        state_option:function(state){
            return state.state_option
        },
        /*
            用户禁言状态
        */
        user_cf:function(state){
            return state.user_info.user_cf
        },
          /**
         * 用户信息
         */
        user_info: function(state) {
            return state.user_info;
        },
        /**
         * 获取选中的会话对象
         */
        selectedChatEn: function(state) {
            return state.selectedChatEn;
        },

        /**
         * 当前会话集合
         */
        currentChatEnlist: function(state) {
            return state.currentChatEnlist;
        },

        /**
         * 选中的chat含有新消息
         */
        haveNewMsgDelegate: function(state) {
            return state.haveNewMsgDelegate;
        },

        /**
         * 客服chat信息
         */
        serverChatEn: function(state) {
            return state.serverChatEn;
        }
    }
});
