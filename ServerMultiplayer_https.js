const express=require('express');
const https=require('https');
const fs=require('fs');
const url=require('url');//解析get请求的数据
const e = require('express');
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
    console.log('跳转到index.html')
    res.sendfile(__dirname + '/index_addTrack.html')
});

//以下代码是websocket要用


var WebSocketServer = require('ws').Server,
wss = new WebSocketServer({server: server});


//存储用户会话
var user={};
//存储用户列表
var userlist={ 
    "event": "_userlist",
    "data":[]
}

 
// 有socket连入
wss.on('connection', function(ws,req) {
    //获取连接时传入的id
    data=url.parse(req.url, true).query;
    var newuid=data.newuid;
    console.log('连接成功，用户：',newuid);
    //防止newid不是字符串
    newuid=newuid+""

    //检测是否有同uid的用户接入，有就断开该连接
    if(user[newuid]!=null){
        console.log("已经存在该用户了")
        ws.send(JSON.stringify({"event":"用户已存在"}),function(error){
            if(error){
                console.log("发送错误",error)
            }
        })
        //关闭连接
        ws.close()
    }else{
        //用户连接成功后，返回目前已连接用户名单
        ws.send(JSON.stringify(userlist),function(error){
            if(error){
                console.log("向新用户发送用户列表失败")
            }
        })

        user[newuid]=ws;//用键值对来存储不同用户的会话
        userlist["data"].push(newuid);//存储用户列表

        // 转发收到的消息
        ws.on('message', function(message) {
            
            var json = JSON.parse(message);

            //新加入的用户，就给其他全部用户发他的sdp
            if(json.event==="_offer"){
                console.log("接收到新用户",json.newuid,"给",json.uid,"发送的offer_sdp")
                //给json.uid的用户转发offer
                user[json.uid].send(message,function(error){
                    if(error){
                        console.log("转发offer失败",error)
                    }
                })
            }else if(json.event==="_answer"){//给新用户回复sdp，定向发送给新用户
                console.log(json.uid,"给新用户",json.newuid,"回复sdp")
                user[json.newuid].send(message,function(error){
                    if(error){
                        console.log("给新用户回复sdp错误")
                    }
                })
            }else if(json.event==="_ice_candidate"){
                for(var key in user){
                    if(key===json.toUid){//不发给自己
                        console.log(json.uid,"发送ice给",json.toUid)
                        user[key].send(message, function (error) {
                            if (error) {
                                console.log('Send message error (' + desc + '): ', error);
                            }
                        });
                    }
                }
            }   
        });


        ws.onclose=function(){
            //找到断开的用户
            var closeUid
            for(var key in user){
                if(user[key]===ws){
                    closeUid=key
                }
            }

            //通知其他用户把该用户的播放器删除
            for(var key in user){
                if(user[key]===ws){
                    console.log(key,"主动断开连接")
                    //删除对应的连接信息
                    delete user[key]
                    for(var i=0;i<userlist.data.length;i++){
                        if(userlist.data[i]===key){
                            console.log("删除",key,"的信息")
                            userlist.data.splice(i,1)
                        }
                    }
                }else{
                    //给其他人发送，删除key用户的视频框的信息
                    user[key].send(JSON.stringify({
                        "event":"_closeUser",
                        "uid":closeUid
                    }))
                }
            }
        }

    }

    
});