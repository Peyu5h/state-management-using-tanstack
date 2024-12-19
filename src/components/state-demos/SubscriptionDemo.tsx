"use client";

import { createGlobalState } from "~/state";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useEffect, useState, useRef } from "react";

interface SubState {
  value: number;
}

const useSubState = createGlobalState<SubState>("subscriptionDemo", {
  value: 0,
});

export function SubscriptionDemo() {
  const { data, setData, subscribe } = useSubState();
  const [updates, setUpdates] = useState<number[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Clean up previous subscription if it exists
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Set up new subscription
    unsubscribeRef.current = subscribe((state: SubState) => {
      setUpdates((prev) => {
        const newValue = state.value;
        if (prev[prev.length - 1] !== newValue) {
          return [...prev, newValue].slice(-5);
        }
        return prev;
      });
    });

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [subscribe]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>State Subscriptions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>Current Value: {data.value}</div>
        <div>
          Last 5 Updates:
          {updates.map((update, i) => (
            <span key={i} className="ml-2">
              {update}
            </span>
          ))}
        </div>
        <Button onClick={() => setData({ value: Math.random() })}>
          Update Value
        </Button>
      </CardContent>
    </Card>
  );
}
