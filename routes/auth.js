const express = require("express"); // express 모듈을 가져온다.
const router = express.Router(); // router 객체를 생성한다.
const jwt = require("jsonwebtoken"); // jsonwebtoken 모듈을 가져온다.
const { Users } = require("../models");

// 로그인 API
router.post("/login", async (req, res) => {
  const { nickname, password } = req.body; // 클라이언트에서 nickname과 password를 받는다.

  const user = await Users.findOne({ where: { nickname } }); // 받은 닉네임에 해당하는 유저를 데이터베이스에서 찾는다.

  if (!user || password !== user.password) {
    // 유저를 찾았는지 여부와 패스워드 일치여부를 검사하여 error 처리를 한다.
    res.status(412).json({
      error: "닉네임 또는 패스워드를 확인해주세요.",
    });
    return;
  }

  const token = jwt.sign({ userId: user.userId }, "customized-secret-key"); // JWT를 생성하여 토큰 변수에 할당한다. payload에는 유저의 userId 담는다.
  res.cookie("Authorization", `Bearer ${token}`); // HTTP 응답 헤더에 쿠키를 설정한다. Authorization 헤더에 생성한 토큰 Bearer 스키마와 함께 설정한다.
  res.status(200).json({ token }); // HTTP 응답 코드를 200으로 설정하고 JSON 형식으로 토큰을 담은 객체를 응답한다.
});

module.exports = router; // router객체를 모듈로 내보낸다
