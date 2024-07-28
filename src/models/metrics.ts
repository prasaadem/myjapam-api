import mongoose, { Schema, Document } from "mongoose";

interface IMetrics extends Document {
  type: "admin" | "user";
  new_users?: number;
  tombstoned_users?: number;
  new_sessions?: number;
  new_events?: number;
  new_subscriptions?: number;
  new_logs?: number;
  user_id?: mongoose.Types.ObjectId;
  event_id?: mongoose.Types.ObjectId;
  log_count?: number;
  createdAt: Date;
  logs?: Array<any>;
}

const metricsSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ["admin", "user"],
    required: true,
  },
  new_users: {
    type: Number,
    validate: {
      validator: function (this: IMetrics) {
        return (
          this.type !== "admin" ||
          (this.type === "admin" && this.new_users !== undefined)
        );
      },
      message: "new_users is required for admin type",
    },
  },
  tombstoned_users: {
    type: Number,
    validate: {
      validator: function (this: IMetrics) {
        return (
          this.type !== "admin" ||
          (this.type === "admin" && this.tombstoned_users !== undefined)
        );
      },
      message: "tombstoned_users is required for admin type",
    },
  },
  new_sessions: {
    type: Number,
    validate: {
      validator: function (this: IMetrics) {
        return (
          this.type !== "admin" ||
          (this.type === "admin" && this.new_sessions !== undefined)
        );
      },
      message: "new_sessions is required for admin type",
    },
  },
  new_events: {
    type: Number,
    validate: {
      validator: function (this: IMetrics) {
        return (
          this.type !== "admin" ||
          (this.type === "admin" && this.new_events !== undefined)
        );
      },
      message: "new_events is required for admin type",
    },
  },
  new_subscriptions: {
    type: Number,
    validate: {
      validator: function (this: IMetrics) {
        return (
          this.type !== "admin" ||
          (this.type === "admin" && this.new_subscriptions !== undefined)
        );
      },
      message: "new_subscriptions is required for admin type",
    },
  },
  new_logs: {
    type: Number,
    validate: {
      validator: function (this: IMetrics) {
        return (
          this.type !== "admin" ||
          (this.type === "admin" && this.new_logs !== undefined)
        );
      },
      message: "new_logs is required for admin type",
    },
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    validate: {
      validator: function (this: IMetrics) {
        return (
          this.type !== "user" ||
          (this.type === "user" && this.user_id !== undefined)
        );
      },
      message: "user_id is required for user type",
    },
  },
  event_id: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    validate: {
      validator: function (this: IMetrics) {
        return (
          this.type !== "user" ||
          (this.type === "user" && this.event_id !== undefined)
        );
      },
      message: "event_id is required for user type",
    },
  },
  log_count: {
    type: Number,
    validate: {
      validator: function (this: IMetrics) {
        return (
          this.type !== "user" ||
          (this.type === "user" && this.log_count !== undefined)
        );
      },
      message: "log_count is required for user type",
    },
  },
  logs: [
    {
      type: mongoose.Schema.Types.Mixed, // or you can define a specific schema for logs
    },
  ],
  createdAt: {
    type: Date,
    required: true,
  },
});

const Metrics = mongoose.model<IMetrics>("Metrics", metricsSchema);
export default Metrics;
