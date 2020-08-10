require('@tensorflow/tfjs-node')
const toxicity = require('@tensorflow-models/toxicity');
const WebSocket = require('ws');
require('dotenv').config();
const threshold = 0.75;
let likedPosts = [];
let likedComments = [];


const config = [
  { auth: process.env.LEMMY_JWT1, username: process.env.LEMMY_USERNAME1, userId: process.env.LEMMY_USERID1 },
  //{ auth: process.env.LEMMY_JWT2, username: process.env.LEMMY_USERNAME2, userId: process.env.LEMMY_USERID2 },
  //{ auth: process.env.LEMMY_JWT3, username: process.env.LEMMY_USERNAME3, userId: process.env.LEMMY_USERID3 },
  //{ auth: process.env.LEMMY_JWT4, username: process.env.LEMMY_USERNAME4, userId: process.env.LEMMY_USERID4 },
  //{ auth: process.env.LEMMY_JWT5, username: process.env.LEMMY_USERNAME5, userId: process.env.LEMMY_USERID5 },
  //{ auth: process.env.LEMMY_JWT6, username: process.env.LEMMY_USERNAME6, userId: process.env.LEMMY_USERID6 },
  //{ auth: process.env.LEMMY_JWT7, username: process.env.LEMMY_USERNAME7, userId: process.env.LEMMY_USERID7 },
  //{ auth: process.env.LEMMY_JWT9, username: process.env.LEMMY_USERNAME9, userId: process.env.LEMMY_USERID8 }
  //{ auth: process.env.LEMMY_JWT10, username: process.env.LEMMY_USERNAME10, userId: process.env.LEMMY_USERID10 },
  //{ auth: process.env.LEMMY_JWT11, username: process.env.LEMMY_USERNAME11, userId: process.env.LEMMY_USERID11 },
  //{ auth: process.env.LEMMY_JWT12, username: process.env.LEMMY_USERNAME12, userId: process.env.LEMMY_USERID12 },
  //{ auth: process.env.LEMMY_JWT13, username: process.env.LEMMY_USERNAME13, userId: process.env.LEMMY_USERID13 },
  //{ auth: process.env.LEMMY_JWT14, username: process.env.LEMMY_USERNAME14, userId: process.env.LEMMY_USERID14 },
  //{ auth: process.env.LEMMY_JWT15, username: process.env.LEMMY_USERNAME15, userId: process.env.LEMMY_USERID15 },
  //{ auth: process.env.LEMMY_JWT16, username: process.env.LEMMY_USERNAME16, userId: process.env.LEMMY_USERID16 },
  //{ auth: process.env.LEMMY_JWT17, username: process.env.LEMMY_USERNAME17, userId: process.env.LEMMY_USERID17 },
  //{ auth: process.env.LEMMY_JWT18, username: process.env.LEMMY_USERNAME18, userId: process.env.LEMMY_USERID18 },
  //{ auth: process.env.LEMMY_JWT19, username: process.env.LEMMY_USERNAME19, userId: process.env.LEMMY_USERID19 },
  //{ auth: process.env.LEMMY_JWT20, username: process.env.LEMMY_USERNAME20, userId: process.env.LEMMY_USERID20 },
  //{ auth: process.env.LEMMY_JWT21, username: process.env.LEMMY_USERNAME21, userId: process.env.LEMMY_USERID21 },
  //{ auth: process.env.LEMMY_JWT22, username: process.env.LEMMY_USERNAME22, userId: process.env.LEMMY_USERID22 },
  //{ auth: process.env.LEMMY_JWT23, username: process.env.LEMMY_USERNAME23, userId: process.env.LEMMY_USERID23 },
  //{ auth: process.env.LEMMY_JWT24, username: process.env.LEMMY_USERNAME24, userId: process.env.LEMMY_USERID24 },
  //{ auth: process.env.LEMMY_JWT25, username: process.env.LEMMY_USERNAME25, userId: process.env.LEMMY_USERID25 },
  //{ auth: process.env.LEMMY_JWT26, username: process.env.LEMMY_USERNAME26, userId: process.env.LEMMY_USERID26 }
];

//STORES COMMENT DATA
const COMMENT_CACHE_LENGTH = 250;
const commentCache = [];
const commentCacheIndex = {};
const commentCachePush = (commentId) => {
  if (commentCacheGet(commentId)) {
    // Skip posts that are already cached
    return;
  }
  if (commentCache.length >= COMMENT_CACHE_LENGTH) {
    // must remove oldest entry
    const oldCommentId = commentCache.shift();
    delete commentCacheIndex[oldCommentId];
  }
  commentCache.push(commentId);
  commentCacheIndex[commentId] = true;
};
const commentCacheGet = (commentId) => {
  return commentCacheIndex[commentId];
}

//STORES POST DATA
const POST_CACHE_LENGTH = 250;
const postCache = [];
const postCacheIndex = {};
const postCachePush = (postId) => {
  if (postCacheGet(postId)) {
    // Skip posts that are already cached
    return;
  }
  if (postCache.length >= POST_CACHE_LENGTH) {
    // must remove oldest entry
    const oldPostId = postCache.shift();
    delete postCacheIndex[oldPostId];
  }
  postCache.push(postId);
  postCacheIndex[postId] = true;
};
const postCacheGet = (postId) => {
  return postCacheIndex[postId];
}

