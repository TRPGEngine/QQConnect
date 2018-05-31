module.exports = function OAuthQQ(orm, db) {
  let OAuthQQ = db.define('oauth_qq_access_info', {
    access_token: {type: 'text', required: true},
    expires_in: {type: 'integer', required: true},
    refresh_token: {type: 'text', required: true},
    openid: {type: 'text', required: true},
    createAt: {type: 'date', time: true},
    updateAt: {type: 'date', time: true},
  }, {
    hooks: {
      beforeCreate: function(next) {
        if (!this.createAt) {
  				this.createAt = new Date();
  			}
        if (!this.updateAt) {
  				this.updateAt = new Date();
  			}
  			return next();
      },
      beforeSave: function(next) {
				this.updateAt = new Date();
        return next();
      },
    },
    methods: {

    }
  });

  let User = db.models.player_user;
  if(!!User) {
    OAuthQQ.hasOne('relatedUser', User);
  }

  return OAuthQQ;
}
