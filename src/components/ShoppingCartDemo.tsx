"use client";

import { createGlobalState, createDerivedState } from "~/state";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  price: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  items: CartItem[];
  total: number;
  date: string;
}

interface CartState {
  items: CartItem[];
  orderHistory: Order[];
}

const PRODUCTS: Product[] = [
  { id: 1, name: "Laptop", price: 999 },
  { id: 2, name: "Headphones", price: 99 },
  { id: 3, name: "Mouse", price: 49 },
];

const useCartStore = createGlobalState<CartState>(
  "cart",
  {
    items: [],
    orderHistory: [],
  },
  // {
  //   persist: true,
  // },
);

//derived states
const useCartTotal = createDerivedState<CartState, number>(
  useCartStore,
  (state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
);

const useCartCount = createDerivedState<CartState, number>(
  useCartStore,
  (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
);

export function ShoppingCartDemo() {
  const { data, setState } = useCartStore();
  const total = useCartTotal();
  const itemCount = useCartCount();

  const addToCart = (product: Product) => {
    setState((state) => {
      const existing = state.items.find((item) => item.id === product.id);
      if (existing) {
        existing.quantity++;
      } else {
        state.items.push({ ...product, quantity: 1 });
      }
    });
  };

  const removeFromCart = (productId: number) => {
    setState((state) => {
      state.items = state.items.filter((item) => item.id !== productId);
    });
  };

  const placeOrder = () => {
    setState((state) => {
      if (state.items.length === 0) return;

      state.orderHistory.push({
        items: [...state.items],
        total,
        date: new Date().toISOString(),
      });
      state.items = [];
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shopping Cart Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Products Section */}
          <div>
            <h3 className="mb-2 text-lg font-semibold">Available Products</h3>
            <div className="grid grid-cols-3 gap-4">
              {PRODUCTS.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-4">
                    <div>{product.name}</div>
                    <div>${product.price}</div>
                    <Button className="mt-2" onClick={() => addToCart(product)}>
                      Add to Cart
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div>
            <h3 className="mb-2 text-lg font-semibold">
              Cart ({itemCount} items)
            </h3>
            <div className="space-y-2">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded bg-secondary p-2"
                >
                  <span>
                    {item.name} (x{item.quantity})
                  </span>
                  <div className="space-x-2">
                    <span>${item.price * item.quantity}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {data.items.length > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="font-bold">Total: ${total}</span>
                  <Button onClick={placeOrder}>Place Order</Button>
                </div>
              )}
            </div>
          </div>

          {/* Order History */}
          <div>
            <h3 className="mb-2 text-lg font-semibold">Order History</h3>
            <div className="space-y-2">
              {data.orderHistory.map((order, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div>Date: {new Date(order.date).toLocaleDateString()}</div>
                    <div>Total: ${order.total}</div>
                    <div>Items: {order.items.length}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
