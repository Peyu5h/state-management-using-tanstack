"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { BasicStateDemo } from "~/components/state-demos/BasicStateDemo";
import { PersistentStateDemo } from "~/components/state-demos/PersistentStateDemo";
import { DerivedStateDemo } from "~/components/state-demos/DerivedStateDemo";
import { SubscriptionDemo } from "~/components/state-demos/SubscriptionDemo";
import { ShoppingCartDemo } from "~/components/ShoppingCartDemo";
import { TaskManager } from "~/components/TaskManagerDemo";

export default function Home() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-8">
      <ShoppingCartDemo />
      <TaskManager/>
    </div>
  );
}
