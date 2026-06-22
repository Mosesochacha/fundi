'use strict';

/**
 * Worker CV/portfolio fields. Reuses existing Profile columns where possible
 * (bio = about, services, experience, education) + User.dailyRate, and adds the
 * structured columns the profile page needs.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Profiles', 'portfolio', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Portfolio photos: {id,url,caption,jobType,isBefore?,afterPhotoId?}',
    });
    await queryInterface.addColumn('Profiles', 'certifications', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Certifications: {id,name,issuingBody,yearIssued,expiryYear?,documentUrl?,isVerified}',
    });
    await queryInterface.addColumn('Profiles', 'serviceAreas', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Neighbourhoods/areas the worker serves',
    });
    await queryInterface.addColumn('Profiles', 'isAvailable', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Worker availability toggle',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Profiles', 'isAvailable');
    await queryInterface.removeColumn('Profiles', 'serviceAreas');
    await queryInterface.removeColumn('Profiles', 'certifications');
    await queryInterface.removeColumn('Profiles', 'portfolio');
  },
};
