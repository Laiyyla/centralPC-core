// Auth Exports
export { registerSchema, loginSchema } from "./auth.schema.js";
export type { RegisterInput, LoginInput } from "./auth.schema.js";

// Catalog Exports

export {
  createComboSchema,
  createItemSchema,
  getByIdSchema,
  listItemsSchema,
  toggleActiveSchema,
  updateItemSchema,
  itemTypeEnum,
} from "./catalog.schema.js";

export type {
  CreateComboInput,
  CreateItemInput,
  GetByIdInput,
  ListItemsInput,
  ToggleActiveInput,
  UpdateItemInput,
} from "./catalog.schema.js";

// Clients Exports

export {
  createClientSchema,
  getClientByIdSchema,
  searchClientSchema,
} from "./clients.schema.js";

export type { CreateClientInput, SearchClientInput } from "./clients.schema.js";

// Order Exports

export {
  detalleItemSchema,
  anularOrderSchema,
  createOrderSchema,
  equipoSchema,
  estadoOrderEnum,
  getOrderByIdSchema,
  listOrdersSchema,
  tipoEquipoEnum,
} from "./order.schema.js";

export type {
  ListOrdersInput,
  GetOrderByIdInput,
  anularOrdenInput,
} from "./order.schema.js";

// Payments Exports

export {
  createPaymentSchema,
  anularPagoSchema,
  getPagoByIdSchema,
  metodoPagoEnum,
} from "./payments.schema.js";

export type {
  CreatePaymentInput,
  AnularPagoInput,
  GetPagoById,
} from "./payments.schema.js";
