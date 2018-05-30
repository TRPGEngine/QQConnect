const debug = require('debug')('trpg:component:qqconnect');
const Router = require('koa-router');
const serve = require('koa-static');

module.exports = function QQConnectComponent(app) {
  initWebService.call(app);
  initRouters.call(app);

  return {
    name: 'QQConnectComponent',
  }
}

function initWebService() {
  const app = this;
  const webservice = app.webservice;
  if(app.get('env') === 'development') {
    webservice.use(serve(__dirname + '/public'));
    // 用于清理view相关缓存的require缓存
    webservice.use(async (ctx, next) => {
      let reqModules = Object.keys(require.cache);
      let viewModules = reqModules.filter((item) => /.*\/QQConnect\/lib\/views\//.test(item));
      for (let modulePath of viewModules) {
        delete require.cache[modulePath];
      }
      await next();
    })
  }else {
    webservice.use(serve(__dirname + '/public', {maxage: 1000 * 60 * 60 * 24}));
  }
}

function initRouters() {
  const app = this;
  const webservice = app.webservice;
  const router = new Router();

  const oauth = require('./routers/oauth');

  router.use('/qq/oauth', oauth.routes());
  webservice.use(router.routes());
}
