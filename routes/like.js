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
      where: { postId }, // postId 조건으로 사용하여 Posts 모델에서 해당 게시물을 찾는다.
      attributes: ["postId", "likes"], // 조회된 게시물의 postId와 likes 속성만 가져온다.
    });

    // 게시글 존재 여부 혹인
    if (!post) {
      return res.status(400).json({ error: "게시글이 존재하지 않습니다." });
    }

    const likes = await Likes.findOne({
      where: { UserId: user.userId, PostId: postId }, // user.userId와 postId를 조건으로 사용하여 Likes 모델에서 해당하는 좋아요를 찾는다.
    });

    // 좋아요 추가
    if (!likes) {
      // 좋아요가 없다면
      await Posts.update(
        { likes: post.likes + 1 }, // Posts 모델에서 좋아요 수를 + 1 한다.
        { where: { postId: post.postId } } // postId를 사용하여 없데이트한다.
      );
      await Likes.create({ UserId: user.userId, PostId: postId }); // user.userId와 postId를 사용하여 좋아요를 생성한다.
      return res
        .status(200)
        .json({ message: "게시글의 좋아요를 등록하였습니다." });
    }

    // 좋아요 취소
    if (likes) {
      // 좋아요가 있다면
      await Posts.update(
        { likes: post.likes - 1 }, // Posts 모델에서 좋아요 수를 - 1 한다.
        { where: { postId: post.postId } } // postId를 사용하여 없데이트한다.
      );
      await Likes.destroy({ where: { UserId: user.userId, PostId: postId } }); // user.userId와 postId를 사용하여 좋아요를 삭제한다.
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
    // 사용자가 좋아요한 게시물 Id 조회
    const likedPostIds = await Likes.findAll({
      // Likes 모델에서
      where: { UserId: user.userId }, // UserId가 현재 사용자의 userId와 일치하는 PostId를 찾는다.
      attributes: ["PostId"], // 조회 결과에서는 PostId만 선택한다.
    });

    // 사용자가 좋아요한 게시물을 조회
    const likedPosts = await Posts.findAll({
      // Posts 모델에서
      where: { postId: likedPostIds.map((item) => item.PostId) }, // postId가 사용자가 좋아요한 게시물의 PostId와 일치하는 게시물을 찾는다.
      order: [["likes", "DESC"]], // likes 속성을 기준으로 내림차순으로 정렬한다.
      include: [
        {
          model: Users, // Users 모델과의 관계를 설정한다
          attributes: ["nickname"], // 작성자의 nickname을 가져온다
          as: "User",
        },
      ],
    });

    // 조회된 좋아요한 게시물 목록을 변환
    const allLikesPosts = likedPosts.map((post) => ({
      // 각 게시물의 nickname, title, likes, createdAt을 선택하여 객체로 변환한다.
      nickname: post.User.nickname,
      title: post.title,
      likes: post.likes,
      createdAt: post.createdAt,
    }));

    res.status(200).json({ posts: allLikesPosts });
  } catch (error) {
    return res
      .status(400)
      .json({ errorMessage: "좋아요 게시글 조회에 실패하였습니다." });
  }
});

module.exports = router; // router 객체를 모듈로 내보낸다.
