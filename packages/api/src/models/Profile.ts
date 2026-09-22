import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
} from "sequelize";
import type { Appearance } from "@nook/shared";
import { sequelize } from "../db/sequelize.js";

/**
 * A persisted player profile: durable identity (display name + chosen
 * appearance) that outlives any session. The realtime tier stays position-only
 * and client-authoritative; who a player *is* lives here.
 *
 * `appearance` is stored as JSONB using the same {@link Appearance} shape the
 * client composes a character from, so persistence and rendering can't drift.
 * The table/columns are created by the migration; this model just maps onto them
 * (`underscored` maps camelCase attributes to snake_case columns).
 */
export class Profile extends Model<
  InferAttributes<Profile>,
  InferCreationAttributes<Profile>
> {
  declare id: CreationOptional<string>;
  declare displayName: string;
  declare appearance: Appearance;
  declare readonly createdAt: CreationOptional<Date>;
  declare readonly updatedAt: CreationOptional<Date>;
}

Profile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    displayName: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    appearance: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize,
    tableName: "profiles",
    underscored: true,
  },
);
