import type { ServiceContext } from "../types.js";
import { RegisterService } from "./register.service.js";
import { LoginService } from "./login.service.js";

export class AuthServices {
  readonly register: RegisterService;
  readonly login: LoginService;

  constructor(ctx: ServiceContext) {
    this.register = new RegisterService(ctx.db);
    this.login = new LoginService(ctx.db, ctx.req, ctx.res);
  }
}
