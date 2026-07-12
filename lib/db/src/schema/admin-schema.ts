import { pgTable, text, timestamp, serial, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// جدول مستخدمي لوحة الإدارة
export const adminUsersTable = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// جدول الأجهزة الموثوقة
export const adminDevicesTable = pgTable("admin_devices", {
  id: serial("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  deviceName: text("device_name").notNull(),
  deviceType: text("device_type"),
  lastIp: text("last_ip"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// جدول الساعات الذكية
export const watchesTable = pgTable("watches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description"),
  descriptionAr: text("description_ar"),
  colorId: text("color_id").notNull().unique(),
  colorName: text("color_name").notNull(),
  colorHex: text("color_hex"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// جدول إعدادات الموقع
export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Schemas
export const insertAdminUserSchema = createInsertSchema(adminUsersTable).omit({ createdAt: true });
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsersTable.$inferSelect;

export const insertAdminDeviceSchema = createInsertSchema(adminDevicesTable).omit({ createdAt: true, lastUsedAt: true });
export type InsertAdminDevice = z.infer<typeof insertAdminDeviceSchema>;
export type AdminDevice = typeof adminDevicesTable.$inferSelect;

export const insertWatchSchema = createInsertSchema(watchesTable).omit({ createdAt: true, updatedAt: true });
export type InsertWatch = z.infer<typeof insertWatchSchema>;
export type Watch = typeof watchesTable.$inferSelect;

export const insertSiteSettingSchema = createInsertSchema(siteSettingsTable).omit({ updatedAt: true });
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type SiteSetting = typeof siteSettingsTable.$inferSelect;
