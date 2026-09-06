import { relations } from "drizzle-orm";
import { branchTable } from "./branches.js";
import { usersTable } from "./users.js";
import { clientTable } from "./clients.js";
import { catalogTable } from "./catalog.js";
import { combo_components } from "./combo_components.js";
import { orderTable } from "./orders.js";
import { deviceTable } from "./devices.js";
import { orderDetailTable } from "./order_details.js";
import { paymentTable } from "./payments.js";

export const branchRelations = relations(branchTable, ({ many }) => ({
  orders: many(orderTable),
}));

export const usersRelations = relations(usersTable, ({ many }) => ({
  orders: many(orderTable),
  anulledOrders: many(orderTable, { relationName: "order_user_anul" }),
  anulledPayments: many(paymentTable, { relationName: "payment_user_anul" }),
}));

export const clientRelations = relations(clientTable, ({ many }) => ({
  orders: many(orderTable),
}));

export const catalogRelations = relations(catalogTable, ({ many }) => ({
  comboComponents: many(combo_components, { relationName: "parent_combo" }),
  componentOf: many(combo_components, { relationName: "child_component" }),
  orderDetails: many(orderDetailTable),
}));

export const comboComponentsRelations = relations(combo_components, ({ one }) => ({
  combo: one(catalogTable, {
    fields: [combo_components.combo_id],
    references: [catalogTable.id],
    relationName: "parent_combo",
  }),
  component: one(catalogTable, {
    fields: [combo_components.comp_id],
    references: [catalogTable.id],
    relationName: "child_component",
  }),
}));

export const orderRelations = relations(orderTable, ({ one, many }) => ({
  branch: one(branchTable, {
    fields: [orderTable.sucursal_id],
    references: [branchTable.id],
  }),
  client: one(clientTable, {
    fields: [orderTable.cliente_id],
    references: [clientTable.id],
  }),
  user: one(usersTable, {
    fields: [orderTable.user_id],
    references: [usersTable.id],
  }),
  userAnul: one(usersTable, {
    fields: [orderTable.user_anul],
    references: [usersTable.id],
    relationName: "order_user_anul",
  }),
  devices: many(deviceTable),
  details: many(orderDetailTable),
  payments: many(paymentTable),
}));

export const deviceRelations = relations(deviceTable, ({ one, many }) => ({
  order: one(orderTable, {
    fields: [deviceTable.order_id],
    references: [orderTable.id],
  }),
  orderDetails: many(orderDetailTable),
}));

export const orderDetailRelations = relations(orderDetailTable, ({ one }) => ({
  order: one(orderTable, {
    fields: [orderDetailTable.order_id],
    references: [orderTable.id],
  }),
  device: one(deviceTable, {
    fields: [orderDetailTable.equipo_id],
    references: [deviceTable.id],
  }),
  item: one(catalogTable, {
    fields: [orderDetailTable.item_id],
    references: [catalogTable.id],
  }),
}));

export const paymentRelations = relations(paymentTable, ({ one }) => ({
  order: one(orderTable, {
    fields: [paymentTable.order_id],
    references: [orderTable.id],
  }),
  userAnulacion: one(usersTable, {
    fields: [paymentTable.usuario_anulacion_id],
    references: [usersTable.id],
    relationName: "payment_user_anul",
  }),
}));
