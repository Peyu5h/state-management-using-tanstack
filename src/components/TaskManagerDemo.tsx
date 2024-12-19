import { useState } from "react";
import { createGlobalState, createDerivedState } from "~/state/index";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: string;
  tags: string[];
}

interface TaskFilter {
  priority: string | null;
  searchTerm: string;
  showCompleted: boolean;
}

interface TaskState {
  tasks: Task[];
  filter: TaskFilter;
}

const useTaskStore = createGlobalState<TaskState>("tasks", {
  tasks: [],
  filter: {
    priority: null,
    searchTerm: "",
    showCompleted: true,
  },
});

const useFilteredTasks = createDerivedState<TaskState, Task[]>(
  useTaskStore,
  (state) =>
    state.tasks.filter((task) => {
      const matchesPriority =
        !state.filter.priority || task.priority === state.filter.priority;
      const matchesSearch = task.title
        .toLowerCase()
        .includes(state.filter.searchTerm.toLowerCase());
      const matchesCompleted = state.filter.showCompleted || !task.completed;
      return matchesPriority && matchesSearch && matchesCompleted;
    }),
);

interface TaskStats {
  total: number;
  completed: number;
  highPriority: number;
}

const useTaskStats = createDerivedState<TaskState, TaskStats>(
  useTaskStore,
  (state) => ({
    total: state.tasks.length,
    completed: state.tasks.filter((t) => t.completed).length,
    highPriority: state.tasks.filter((t) => t.priority === "high").length,
  }),
);

export function TaskManager() {
  const { data, setState } = useTaskStore();
  const filteredTasks = useFilteredTasks();
  const stats = useTaskStats();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] =
    useState<Task["priority"]>("medium");
  const [newTag, setNewTag] = useState("");

  const addTask = (title: string, priority: Task["priority"]) => {
    setState((state) => {
      state.tasks.push({
        id: crypto.randomUUID(),
        title,
        priority,
        completed: false,
        createdAt: new Date().toISOString(),
        tags: [],
      });
    });
  };

  const toggleTask = (taskId: string) => {
    setState((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) task.completed = !task.completed;
    });
  };

  const updateFilter = (filter: Partial<TaskFilter>) => {
    setState((state) => {
      Object.assign(state.filter, filter);
    });
  };

  const addTag = (taskId: string, tag: string) => {
    setState((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (task) task.tags.push(tag);
    });
  };

  const deleteTask = (taskId: string) => {
    setState((state) => {
      state.tasks = state.tasks.filter((t) => t.id !== taskId);
    });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    addTask(newTaskTitle, newTaskPriority);

    setNewTaskTitle("");
  };

  return (
    <div className="my-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Task Manager</CardTitle>
          <CardDescription>
            Manage your tasks and track your progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Task Creation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Create New Task</h3>
            <div className="flex gap-4">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title..."
                className="flex-1"
              />
              <Select
                value={newTaskPriority}
                onValueChange={(value: Task["priority"]) =>
                  setNewTaskPriority(value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddTask}>Add Task</Button>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Filters</h3>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Search tasks..."
                value={data.filter.searchTerm}
                onChange={(e) => updateFilter({ searchTerm: e.target.value })}
                className="flex-1"
              />
              <Select
                value={data.filter.priority || "all"}
                onValueChange={(value) =>
                  updateFilter({ priority: value === "all" ? null : value })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-completed"
                  checked={data.filter.showCompleted}
                  onCheckedChange={(checked) =>
                    updateFilter({ showCompleted: !!checked })
                  }
                />
                <Label htmlFor="show-completed">Show Completed</Label>
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Tasks ({filteredTasks.length})
            </h3>
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <Card
                  key={task.id}
                  className={task.completed ? "bg-muted" : ""}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex flex-1 items-center gap-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <span
                        className={
                          task.completed
                            ? "text-muted-foreground line-through"
                            : ""
                        }
                      >
                        {task.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          task.priority === "high"
                            ? "destructive"
                            : task.priority === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {task.priority}
                      </Badge>
                      <div className="flex gap-2">
                        {task.tags.map((tag, i) => (
                          <Badge key={i} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add tag..."
                          className="w-24"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (newTag.trim()) {
                              addTag(task.id, newTag.trim());
                              setNewTag("");
                            }
                          }}
                        >
                          Add Tag
                        </Button>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {stats.completed}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-red-600">
                  {stats.highPriority}
                </div>
                <div className="text-sm text-muted-foreground">
                  High Priority
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
