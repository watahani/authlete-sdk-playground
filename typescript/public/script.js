"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthInterceptor = void 0;
exports.get_client_config = get_client_config;
exports.get_service_config = get_service_config;
console.log("hello, from typescript playground for authlete api");
globalThis.XMLHttpRequest = require('xhr2');
var openapi_client_1 = require("@authlete/openapi-client");
//Get html elements
function get_client_config() {
    var apikey_el = document.getElementById('api-key');
    // service list const apiSecret = 'Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'; //(document.getElementById('apiSecret') as HTMLInputElement)?.value || process.env.API_SECRET;
    var apiSecret_el = document.getElementById('apiSecret');
    var apiVersion = 'v2'; //(document.getElementById('apiVersion') as HTMLInputElement)?.value || 'v1';
    var auth_token_el = document.getElementById('ser-apiToken');
    if (apikey_el && apiSecret_el && auth_token_el) {
        var apikey_1 = apikey_el.value;
        var apiSecret_1 = apiSecret_el.value;
        var auth_token = auth_token_el.value;
        console.log('Client Configuration:', apikey_1, apiSecret_1);
    }
    else {
        console.log('Client Configuration is missing');
    }
    client_req_send();
}
function get_service_config() {
    var apikey_el = document.getElementById('ser-api-key');
    // service list const apiSecret = 'Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'; //(document.getElementById('apiSecret') as HTMLInputElement)?.value || process.env.API_SECRET;
    var apiSecret_el = document.getElementById('ser-apiSecret');
    var auth_token_el = document.getElementById('ser-apiToken');
    var apiVersion = 'v2'; //(document.getElementById('apiVersion') as HTMLInputElement)?.value || 'v1';
    if (apikey_el && apiSecret_el && auth_token_el) {
        var apikey_2 = apikey_el.value;
        var apiSecret_2 = apiSecret_el.value;
        var auth_token = auth_token_el.value;
        console.log('SERVICE Configuration:', apikey_2, apiSecret_2);
    }
    else {
        console.log('Service Configuration is missing');
    }
    service_req_send();
}
var basePath = 'https://api.authlete.com'; //(document.getElementById('base-url') as HTMLInputElement)?.value || 'https://api.authlete.com';
// service api for service list const apikey = '19568184929257';//(document.getElementById('api-key') as HTMLInputElement)?.value || process.env.API_KEY;
var apikey = '353960042211339';
// service list const apiSecret = 'Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'; //(document.getElementById('apiSecret') as HTMLInputElement)?.value || process.env.API_SECRET;
var apiSecret = 'C4wvqbJYEq3g5ddbQP_0QsivDq-5FKqY_dvSg6rfoI0';
var apiVersion = 'v2'; //(document.getElementById('apiVersion') as HTMLInputElement)?.value || 'v1';
function getAuthToken() {
    return 'Xj_-CVjgplKvhu-TVogzbO05tbvXYJxFxwsxWbSjC00';
}
var AuthInterceptor = /** @class */ (function (_super) {
    __extends(AuthInterceptor, _super);
    function AuthInterceptor() {
        var middleware = [
            {
                pre: function (request) {
                    var token = getAuthToken();
                    console.log("TOKEN:", token);
                    var authToken = "".concat(apikey, ":").concat(apiSecret);
                    var authHeader = "Basic ".concat(Buffer.from(authToken).toString('base64'));
                    //console.log("Authorization Header:", authHeader);
                    return __assign(__assign({}, request), { headers: __assign(__assign({}, request.headers), { Authorization: authHeader, 'X-API-Key': apikey, 'X-API-Secret': apiSecret, 'X-API-Version': apiVersion }) });
                },
            },
        ];
        return _super.call(this, {
            basePath: basePath,
            middleware: middleware
        }) || this;
    }
    Object.defineProperty(AuthInterceptor, "Instance", {
        get: function () {
            return AuthInterceptor.config || (AuthInterceptor.config = new this());
        },
        enumerable: false,
        configurable: true
    });
    return AuthInterceptor;
}(openapi_client_1.Configuration));
exports.AuthInterceptor = AuthInterceptor;
var api = new openapi_client_1.ClientManagementApi(AuthInterceptor.Instance);
var new_api_service = new openapi_client_1.ServiceManagementApi(AuthInterceptor.Instance);
console.log(api);
console.log('Service:::', new_api_service);
/*new_api_service.serviceGetListApi({start: 0, end: 10}).subscribe({
  next: (res) => console.log('V2 Service List:', res),
  error: (err) => console.error('Error:', err)
});*/
api.clientGetListApi({ developer: 'kerin', start: 0, end: 10 }).subscribe({
    next: function (res) { return console.log('Client List:', res); },
    error: function (err) { return console.error('Error:', err); }
});
function service_req_send() {
    new_api_service.serviceGetListApi({ start: 0, end: 10 }).subscribe({
        next: function (res) { return console.log('V2 Service List:', res); },
        error: function (err) { return console.error('Error:', err); }
    });
}
function client_req_send() {
    if (api) {
        api.clientGetListApi({ developer: 'kerin', start: 0, end: 10 }).subscribe({
            next: function (res) { return console.log('Client List:', res); },
            error: function (err) { return console.error('Error:', err); }
        });
    }
    else {
        console.log("INVALID CLIENT API Configuration");
    }
}
// Expose it to global `window` so HTML can see it:
window.client_req_send = client_req_send;
window.get_client_config = get_client_config;
//curl -v https://api.authlete.com/api/service/get/list?start=0\&end=5 \
//-u '19568184929257:Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'
//curl -v https://api.authlete.com/api/service/get/353960042211339 \
