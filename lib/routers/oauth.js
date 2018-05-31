const Router = require('koa-router');
const url = require('url');
const uuid = require('uuid/v1');
const config = require('../../config/config.json');

const GET_AUTH_CODE_URL = "https://graph.qq.com/oauth2.0/authorize";
const GET_ACCESS_TOKEN_URL = "https://graph.qq.com/oauth2.0/token";
const GET_OPENID_URL = "https://graph.qq.com/oauth2.0/me";
const GET_USER_INFO_URL = "https://graph.qq.com/user/get_user_info";

const router = new Router();

router.get('/login', (ctx, next) => {
  let state = Math.random();// 生成一个随机数作为state
  ctx.session.qqconnectState = state;

  let params = {
    response_type: 'code',
    client_id: config.appid,
    redirect_uri: encodeURI(ctx.request.origin + config.callback),
    state,
    scope: config.scope.join(',')
  }

  ctx.redirect(url.format({
    host: GET_AUTH_CODE_URL,
    query: params
  }));
})

router.get('/callback', async (ctx, next) => {
  const template = require('../views/callback.marko');
  let {code, state, usercancel} = ctx.query;

  if(usercancel) {
    // wap端用户取消登录
    ctx.body = '用户取消登录';
    return;
  }

  if(!code || !state) {
    ctx.body = '缺少信息, 请重试';
    return;
  }

  if(state !== ctx.session.qqconnectState) {
    ctx.body = '会话失效, 请重试';
    return;
  }

  // 获取access_token
  let accessData = await ctx.trpgapp.request.get(GET_ACCESS_TOKEN_URL, {
    grant_type: 'authorization_code',
    client_id: config.appid,
    client_secret: config.appkey,
    code,
    redirect_uri: encodeURI(ctx.request.origin + config.callback),
  });
  let {access_token, expires_in, refresh_token} = accessData;

  console.log('accessData', accessData);

  // 获取openid
  let meData = await ctx.trpgapp.request.get(GET_OPENID_URL, {access_token});
  let openid = meData.openid;
  console.log('meData', meData);

  // 获取用户信息
  let userData = await ctx.trpgapp.request.get(GET_OPENID_URL, {
    access_token,
    oauth_consumer_key: config.appid,
    openid,
  });
  let {
    gender,
    nickname,
    figureurl,
    figureurl_1,
    figureurl_2,
    figureurl_qq_1,
    figureurl_qq_2,
  } = userData;
  let avatar = figureurl_qq_2 || figureurl_qq_1;
  console.log('userData', userData);

  let res;
  let db = await ctx.trpgapp.storage.connectAsync();
  await db.transactionAsync(async () => {
    let record = await db.models.oauth_qq_access_info.oneAsync({openid});
    if(record) {
      // 用户已通过qq登录注册账号
      let player = await record.getRelatedUserAsync();
      res = {
        uuid: player.uuid,
        token: player.token
      }
    } else {
      // 用户未通过qq登录注册账号
      let newRecord = await db.models.oauth_qq_access_info.createAsync({
        access_token,
        expires_in,
        refresh_token,
        openid,
      });
      let internalId = 10000 + newRecord.id;
      let newPlayer = await ctx.trpgapp.player.createNewAsync('qq' + internalId, openid, {
        nickname,
        avatar,
        sex: gender,
        token: uuid(),
      });

      await newRecord.setRelatedUserAsync(newPlayer);
      res = {
        uuid: newPlayer.uuid,
        token: newPlayer.token
      }
    }
  });

  console.log('res data', res, ctx.query);
  ctx.render(template, res);
})

module.exports = router;
