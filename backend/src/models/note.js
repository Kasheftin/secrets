'use strict'
module.exports = (sequelize, DataTypes) => {
  const Note = sequelize.define('Note', {
    hash: DataTypes.STRING,
    encryptedContent: DataTypes.TEXT,
    expiresAt: DataTypes.DATE,
    remainingViews: {
      type: DataTypes.INTEGER,
      defaultValue: -1
    }
  }, {
    indexes: [
      { unique: true, fields: ['hash'] },
      { fields: ['expiresAt'] }
    ]
  })
  Note.associate = function (models) {
    // associations can be defined here
  }
  return Note
}
