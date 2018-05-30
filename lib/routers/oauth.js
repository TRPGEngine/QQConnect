const Router = require('koa-router');
const url = require('url');
const config = require('../../config/config.json');

const GET_AUTH_CODE_URL = "https://graph.qq.com/oauth2.0/authorize";
const GET_ACCESS_TOKEN_URL = "https://graph.qq.com/oauth2.0/token";
const GET_OPENID_URL = "https://graph.qq.com/oauth2.0/me";

const router = new Router();

router.get('/login', (ctx, next) => {
  let state = Math.random();// 生成一个随机数作为state
  ctx.session.qqconnectState = state;

  let params = {
    response_type: 'code',
    client_id: config.appid,
    redirect_uri: config.callback,
    state,
    scope: config.scope.join(',')
  }

  ctx.redirect(url.format({
    host: GET_AUTH_CODE_URL,
    query: params
  }));
})

module.exports = router;
