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
  listClientsSchema,
  searchClientSchema,
} from "./clients.schema.js";

export type {
  CreateClientInput,
  ListClientsInput,
  SearchClientInput,
  GetClientByIdInput,
} from "./clients.schema.js";

// Order Exports

export {
  detalleItemSchema,
  anularOrderSchema,
  createOrderSchema,
  updateOrderSchema,
  changeOrderStatusSchema,
  assignTechnicianSchema,
  equipoSchema,
  estadoOrderEnum,
  getOrderByIdSchema,
  listOrdersSchema,
  tipoEquipoEnum,
} from "./order.schema.js";

export type {
  ListOrdersInput,
  GetOrderByIdInput,
  UpdateOrderInput,
  ChangeOrderStatusInput,
  AssignTechnicianInput,
  anularOrdenInput,
  EquipoBase,
  TipoEquipo,
  CreateOrderInput,
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
  GetPagoByIdInput,
} from "./payments.schema.js";
