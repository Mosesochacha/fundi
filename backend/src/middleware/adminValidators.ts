import { Request, Response, NextFunction } from "express";
import { body, param, validationResult, ValidationChain } from "express-validator";
import { sendError } from "../utils/helpers";
import { HTTP_STATUS } from "../utils/constants";

export const validate =
  (chains: ValidationChain[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(chains.map((c) => c.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const first = errors.array()[0];
      sendError(res, HTTP_STATUS.BAD_REQUEST, first.msg || "Invalid request");
      return;
    }
    next();
  };

const idParam = param("id").isUUID().withMessage("A valid resource id is required");
const optionalReason = body("reason")
  .optional({ nullable: true })
  .isString()
  .isLength({ max: 500 })
  .withMessage("reason must be a string up to 500 chars");

export const adminValidators = {
  suspend: validate([
    idParam,
    body("days").optional({ nullable: true }).isInt({ min: 1, max: 3650 }).withMessage("days must be 1–3650"),
    optionalReason,
  ]),
  ban: validate([idParam, optionalReason]),
  unsuspend: validate([idParam]),
  idOnly: validate([idParam]),
};
