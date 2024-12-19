import { Product } from "@prisma/client";
import { createGlobalState } from ".";
import { useCallback } from "react";

type CartItem = {
  productId: string;
  quantity: number;
};

type ProductState = {
  cart: CartItem[];
  total: number;
};

const initialState: ProductState = {
  cart: [],
  total: 0,
};

export const useProductsState = createGlobalState<ProductState>(
  "products",
  initialState,
);

export const useCartOperations = () => {
  const { data, setData } = useProductsState();

  const calculateTotal = useCallback(
    (cart: CartItem[], products: Product[]) => {
      return cart.reduce((acc, item) => {
        const product = products.find((p) => p.id === item.productId);
        return acc + (product?.price || 0) * item.quantity;
      }, 0);
    },
    [],
  );

  const addToCart = useCallback(
    (productId: string, products: Product[]) => {
      const existingItem = data.cart.find(
        (item) => item.productId === productId,
      );

      const updatedCart = existingItem
        ? data.cart.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        : [...data.cart, { productId, quantity: 1 }];

      const newTotal = calculateTotal(updatedCart, products);
      setData({ cart: updatedCart, total: newTotal });
    },
    [data.cart, calculateTotal, setData],
  );

  const removeFromCart = useCallback(
    (productId: string, products: Product[]) => {
      const existingItem = data.cart.find(
        (item) => item.productId === productId,
      );

      if (!existingItem) return;

      const updatedCart =
        existingItem.quantity === 1
          ? data.cart.filter((item) => item.productId !== productId)
          : data.cart.map((item) =>
              item.productId === productId
                ? { ...item, quantity: item.quantity - 1 }
                : item,
            );

      const newTotal = calculateTotal(updatedCart, products);
      setData({ cart: updatedCart, total: newTotal });
    },
    [data.cart, calculateTotal, setData],
  );

  const clearCart = useCallback(() => {
    setData({ cart: [], total: 0 });
  }, [setData]);

  const getItemQuantity = useCallback(
    (productId: string) => {
      return (
        data.cart.find((item) => item.productId === productId)?.quantity || 0
      );
    },
    [data.cart],
  );

  return {
    addToCart,
    removeFromCart,
    clearCart,
    getItemQuantity,
    cartItems: data.cart,
    total: data.total,
  };
};