const parsePostToxicity = async (name, body) => {
  console.log(`Analyzing post for toxicity.\n`)
  var sentences = [name];
  if(body !== null) sentences.push(body)
  return toxicity.load(threshold).then(model => {
    return model.classify(sentences).then(predictions => {
      return predictions.findIndex(prediction => prediction.results[0].match === true);
    }).catch(console.error);
  }).catch(console.error);
}

const parseCommentToxicity =  (content) => {
  console.log(`Analyzing comment for toxicity.\n`)
  var sentences = [content];
  return toxicity.load(threshold).then(model => {
    return model.classify(sentences).then(predictions => {
      return predictions.findIndex(prediction => prediction.results[0].match === true);
    }).catch(console.error);
  }).catch(console.error);
}

const getContent = () => {
  console.log(`Liked ${likedComments.length} comments: ${likedComments}`);
  console.log(`Liked ${likedPosts.length} posts: ${likedPosts}\n`);
  return Promise.all([getComments(), getPosts()])
};

const getComments = () => {
  ws.send(JSON.stringify({
    op: 'GetComments',
    data: {
      limit: 20,
      page: 1,
      sort: 'New',
      type_: "All"
    }
  }));
}

const getPosts = () => {
  ws.send(JSON.stringify({
    op: 'GetPosts',
    data: {
      limit: 20,
      page: 1,
      sort: 'New',
      type_: "All"
    }
  }));
}

const likePost = (postId) => {
  likedPosts.push(postId);
  //console.log('Liking Post\n');
  //let users = await getRandom(5)
  config.map(user => {
    ws.send(JSON.stringify({
      op: 'CreatePostLike',
      data: {
        post_id: postId,
        score: 1,
        auth: user.auth
      }
    }));
  })
};

const likeComment = (commentId, postId) => {
  likedComments.push(commentId);
  //console.log('Liking Comment\n');
  //let users = await getRandom(5)
  config.map(user => {
    ws.send(JSON.stringify({
      op: 'CreateCommentLike',
      data: {
        comment_id: commentId,
        post_id: postId,
        score: 1,
        auth: user.auth
      }
    }));
  })
};

const handlePosts = async (data) => {
  const posts = data.posts
  for(i=0; i<posts.length; i++){
    //console.log(posts[i].name)
    if (!postCacheGet(posts[i].id)) {
      postCachePush(posts[i].id);
      let result = await parsePostToxicity(posts[i].name, posts[i].body)
      //console.log(result)
      if(result !== -1){
        //console.log(posts[i])
        console.log(`Post is toxic: ${posts[i].id}\n`)
        likePost(posts[i].id);
      } else{
        //console.log(posts[i])
        console.log(`Post is not toxic.\n`);
      }
      //console.log(`${posts[i].id}\t|\t${posts[i].name}\n`);
    }
  }
}

const handleComments = async (data) => {
  const comments = data.comments
  for(i=0; i<comments.length; i++){
    if (!commentCacheGet(comments[i].id)) {
      commentCachePush(comments[i].id);
      let result = await parseCommentToxicity(comments[i].content)
      //console.log(result)
      if(result !== -1){
        //console.log(comments[i])
        console.log(`Comment is toxic: ${comments[i].id}\n`)
        likeComment(comments[i].id, comments[i].post_id);;
      } else {
        //console.log(comments[i])
        console.log(`Comment is not toxic.\n`);
      }
      //console.log(`${comments[i].id}\t|\t${comments[i].content}\n`);
    }
  }
}

const handlePostLike = (data) => {
  if (data.post.my_vote === 1) {
    console.log(`Account: ${data.post.user_id}, liked post #${data.post.id}\n`);
  }
};

const handleCommentLike = (data) => {
  if (data.comment.my_vote === 1) {
    console.log(`Account: ${data.comment.user_id}, liked comment #${data.comment.id}\n`);
  }
};

const handleSavePost = (data) => {
  console.log(JSON.stringify(data, null, 2));
};

const handleSaveComment = (data) => {
  console.log(JSON.stringify(data, null, 2));
};

const getUserDetails = () => {
  ws.send(JSON.stringify({
    op: 'GetUserDetails',
    data: {
      username: config.username,
      sort: 'New',
      saved_only: false,
      auth: config.auth
    }
  }));
}

const host = 'www.chapo.chat';
var ws = new WebSocket('wss://' + host + '/api/v1/ws');
ws.on('open', () => {
  console.log('Connection succeed!');
  ws.on('message', (msg) => {
    try {
      const res = JSON.parse(msg);
      //console.log(res)
      switch (res.op) {
        case 'GetPosts': {
          return handlePosts(res.data);
        }
        case 'GetComments': {
          return handleComments(res.data);
        }
        case 'CreatePostLike': {
          return handlePostLike(res.data);
        }
        case 'CreateCommentLike': {
          return handleCommentLike(res.data);
        }
        default: {
          break;
        }
      }
    } catch (e) {
        console.error(e);
    }
  });
  getContent();
  setInterval(() => {
    getContent();
  }, 180000)
});