type mongoose = typeof import("mongoose").default;
type Mongoose = InstanceType<mongoose["Mongoose"]>;

declare module global {
  let mongoose: {
    conn: null | Mongoose;
    promise: null | Promise<Mongoose>;
  };
}

namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL?: string;
    SESSION_EXPIRY?: `${number}`;
    REFRESH_TOKEN_EXPIRY?: `${number}`;
    JWT_SECRET?: string;
  }
}