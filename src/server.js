import http from "http";
import {Server} from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

//이 줄은 Express 모듈을 가져옵니다. Express는 Node.js를 위한 빠르고 간단한 웹 프레임워크입니다.
// import WebSocket from "ws"; // WebSocket 패키지 가져오기
const app = express();
//Express 애플리케이션 인스턴스를 생성합니다. 이 인스턴스는 서버의 여러 설정을 정의하고, 요청에 대한 핸들러를 등록하며, 서버를 실행하는 데 사용

app.set("view engine", "pug");
// pug는 템플릿 엔진으로, HTML을 보다 간결하게 작성할 수 있게 해줍
app.set("views", __dirname + "/views");
// 여기서는 현재 디렉토리의 views 폴더를 뷰 파일들이 위치하는 디렉토리로



app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));

app.get("/*", (req, res) => res.redirect("/"));
// home으로 돌아오게함


const handleListen = () => console.log('Listening on http://localhost:3000');
//서버가 시작되었을 때 호출될 콜백 함수를 정의

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(wsServer, {
  auth: false,
});



function publicRooms() {
  const {
      sockets: {
          adapter: { sids, rooms },
      },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
      if (sids.get(key) === undefined) {
          publicRooms.push(key);
      }
  });
  return publicRooms;
}


wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";
  socket.onAny((event) => {
      
      console.log(`Socket Event: ${event}`);
  });

  socket.on("enter_room", (roomName, done) => {
    console.log(socket.id);     
      socket.join(roomName);
      done();
      socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
      wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {
      socket.rooms.forEach((room) => 
        socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1));
  });  
  
  socket.on("disconnect", () => {
      wsServer.sockets.emit("room_change", publicRooms());
  });


  function countRoom(roomName) {
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

  
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
    socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});


// function handleConnection(socket) {
//     console.log(socket);
// }

function onSocketClose() {
  console.log("Disconnected from the Browser ❌");
}

// function onSocketMessage(message) {
//   console.log(message.toString('utf8'))
// }
// //Add .toString()

// const sockets = [];

// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "Anon";
//   console.log("Connected to Browser ✅");
//   socket.on("close", onSocketClose);
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg);
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) => 
//           aSocket.send(`${socket.nickname}: ${message.payload}`));
//       case "nickname":
//         socket["nickname"] = message.payload;
//     }           
// });
// });




httpServer.listen(3000, handleListen);

// {
//   type:"message";
//   payload:"hello everyone!";
//   }
//   {
//   type:"nickname";
//   payload:"hey";
//   }