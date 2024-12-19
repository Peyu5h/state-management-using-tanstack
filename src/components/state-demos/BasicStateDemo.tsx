"use client";

import { createGlobalState } from "~/state";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useRouter } from "next/navigation";

export const useBasicState = createGlobalState("basicDemo", {
  count: 0,
  text: "Hello",
});

export function BasicStateDemo() {
  const { data, setData, resetData } = useBasicState();
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic State Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <div>Count: {data.count}</div>
          <div>Text: {data.text}</div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setData({ count: data.count + 1 })}>
            Increment
          </Button>
          <Button onClick={() => setData({ text: `Hello ${Date.now()}` })}>
            Update Text
          </Button>
          <Button variant="outline" onClick={resetData}>
            Reset
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => router.push("/page-2")}>Page2</Button>
      </CardFooter>
    </Card>
  );
}
