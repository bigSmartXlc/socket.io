import Vue from 'vue';
import axios from 'axios';
import ak from '@/common/ak.js';

var axiosInstance = axios.create({
    baseURL: 'http://admin-new.zyh5games.com',
    // baseURL: 'http://xlwys.zyh5games.com',
    timeout: 300000
});

axiosInstance.interceptors.request.use(
    function(config) {
        // Do something before request is sent
        return config;
    },
    function(error) {
        // Do something with request error
        return Promise.reject(error);
    }
);

/**
 * http请求响应处理函数
 */
var httpResponseHandle = function() {
    var self = this;
    if (self.res.code == 100000) {
        self.successCallback && self.successCallback(self.res);
    } else {
        self.failCallback && self.failCallback(self.res);
    }
};

var http = {
    /**
     * 以get方式请求获取JSON数据
     * @param {Object} opts 配置项，可包含以下成员:
     * @param {String} opts.url 请求地址
     * @param {Object} opts.params 附加的请求参数
     * @param {Function} opts.successCallback 成功接收内容时的回调函数
     */
    get: function(opts) {
        axiosInstance
            .get(opts.url, { params: opts.params })
            .then(function(res) {
                opts.res = res.data;
                httpResponseHandle.call(opts);
            })
            .catch(function(err) {
                ak.Msg.alert(err.message)
            });
    },

    /**
     * 以get方式请求获取JSON数据
     * @param {Object} opts 配置项，可包含以下成员:
     * @param {String} opts.url 请求地址
     * @param {Object} opts.params 附加的请求参数
     * @param {Function} opts.successCallback 成功接收内容时的回调函数
     */
    post: function(opts) {
        var options = {
            url: opts.url,
            method: 'post', // default
            data:opts.params,
        }
        if(opts.headers){
            options.headers =JSON.parse(JSON.stringify(opts.headers))  
        }
        axiosInstance(options)
            .then(function(res) {
                opts.res = res.data;
                httpResponseHandle.call(opts);
            })
            .catch(function(err) {
                // ak.Msg.alert(err.message)
            });
    },

    /**
     * 客户端上传文件
     * @param {Object} opts 配置项，可包含以下成员:
     * @param {String} opts.url 请求地址
     * @param {Object} opts.params 上传的参数
     * @param {Function} opts.successCallback 成功接收内容时的回调函数
     */
    uploadFile: function(opts) {
        axiosInstance
            .post(opts.url, opts.params, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            .then(function(res) {
                opts.res = res.data;
                httpResponseHandle.call(opts);
            })
            .catch(function() {});
    }
};

export default http;
