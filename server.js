const path=require('path');
const http=require('http');
const express=require('express');
const app=express();
const server=http.createServer(app);
const socketio=require('socket.io');
const io=socketio(server);
const formatMessages=require('./messages.js');
const { userJoin, getCurrentUser, userLeaves, getRoomUsers } = require('./users.js')

const botname='TalkAtive Bot';
//set static folder
app.use(express.static(path.join(__dirname,'public')));



//run when client connects
io.on('connection',socket=>{
    
    socket.on('joinRoom',({ username , room})=>{
        
        const user = userJoin(socket.id,username,room);
        socket.join(user.room);
        //welcome current user
        socket.emit('message', formatMessages(botname,'welcome to Talk-A-Tive!'));
      
        //Broacast when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessages(botname,`${user.username} has joined the chat`));
        

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

      
     
    //listen for chatMessage
    socket.on('chatMessage',msg=>{
        const user=getCurrentUser(socket.id);

        io.to(user.room).emit('message',formatMessages(user.username,msg));
    });


    //runs when client disconnects
    socket.on('disconnect',()=>{

        const user=userLeaves(socket.id);
        if(user){
           io.to(user.room).emit('message',formatMessages(botname,`${user.username} has left the chat`));

            //send users and room info
            io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
            });
        }
    }) ;
    

});

const PORT=3000 || process.env.PORT;
server.listen(PORT,()=>{
    console.log(`server running on port ${PORT}`);
});