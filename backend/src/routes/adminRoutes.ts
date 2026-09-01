import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from 'express';

import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/config.js';
import { AppError } from '../types/index.js';

import {
  getAuth0User,
  listAuth0Users,
} from '../services/auth0ManagementService.js';

const router = Router();

function requireOwner(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.auth?.userId) {
      throw new AppError(
        'Authentication required.',
        401
      );
    }

    if (!config.atlasOwnerUserId) {
      throw new AppError(
        'Atlas owner account is not configured.',
        500
      );
    }

    if (
      req.auth.userId !==
      config.atlasOwnerUserId
    ) {
      throw new AppError(
        'Owner access required.',
        403
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

router.use(
  requireAuth,
  requireOwner
);

router.get(
  '/users',
  async (
    req,
    res,
    next
  ) => {
    try {
      const page =
        Number.parseInt(
          String(
            req.query.page ??
              '0'
          ),
          10
        ) || 0;

      const perPage =
        Number.parseInt(
          String(
            req.query.perPage ??
              '50'
          ),
          10
        ) || 50;

      const search =
        typeof req.query.search ===
        'string'
          ? req.query.search
          : '';

      const result =
        await listAuth0Users(
          page,
          perPage,
          search
        );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/users/:userId',
  async (
    req,
    res,
    next
  ) => {
    try {
      const user =
        await getAuth0User(
          req.params.userId
        );

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
