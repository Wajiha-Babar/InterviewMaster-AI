import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";
import { sendError } from "../utils/apiResponse";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err.name === "MulterError") {
    return sendError(res, err.message.includes("File too large") ? "Resume file is too large. Please keep uploads under 10 MB." : "Resume upload failed. Please try a supported file.", 400);
  }
  const status = err instanceof HttpError ? err.status : "status" in err && typeof err.status === "number" ? err.status : 500;
  const isBodyParserError = status === 413 || err instanceof SyntaxError;
  if (isBodyParserError) {
    return sendError(res, status === 413 ? "Request body is too large." : "Request body must be valid JSON.", status === 413 ? 413 : 400);
  }
  const message = status === 500 ? "Something went wrong. Please try again." : err.message;
  if (status === 500) console.error(err);
  sendError(res, message, status);
}
