const express = require("express"); // express module을 express 변수에 할당
const router = express.Router(); // express.Router()로 라우터 객체 생성
const authMiddleware = require("../middlewares/auth-middleware.js"); // "../middlewares/auth-middleware.js" 파일에서 인증 미들웨어를 가져온다.
const { Users, Posts } = require("../models");
const { Op } = require("sequelize");

// 전체 게시글 조회 API
router.get("/posts", async (req, res) => {
  try {
    const posts = await Posts.findAll({
      order: [["createdAt", "desc"]],
      include: [
        {
          model: Users,
          attributes: ["nickname"],
          as: "User",
        },
      ],
    });

    const allPosts = posts.map((post) => ({
      postId: post.postId,
      UserId: post.UserId,
      nickname: post.User.nickname,
      title: post.title,
      content: post.content,
      likes: post.likes,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    res.json({ data: allPosts });
  } catch (error) {
    res.status(400).json({ error: "게시글 조회에 실패했습니다." });
  }
});

// 게시글 작성 API
router.post("/posts", authMiddleware, async (req, res) => {
  // "/posts" 경로에 대한 POST 요청을 보낸다.
  const { title, content } = req.body;
  const { user } = res.locals;
  try {
    const createdPosts = await Posts.create({
      // Posts.create() 메소드를 사용하여 새로운 게시글 생성한다.
      UserId: user.userId,
      title,
      content,
    });

    res.status(201).json({ posts: "게시글 작성에 성공하였습니다." });
  } catch (error) {
    res.status(400).json({ error: "게시글 작성에 실패했습니다." });
  }
});

// 게시글 상세 조회 API
router.get("/posts/:postId", async (req, res) => {
  // "/posts/:_id" 경로에 대한 GET 요청을 보낸다.
  const { postId } = req.params;

  try {
    const post = await Posts.findOne({
      where: { postId },
      include: [
        {
          model: Users,
          attributes: ["nickname"],
          as: "User",
        },
      ],
    }); // _id에 해당하는 게시물을 조회한다

    const onePost = {
      postId: post.postId,
      UserId: post.UserId,
      nickname: post.User.nickname,
      title: post.title,
      content: post.content,
      likes: post.likes,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };

    if (!post) {
      // 게시글이 없는경우
      return res
        .status(400)
        .json({ error: "해당하는 게시글을 찾을 수 없습니다." });
    } // HTTP 상태 코드를 404로 알리고 json형태로 errorMessage를 받는다.
    res.json({ data: onePost }); // 조회된 게시물을 JSON 형식으로 응답해준다
  } catch (error) {
    res.status(400).json({ error: "게시글 조회에 실패했습니다." });
  } // 오류가 발생한다면 json형식으로 error메세지를 보여준다.
});

// 게시글 수정 API
router.patch("/posts/:postId", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { title, content } = req.body;
  const { user } = res.locals;
  try {
    // title, content가 존재하고 비어있는지 확인합니다.
    if (title) {
      if (title.length === 0) {
        return res.status(400).json({
          success: false,
          error: "비어있는 게시물을 허용하지 않습니다.",
        });
      }
    }
    if (content) {
      if (content.length === 0) {
        return res.status(400).json({
          success: false,
          error: "비어있는 게시물을 허용하지 않습니다.",
        });
      }
    }
    // postId를 기준으로 해당하는 게시물의 존재 여부를 확인합니다.
    const post = await Posts.findOne({ where: { postId } });
    if (!post) {
      // 게시물이 존재하지 않을 경우 에러 응답을 보냅니다.
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }
    // 사용자 본인이 작성한 게시물인지 검사합니다.
    if (user.userId !== post.UserId) {
      return res.status(400).json({ error: "접근이 허용되지 않습니다." });
    }
    // 게시물을 업데이트합니다.
    if (title) {
      await post.update({ title });
    }
    if (content) {
      await post.update({ content });
    }
    // 확인 메시지를 응답합니다.
    res.json({ message: "게시물 수정에 성공했습니다." });
  } catch (error) {
    // 오류가 발생한 경우 오류 메시지를 응답합니다.
    res.status(500).json({ error: "게시물 수정에 실패했습니다." });
  }
});

// 게시글 삭제 API
router.delete("/posts/:postId", authMiddleware, async (req, res) => {
  const { postId } = req.params;
  const { user } = res.locals;

  try {
    const posts = await Posts.findOne({ where: { postId } }); // postId에 해당하는 게시물을 조회
    if (!posts) {
      return res.status(404).json({ error: "게시글이 존재하지 않습니다." }); // 게시물이 없는 경우 오류메세지를 보여준다.
    }
    if (posts.UserId !== user.userId) {
      return res
        .status(403)
        .json({ error: "게시글의 삭제 권한이 존재하지 않습니다." });
    }
    await Posts.destroy({
      where: {
        [Op.and]: [{ postId: posts.postId }, { UserId: posts.UserId }],
      },
    });
    res.status(200).json({ data: "게시글을 삭제하였습니다." }); // 완료시 보여주는 메세지
  } catch (err) {
    res.status(401).json({ error: "게시글이 정상적으로 삭제되지 않았습니다." }); // 오류시 보여주는 메세지
  }
});

module.exports = router; // router객체를 모듈로 내보낸다
