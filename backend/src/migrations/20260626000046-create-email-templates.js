"use strict";

/** Transactional email templates, keyed by a stable string id. */
const TEMPLATES = [
  { id: "welcome_worker", name: "Welcome email (worker)", subject: "Welcome to Tesilix, {{name}}!", body: "Hi {{name}},\n\nWelcome to Tesilix — set up your profile to start getting hired.\n\n— The Tesilix team" },
  { id: "welcome_employer", name: "Welcome email (employer)", subject: "Welcome to Tesilix", body: "Hi {{name}},\n\nFind trusted fundis near you. Post your first job today.\n\n— The Tesilix team" },
  { id: "verify_otp", name: "Email verification OTP", subject: "Your Tesilix verification code", body: "Your verification code is {{otp}}. It expires in 10 minutes." },
  { id: "job_request", name: "Job request received", subject: "New job request from {{employer}}", body: "Hi {{name}},\n\nYou have a new job request: {{jobTitle}}." },
  { id: "job_accepted", name: "Job accepted", subject: "{{worker}} accepted your job", body: "Good news — {{worker}} accepted your request for {{jobTitle}}." },
  { id: "job_completed", name: "Job completed", subject: "Job completed — leave a review", body: "Your job {{jobTitle}} is complete. Please leave a review." },
  { id: "review_received", name: "Review received", subject: "You received a new review", body: "Hi {{name}}, {{reviewer}} left you a {{rating}}-star review." },
  { id: "account_suspended", name: "Account suspended", subject: "Your Tesilix account has been suspended", body: "Hi {{name}},\n\nYour account has been suspended. Reason: {{reason}}." },
  { id: "id_approved", name: "ID verification approved", subject: "You're verified on Tesilix", body: "Congratulations {{name}}, your ID has been verified." },
  { id: "id_rejected", name: "ID verification rejected", subject: "Action needed: resubmit your ID", body: "Hi {{name}},\n\nWe couldn't verify your ID. Reason: {{reason}}. Please resubmit." },
  { id: "password_reset", name: "Password reset", subject: "Reset your Tesilix password", body: "Click the link to reset your password: {{link}}" },
];

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("EmailTemplates", {
      id: { type: Sequelize.STRING(60), primaryKey: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      subject: { type: Sequelize.STRING(300), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    const now = new Date();
    await queryInterface.bulkInsert(
      "EmailTemplates",
      TEMPLATES.map((t) => ({ ...t, createdAt: now, updatedAt: now })),
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("EmailTemplates");
  },
};
