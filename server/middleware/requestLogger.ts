import { NextFunction, Request, Response } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const started = Date.now();
  res.on("finish", () => {
    const safePath = req.path.includes("/cv") ? "/api/cv/*" : req.path;
    console.log(`${req.method} ${safePath} ${res.statusCode} ${Date.now() - started}ms`);
  });
  next();
}
