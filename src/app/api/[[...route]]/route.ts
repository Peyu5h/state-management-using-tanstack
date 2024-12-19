import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import products from "./routes/products";
import chat from "./routes/chat";

const app = new Hono().basePath("/api");

app.use(
  "*",
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.get("/", (c) => {
  return c.json({
    message: "API is working",
  });
});

app.route("/products", products);
app.route("/chat", chat);

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
export const WebSocket = handle(app);
