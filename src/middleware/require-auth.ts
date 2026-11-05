
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  createRemoteJWKSet,
  jwtVerify,
} from "jose";

import { env } from "../config/env.js";

const jwksUrl = new URL(
  "/api/auth/jwks",
  env.AUTH_BASE_URL
);

const JWKS = createRemoteJWKSet(jwksUrl);

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {

  const authorization = req.header("authorization");


  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {

    const { payload } = await jwtVerify(match[1], JWKS, {
      issuer: env.AUTH_BASE_URL,
      audience: env.AUTH_BASE_URL,
    });


    const userId = payload.sub;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Invalid user identity",
      });
      return;
    }


    res.locals.authUserId = userId;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}
