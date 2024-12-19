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

interface CartState {
  items: CartItem[];
  orderHistory: { items: CartItem[]; total: number; date: string }[];
}

const PRODUCTS: Product[] = [
  { id: 1, name: "Laptop", price: 999 },
  { id: 2, name: "Headphones", price: 99 },
  { id: 3, name: "Mouse", price: 49 },
];

// Create global cart state with persistence
const useCartState = createGlobalState<CartState>(
  "shopping-cart",
  {
    items: [],
    orderHistory: [],
  },
  {
    persist: true,
    actions: {
      addToCart: (state: CartState, product: Product) => {
        const existingItem = state.items.find((item) => item.id === product.id);

        if (existingItem) {
          state.items = state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        } else {
          state.items.push({ ...product, quantity: 1 });
        }
      },
      removeFromCart: (state: CartState, productId: number) => {
        state.items = state.items.filter((item) => item.id !== productId);
      },
      placeOrder: (state: CartState) => {
        if (state.items.length === 0) return;
        state.orderHistory.push({
          items: [...state.items],
          total: state.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          ),
          date: new Date().toISOString(),
        });
        state.items = [];
      },
    } as const,
    middleware: [
      (state: CartState) => {
        console.log("Cart updated:", state);
      },
    ],
  },
);

// Create derived states
const useCartTotal = createDerivedState(useCartState, (state) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
);

const useItemCount = createDerivedState(useCartState, (state) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0),
);

export function ShoppingCartDemo() {
  const {
    data: cart,
    setData: setCart,
    subscribe,
    dispatch,
    setQueryData,
  } = useCartState();
  const total = useCartTotal();
  const itemCount = useItemCount();
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    const unsubscribe = subscribe((state) => {
      setLastUpdate(new Date().toLocaleTimeString());
    });
    return () => unsubscribe();
  }, [subscribe]);

  const addToCart = (product: Product) => {
    dispatch("addToCart", product);
  };

  const removeFromCart = (productId: number) => {
    dispatch("removeFromCart", productId);
  };

  const placeOrder = () => {
    dispatch("placeOrder");
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
              {cart.items.map((item) => (
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
              {cart.items.length > 0 && (
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
              {cart.orderHistory.map((order, index) => (
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

          {/* State Updates Info */}
          <div className="text-sm text-muted-foreground">
            Last Update: {lastUpdate}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
