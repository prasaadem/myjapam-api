import { Document, Schema, model } from 'mongoose';

export interface ItemDocument extends Document {
  name: string;
}

const ItemSchema = new Schema<ItemDocument>({
  name: {
    type: String,
    required: true,
  },
});

const Item = model<ItemDocument>('Item', ItemSchema);

export default Item;
