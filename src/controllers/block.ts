import { Request, Response } from "express";
const { Block } = require("../models/block");

export const createBlock = async (req: Request, res: Response) => {
  try {
    const { blocker_id, blocked_id } = req.body;
    if (!blocker_id || !blocked_id) {
      return res
        .status(400)
        .send("Both blocker_id and blocked_id are required.");
    }

    const block = new Block({
      blocker_id,
      blocked_id,
    });

    await block.save();
    res.status(201).send(block);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

export const getBlocksByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const blocks = await Block.find({ blocker_id: userId }).populate(
      "blocked_id"
    );
    res.status(200).send(blocks);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};

export const deleteBlock = async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params;
    const result = await Block.findByIdAndDelete(blockId);
    if (!result) {
      return res.status(404).send("Block not found.");
    }
    res.status(204).send();
  } catch (error: any) {
    res.status(500).send(error.message);
  }
};
