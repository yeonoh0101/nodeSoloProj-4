const express = require("express"); // express module을 가져와 express변수에 할당한다.
const cookieParser = require("cookie-parser"); // cookie-parser 모듈을 가져온다.
const postsRouter = require("./routes/post.js");
const userRouter = require("./routes/user.js");
const authRouter = require("./routes/auth.js");
const commentsRouter = require("./routes/comment.js");
const likesRouter = require("./routes/like.js");
const app = express();
const port = 3000;

app.use(express.json()); // express.json()을 사용하여 요청 본문을 JSON 형식으로 변환해준다.
app.use(cookieParser()); // cookieParser()를 미들웨어로 등록한다.
app.use("/", [
  userRouter,
  authRouter,
  postsRouter,
  commentsRouter,
  likesRouter,
]);

// 서버를 지정된 port로 열고, 서버가 열렸을 때 콘솔에 메시지를 출력한다.
app.listen(port, () => {
  console.log(port, "포트로 서버가 열렸다.");
});
