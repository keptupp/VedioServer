const express=require('express');
const https=require('https');
const fs=require('fs');
const app=express();
const PORT=3000;
const options={
    key:fs.readFileSync('./server.key'),
    cert:fs.readFileSync('./server.crt')
};

var server=https.createServer(options,app).listen(
    PORT,
    ()=>console.log('https协议已经打开')
);

app.get('/',function(req,res){
    console.log('跳转到webrtc.html')
    res.sendfile(__dirname + '/index_test.html')
});

//以下代码是websocket要用


var WebSocketServer = require('ws').Server,
wss = new WebSocketServer({server: server});


// 存储socket的数组，这里只能有2个socket，每次测试需要重启，否则会出错
var wsc = [],
index = 1;
 
// 有socket连入
wss.on('connection', function(ws) {
    console.log('connection');
 
    // 将socket存入数组
    wsc.push(ws);
 
    // 记下对方socket在数组中的下标，因为这个测试程序只允许2个socket
    // 所以第一个连入的socket存入0，第二个连入的就是存入1
    // otherIndex就反着来，第一个socket的otherIndex下标为1，第二个socket的otherIndex下标为0
    var otherIndex = index--,
    desc = null;
 
    if (otherIndex == 1) {
        desc = 'first socket';
    } else {
        desc = 'second socket';
    }
 
    // 转发收到的消息
    ws.on('message', function(message) {
        console.log('接收到的信息，去转发',message)
        var json = JSON.parse(message);
 
        wsc[otherIndex].send(message, function (error) {
            if (error) {
                console.log('Send message error (' + desc + '): ', error);
            }
        });
    });
});