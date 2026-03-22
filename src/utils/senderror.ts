import { Context } from "hono";

export function sendError(
  c: Context,
  code: string,
  message: string,
  params: any[] = [],
  internalCode = 0,
  extra?: any,
  httpStatus = 400,
) {
  const payload = {
    errorCode: code,
    message,
    params,
    internalCode,
    extra,
  };
  return c.json(payload, httpStatus);
}

export default sendError;
