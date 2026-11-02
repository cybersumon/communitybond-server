
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

/**
 * Require Authentication Middleware
 *
 * PURPOSE:
 * Protect Express API routes using
 * Better Auth's signed JWT access tokens.
 *
 * SECURITY:
 * Verify token signature, issuer,
 * audience and expiration time.
 */

// Better Auth's public key endpoint.
const jwksUrl = new URL(
  "/api/auth/jwks",
  env.AUTH_BASE_URL
);

// Create one reusable JWKS resolver.
const JWKS = createRemoteJWKSet(jwksUrl);

/**
 * Check whether a request is authenticated.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Read the Authorization header.
  const authorization = req.header("authorization");

  // Required format: Bearer <JWT>
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    // Cryptographically verify the token.
    const { payload } = await jwtVerify(match[1], JWKS, {
      issuer: env.AUTH_BASE_URL,
      audience: env.AUTH_BASE_URL,
    });

    // Better Auth sets the subject to the user ID.
    const userId = payload.sub;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Invalid user identity",
      });
      return;
    }

    // Use only the verified user ID.
    res.locals.authUserId = userId;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}
