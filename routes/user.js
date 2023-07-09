const express = require("express"); // express 모듈을 가져온다.
const router = express.Router(); // router 객체를 생성한다.
const authMiddleware = require("../middlewares/auth-middleware.js"); // 미들웨어를 가져온다.
const { Users } = require("../models");

// 내 정보 조회 API
router.get("/signup/me", authMiddleware, async (req, res) => {
  // "/signup/me"로 요청이 들어오면 인증 미들웨어 authMiddleware를 실행한다.
  const { nickname } = res.locals.user; // 사용자의 정보를 res.locals.user에서 nickname만 가져와 아래 형식으로 응답을 한다.

  res.status(200).json({
    user: {
      nickname: nickname,
    },
  });
});

// 회원가입 API
router.post("/signup", async (req, res) => {
  // "/signup" 주소로 post 요청이 들어오면 회원가입 처리를 할 것이다.
  const { nickname, password, confirmPassword } = req.body; // 요청 body에서 nickname, password, confirmPassword 값을 가져올 것이다.

  // password, confirmpassword 값 확인
  if (password !== confirmPassword) {
    // password와 confirmPassword 값이 일치하지 않으면
    res.status(412).json({
      // 에러 메세지를 보낸다.
      error: "비밀번호가 일치하지 않습니다.",
    });
    return;
  }

  // 닉네임은 최소 3자 이상, 알파벳 대소문자(a~z, A~Z), 숫자(0~9)로 구성 확인
  if (!nickname.match(/^[a-zA-Z0-9]{3,50}$/)) {
    // 위 조건에서 벗어나면
    res.status(412).json({
      // 에러 메세지를 보낸다.
      error: "닉네임은 영어와 숫자만 포함한 3자리 이상의 문자로 입력해주세요.",
    });
    return;
  }

  // 닉네임과 비밀번호가 같은 경우 회원가입 실패
  if (nickname === password) {
    // 위 조건에서 벗어나면
    res.status(412).json({
      // 에러 메세지를 보낸다.
      error: "닉네임과 비밀번호는 같을 수 없습니다.",
    });
    return;
  }

  // 비밀번호가 4글자 이하인 경우
  if (password.length < 4) {
    // 위 조건에서 벗어나면
    res.status(412).json({ error: "비밀번호는 4자리 이상 입력해주세요." }); // 에러 메세지를 보낸다.
    return;
  }

  // nickname이 실제로 DB에 존재하는지 확인
  const isExisUser = await Users.findOne({
    where: { nickname },
  });
  if (isExisUser) {
    // 이미 사용중이라면 에러 메세지를 보낸다.
    res.status(412).json({
      errorMessage: "닉네임이 이미 사용중입니다.",
    });
    return;
  }

  await Users.create({ nickname, password });

  return res.status(201).json({ message: "회원 가입에 성공하였습니다." }); // 회원가입 성공시 응답 메세지
});

module.exports = router; // router객체를 모듈로 내보낸다
