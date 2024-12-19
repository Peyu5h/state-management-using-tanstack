"use client";

import { createGlobalState } from "~/state";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { useState } from "react";

const usePersistentState = createGlobalState(
  "persistentDemo",
  {
    notes: [] as string[],
  },
  { persist: true },
);

export function PersistentStateDemo() {
  const { data, setData } = usePersistentState();
  const [newNote, setNewNote] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Persistent State (Survives Refresh)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
          />
          <Button
            onClick={() => {
              setData({ notes: [...data.notes, newNote] });
              setNewNote("");
            }}
          >
            Add Note
          </Button>
        </div>
        <div className="space-y-2">
          {data.notes.map((note, index) => (
            <div key={index} className="bg-secondary rounded p-2">
              {note}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
