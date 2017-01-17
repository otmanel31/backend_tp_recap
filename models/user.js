'use strict';
module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('User', {
    login: DataTypes.STRING,
    password: {
      type: DataTypes.STRING,
      validate: {
        len: [7,15]
      }
    },
    email: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return User;
};
