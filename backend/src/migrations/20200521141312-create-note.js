'use strict'
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()
    try {
      await queryInterface.createTable('Notes', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        hash: {
          type: Sequelize.STRING
        },
        encryptedContent: {
          type: Sequelize.TEXT
        },
        expiresAt: {
          type: Sequelize.DATE
        },
        remainingViews: {
          type: Sequelize.INTEGER,
          defaultValue: -1
        },
        isEncryptedOnTheClient: {
          type: Sequelize.BOOLEAN,
          defaultValue: 0
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }, { transaction })
      await queryInterface.addIndex('Notes', { fields: ['hash'], unique: true }, { transaction })
      await queryInterface.addIndex('Notes', { fields: ['expiresAt'] }, { transaction })
      await transaction.commit()
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Notes')
  }
}
