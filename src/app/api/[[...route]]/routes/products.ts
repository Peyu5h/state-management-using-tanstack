import { Hono } from "hono";
import { prisma } from "~/lib/prisma";
import { success, err, validationErr } from "../utils/response";
import { productSchema } from "../schemas/product.schema";

const products = new Hono();

products.get("/", async (c) => {
  try {
    const products = await prisma.product.findMany();
    return c.json(success(products));
  } catch (error) {
    return c.json(err("Failed to fetch products"), 500);
  }
});

products.post("/add", async (c) => {
  try {
    const { name, price } = await c.req.json();
    const result = productSchema.safeParse({ name, price });
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }
    const product = await prisma.product.create({ data: { name, price } });
    if (!product) {
      return c.json(err("Failed to add product"), 500);
    }
    return c.json(success(product));
  } catch (error) {
    return c.json(err("Failed to add product"), 500);
  }
});

export default products;
