import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./verifyJWT";
import { HTTP_STATUS } from "../utils/constants";
import { sendError } from "../utils/helpers";

const requireAccountType = (...allowed: Array<"worker" | "employer">) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const accountType = req.user?.accountType;
    if (!accountType || !allowed.includes(accountType)) {
      sendError(
        res,
        HTTP_STATUS.FORBIDDEN,
        "This action isn't available for your account type.",
        { errorType: "WRONG_ACCOUNT_TYPE" }
      );
      return;
    }
    next();
  };
};

export default requireAccountType;
