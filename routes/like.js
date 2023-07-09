const express = require("express"); // express module을 express 변수에 할당
const router = express.Router(); // express.Router()로 라우터 객체 생성
const authMiddleware = require("../middlewares/auth-middleware.js");
const { Users, Posts, Likes } = require("../models");

// 좋아요 추가, 취소 API
router.put("/posts/:postId/like", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { user } = res.locals;

  try {
    // 게시글 존재 여부 확인
    const post = await Posts.findOne({
      where: { postId },
      attributes: ["postId", "likes"],
    });
    if (!post) {
      return res.status(400).json({ error: "게시글이 존재하지 않습니다." });
    }

    const likes = await Likes.findOne({
      where: { UserId: user.userId, PostId: postId },
    });

    // 좋아요 추가
    if (!likes) {
      await Posts.update(
        { likes: post.likes + 1 },
        { where: { postId: post.postId } }
      );
      await Likes.create({ UserId: user.userId, PostId: postId });
      return res
        .status(200)
        .json({ message: "게시글의 좋아요를 등록하였습니다." });
    }

    // 좋아요 취소
    if (likes) {
      await Posts.update(
        { likes: post.likes - 1 },
        { where: { postId: post.postId } }
      );
      await Likes.destroy({ where: { UserId: user.userId, PostId: postId } });
      return res
        .status(200)
        .json({ message: "게시글의 좋아요를 취소하였습니다." });
    }
  } catch (error) {
    return res.status(400).json({ errorMessage: "오류가 발생하였습니다." });
  }
});

// 좋아요 게시글 조회 API
router.get("/likes/posts", authMiddleware, async (req, res) => {
  const { user } = res.locals;
  try {
    // 사용자가 좋아요한 게시물 ID 조회
    const likedPostIds = await Likes.findAll({
      where: { UserId: user.userId },
      attributes: ["PostId"],
    });

    // 사용자가 좋아요한 게시물을 조회
    const likedPosts = await Posts.findAll({
      where: { postId: likedPostIds.map((item) => item.PostId) },
      order: [["likes", "DESC"]],
      attributes: ["title", "likes", "createdAt"],
      include: [
        {
          model: Users,
          attributes: ["nickname"],
        },
      ],
    });

    res.status(200).json({ posts: likedPosts });
  } catch (error) {
    return res
      .status(400)
      .json({ errorMessage: "좋아요 게시글 조회에 실패하였습니다." });
  }
});

module.exports = router;
