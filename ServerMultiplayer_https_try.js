const express=require('express');
const https=require('https');
const fs=require('fs');
const url=require('url');//解析get请求的数据
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
    res.sendfile(__dirname + '/index_try.html')
});

//以下代码是websocket要用


var WebSocketServer = require('ws').Server,
wss = new WebSocketServer({server: server});


wss.on('connection', function(ws,req) {
    var data=url.parse(req.url, true).query;
    var uid=data.newuid;
    console.log("新用户:",uid)
})