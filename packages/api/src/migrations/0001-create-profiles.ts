import type { Migration } from "../db/migrator.js";

/**
 * The `profiles` table: the persisted half of a player — a display name and
 * their chosen appearance. `appearance` is JSONB mirroring `@nook/shared`'s
 * Appearance, so persistence and the client's character rendering share one
 * shape. Columns are snake_cased to match the model's `underscored` mapping.
 */
export const up: Migration = async ({ context: { queryInterface, Sequelize } }) => {
  await queryInterface.createTable("profiles", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    display_name: {
      type: Sequelize.STRING(32),
      allowNull: false,
    },
    appearance: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });
};

export const down: Migration = async ({ context: { queryInterface } }) => {
  await queryInterface.dropTable("profiles");
};
