"use client";

import React from "react";
import { useBasicState } from "~/components/state-demos/BasicStateDemo";
import { Button } from "~/components/ui/button";

const Page2 = () => {
  const { data, setData, resetData } = useBasicState();

  return (
    <div>
      <h1>
        count: {data.count}
        <Button onClick={() => setData({ count: data.count + 1 })}>
          Increment
        </Button>
      </h1>
    </div>
  );
};

export default Page2;
