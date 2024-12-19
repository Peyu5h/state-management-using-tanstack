import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  tags: string[];
}


export interface TaskFilter {
  priority: string | null;
  searchTerm: string;
  showCompleted: boolean;
}


export interface TaskState {
  tasks: Task[];
  filter: TaskFilter;
}

const STORAGE_KEY = 'task-manager-state';

const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },
};

const initialState: TaskState = {
  tasks: [],
  filter: {
    priority: null,
    searchTerm: '',
    showCompleted: true,
  },
};

export const useTaskStore = () => {
  const queryClient = useQueryClient();

  // Main state query
  const { data: state = initialState, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => storage.get(STORAGE_KEY, initialState),
    staleTime: Infinity,
  });

  // Mutations
  const mutate = useMutation({
    mutationFn: async (newState: TaskState) => {
      storage.set(STORAGE_KEY, newState);
      return newState;
    },
    onSuccess: (newState) => {
      queryClient.setQueryData(['tasks'], newState);
    },
  });

  // Actions
  const actions = {
    addTask: (task: Omit<Task, 'id' | 'createdAt'>) => {
      const newState = produce(state, draft => {
        draft.tasks.push({
          ...task,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        });
      });
      mutate.mutate(newState);
    },

    toggleTask: (taskId: string) => {
      const newState = produce(state, draft => {
        const task = draft.tasks.find(t => t.id === taskId);
        if (task) task.completed = !task.completed;
      });
      mutate.mutate(newState);
    },

    updateFilter: (filter: Partial<TaskFilter>) => {
      const newState = produce(state, draft => {
        draft.filter = { ...draft.filter, ...filter };
      });
      mutate.mutate(newState);
    },

    addTag: (taskId: string, tag: string) => {
      const newState = produce(state, draft => {
        const task = draft.tasks.find(t => t.id === taskId);
        if (task && !task.tags.includes(tag)) {
          task.tags.push(tag);
        }
      });
      mutate.mutate(newState);
    },

    deleteTask: (taskId: string) => {
      const newState = produce(state, draft => {
        draft.tasks = draft.tasks.filter(t => t.id !== taskId);
      });
      mutate.mutate(newState);
    },

    resetState: () => {
      mutate.mutate(initialState);
    },
  };

  // Selectors
  const selectors = {
    getFilteredTasks: () => {
      return state.tasks.filter(task => {
        const matchesPriority = !state.filter.priority || task.priority === state.filter.priority;
        const matchesSearch = task.title.toLowerCase().includes(state.filter.searchTerm.toLowerCase());
        const matchesCompleted = state.filter.showCompleted || !task.completed;
        return matchesPriority && matchesSearch && matchesCompleted;
      });
    },

    getStats: () => ({
      total: state.tasks.length,
      completed: state.tasks.filter(t => t.completed).length,
      highPriority: state.tasks.filter(t => t.priority === 'high').length,
    }),
  };

  return {
    state,
    isLoading,
    ...actions,
    ...selectors,
  };
};