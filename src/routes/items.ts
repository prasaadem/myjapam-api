import { Router, Request, Response, NextFunction } from "express";
import errors from "restify-errors";
import Item from "../models/item";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await Item.find();
    res.send(items);
  } catch (err: any) {
    next(new errors.InternalServerError(err.message));
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newItem = new Item(req.body);
    const savedItem = await newItem.save();
    res.send(savedItem);
  } catch (err: any) {
    next(new errors.BadRequestError(err.message));
  }
});

export default router;
