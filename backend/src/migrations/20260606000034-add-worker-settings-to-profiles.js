'use strict';

/**
 * Worker settings (the /worker/settings page) need a few fields the older
 * profile-settings columns don't cover:
 *  - notificationSettings: job-request / message / review notification prefs + delivery channels (JSON)
 *  - availabilitySettings: emergency callouts, weekends, working hours, max distance (JSON)
 *  - showRate / showOnline / allowDirectMessages: privacy toggles with no existing column
 *
 * publicProfile, showPhone, appearInSearch and availability.available reuse the
 * existing profilePublic / showPhone / appearInSearch / isAvailable columns.
 * JSON columns are nullable; the controller merges them onto defaults.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Profiles', 'notificationSettings', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Worker notification preferences (job requests, messages, reviews, delivery channels)',
    });
    await queryInterface.addColumn('Profiles', 'availabilitySettings', {
      type: Sequelize.JSON,
      allowNull: true,
      comment: 'Worker availability detail (emergency callouts, weekends, working hours, max distance)',
    });
    await queryInterface.addColumn('Profiles', 'showRate', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'showOnline', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
    await queryInterface.addColumn('Profiles', 'allowDirectMessages', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Profiles', 'notificationSettings');
    await queryInterface.removeColumn('Profiles', 'availabilitySettings');
    await queryInterface.removeColumn('Profiles', 'showRate');
    await queryInterface.removeColumn('Profiles', 'showOnline');
    await queryInterface.removeColumn('Profiles', 'allowDirectMessages');
  },
};
