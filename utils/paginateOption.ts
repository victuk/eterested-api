import { Response, NextFunction } from 'express';
import { CustomRequest } from "../middleware/authenticatedUsersOnly";


const pageAndLimit = (req:CustomRequest, res: Response, next: NextFunction) => {
    let page = !req.params.page ? "1" : req.params.page;
    let limit = !req.params.limit ? "10" : req.params.limit;
    req.paginatePageAndLimit = {page, limit}
    next();
}

export {pageAndLimit};
