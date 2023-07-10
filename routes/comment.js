const express = require("express"); // express module을 express 변수에 할당
const router = express.Router(); // express.Router()로 라우터 객체 생성
const authMiddleware = require("../middlewares/auth-middleware.js"); // 인증 미들웨어를 가져온다.
const { Posts, Comments } = require("../models");
const { Op } = require("sequelize"); // Sequelize에서 제공하는 Qp 객체를 가져온다.

// 사용자의 전체 댓글 조회 API
router.get("/posts/:postId/comments", async (req, res) => {
  try {
    const comments = await Comments.findAll({ order: [["createdAt", "desc"]] }); // Comments 모델에서 모든 댓글을 내림차순으로 정렬하여 조회한다.
    res.json({ data: comments }); // JSON 형식으로 모든 댓글을 응답한다.
  } catch (error) {
    res.status(404).json({ error: "댓글 조회에 실패하였습니다." }); // HTTP 상태 코드를 404로 알리고 errorMessage를 json형식으로 응답한다.
  }
});

// 댓글 추가 API
router.post("/posts/:postId/comments", authMiddleware, async (req, res) => {
  const { postId } = req.params; // req.params 객체에서 postId 값을 가져온다.
  const { content } = req.body; // 요청 body에서 content 값을 가져올 것이다.
  const { user } = res.locals; // 인증 미들웨어에서 가져온 사용자 정보를 사용한다.

  try {
    const existingComments = await Comments.findOne({ where: { postId } }); // 주어진 postId로 게시글을 조회한다.
    if (!content) {
      // content가 없을 경우
      return res.status(400).json({
        success: false,
        errorMessage: "댓글 내용을 입력해주세요.",
      }); // HTTP 상태 코드를 400으로 알리고 에러 메시지를 JSON 형식으로 응답한다.
    }

    const createdComments = await Comments.create({
      // Comments.create() 메소드를 사용하여 새로운 댓글을 생성한다.
      PostId: postId,
      UserId: user.userId,
      nickname: user.nickname,
      content,
      createdAt: new Date(), // new Date()를 사용하여 현재의 날짜와 시간으로 설정한다.
    });

    res.status(201).json({ comments: "댓글을 작성하였습니다." }); // HTTP 상태 코드를 201로 알리고 댓글 작성 성공 메세지를 JSON 형식으로 응답한다.
  } catch (error) {
    res.status(400).json({ error: "댓글 작성에 실패했습니다." });
  }
});

// 댓글 수정 API
router.patch(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    const { postId, commentId } = req.params; // req.params 객체에서 postId과 commentId 값을 가져온다.
    const { content } = req.body; // 요청 body에서 content 값을 가져올 것이다.
    const { user } = res.locals; // 인증 미들웨어에서 가져온 사용자 정보를 사용한다.

    try {
      // 게시글의 존재 여부를 확인한다.
      const post = await Posts.findOne({ where: { postId } });
      if (!post) {
        // 게시글이 존재하지 않는다면
        return res.status(404).json({ error: "게시글을 찾을 수 없습니다." }); // 404 상태 코드와 에러 메시지를 JSON 형식으로 응답한다.
      }

      // 댓글의 존재 여부를 확인한다.
      const existingComment = await Comments.findOne({ where: { commentId } });
      if (!existingComment) {
        return res.status(404).json({ error: "댓글이 존재하지 않습니다." });
      }

      // content가 없을 경우
      if (!content) {
        return res.status(400).json({
          success: false,
          errorMessage: "댓글 내용을 입력해주세요.",
        }); // HTTP 상태 코드를 400으로 알리고 에러 메시지를 JSON 형식으로 응답한다.
      }

      // 로그인 한 userId와 게시글 수정하려는 userId값이 같지 않다면
      if (user.userId !== existingComment.UserId) {
        return res.status(403).json({ error: "접근이 허용되지 않습니다." });
      }

      // commentId로 댓글 존재 여부 확인한다.
      const comments = await Comments.findOne({ where: { commentId } }); // commentId로 댓글 조회
      if (!comments) {
        // comments가 없을 경우
        return res.status(404).json({ error: "댓글이 존재하지 않습니다." }); // HTTP 상태 코드를 404로 알리고 json형태로 errorMessage를 받는다.
      }

      await comments.update({ content }); // content를 없데이트한다.
      res.status(200).json({ data: "댓글 수정에 성공했습니다." });
    } catch (error) {
      res.status(400).json({ error: "댓글 수정에 실패하였습니다." }); // 예외 처리를 하는데 HTTP 상태 코드를 404로 알리고 errorMessage를 json형태로 받는다.
    }
  }
);

// 댓글 삭제 API
router.delete(
  "/posts/:postId/comments/:commentId",
  authMiddleware,
  async (req, res) => {
    const { postId, commentId } = req.params; // req.params 객체에서 postId과 commentId 값을 가져온다.
    const { user } = res.locals; // 인증 미들웨어에서 가져온 사용자 정보를 사용한다.

    try {
      // 게시물의 존재 여부를 확인한다.
      const post = await Posts.findOne({ where: { postId } });
      if (!post) {
        return res.status(404).json({ error: "게시글을 찾을 수 없습니다." });
      }

      // 댓글의 존재 여부를 확인한다.
      const existingComment = await Comments.findOne({ where: { commentId } });
      if (!existingComment) {
        return res.status(404).json({ error: "댓글이 존재하지 않습니다." });
      }

      // 로그인한 사용자의 userId와 댓글 작성자의 userId가 다른 경우 400 상태 코드와 에러 메시지를 JSON 형식으로 응답한다.
      if (user.userId !== existingComment.UserId) {
        return res.status(400).json({ error: "접근이 허용되지 않습니다." });
      }

      // 댓글을 삭제한다.
      await Comments.destroy({
        where: {
          [Op.and]: [{ postId }, { commentId }], // commentId와 postId를 기준으로 삭제한다.
        },
      });

      res.status(200).json({ message: "댓글을 삭제하였습니다." });
    } catch (error) {
      res.status(400).json({ error: "댓글 삭제에 실패했습니다." });
    }
  }
);

module.exports = router; // router 객체를 모듈로 내보낸다.
