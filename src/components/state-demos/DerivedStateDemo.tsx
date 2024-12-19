"use client";

import { createGlobalState, createDerivedState } from "~/state";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface CartItem {
  id: number;
  price: number;
}

interface CartState {
  items: CartItem[];
}

const useCartState = createGlobalState<CartState>("cartDemo", {
  items: [],
});

const useCartTotal = createDerivedState(useCartState, (state: CartState) =>
  state.items.reduce((sum: number, item: CartItem) => sum + item.price, 0),
);

export function DerivedStateDemo() {
  const { data: cart, setData: setCart } = useCartState();
  const total = useCartTotal();

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      price: Math.floor(Math.random() * 100) + 1,
    };
    setCart({ items: [...cart.items, newItem] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Derived State (Auto-calculated Total)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>Total: ${total}</div>
        <div className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.id} className="rounded bg-secondary p-2">
              Item: ${item.price}
            </div>
          ))}
        </div>
        <Button onClick={addItem}>Add Random Item</Button>
      </CardContent>
    </Card>
  );
}
