const jwt = require("jsonwebtoken");
const { Users } = require("../models");

// 이 미들웨어 함수는 인증기능을 담당한다.
// 클라이언트로부터 받은 쿠키의 Authorization 값을 확인하여 인증을 수행한뒤,
// 인증에 성공한 경우 다음 미들웨어로 넘기고, 실패시 에러 응답을 전송한다.
module.exports = async (req, res, next) => {
  const { Authorization } = req.cookies;

  // Authorization 쿠키가 존재하지 않을 경우를 대비해, authType과 authToken을 추출한다.
  // Authorization이 undefined 또는 null인 경우를 처리하기 위해 null 병합 연산자(??)를 사용한다.
  const [authType, authToken] = (Authorization ?? "").split(" ");

  if (authType !== "Bearer" || !authToken) {
    // authType이 "Bearer"인지 확인하고, authToken의 존재 여부를 검증한다.
    res.status(400).send({
      errorMessage: "로그인 후에 이용할 수 있는 기능입니다.",
    });
    return;
  }

  // jwt 검증
  try {
    const decodedToken = jwt.verify(authToken, "customized-secret-key"); // authToken의 유효성을 검증하고 authToken이 만료되었는지 확인하고 authToken이 서버에서 발급된 유효한 토큰인지 검증한다.

    const user = await Users.findOne({
      where: { userId: decodedToken.userId },
    }); // 검증된 authToken의 userId에 해당하는 사용자가 실제 DB에 존재하는지 확인한다.
    res.locals.user = user;

    next(); // 다음 미들웨어로 넘어간다.
  } catch (error) {
    console.error(error);
    res
      .status(400)
      .send({ errorMessage: "로그인 후에 이용할 수 있는 기능입니다." });
    return;
  }
};
