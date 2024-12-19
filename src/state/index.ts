import {
  useQuery,
  useQueryClient,
  UseMutationResult,
  useMutation,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { produce } from "immer";

export type StateSelector<T, R> = (state: T) => R;

interface StateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onMutate?: (variables: Partial<T>) => void;
  persist?: boolean;
  storage?: Storage;
  version?: number;
}

type ActionMap<T> = Record<string, (state: T, payload: any) => void>;

interface EnhancedStateOptions<T> extends StateOptions<T> {
  middleware?: ((state: T) => void)[];
  devtools?: boolean;
  selector?: StateSelector<T, any>;
  actions?: ActionMap<T>;
}

type ActionType<T, A extends ActionMap<T> = ActionMap<T>> = keyof A;
type ActionPayload<
  T,
  A extends ActionMap<T>,
  K extends ActionType<T, A>,
> = Parameters<A[K]>[1];

type GlobalStateReturn<T, A extends ActionMap<T> = ActionMap<T>> = {
  data: T;
  isLoading: boolean;
  error: Error | null;
  update: (updater: (draft: T) => void) => void;
  dispatch: <K extends ActionType<T, A>>(
    actionType: K,
    payload?: ActionPayload<T, A, K>,
  ) => void;
  selected: any;
  subscribe: (callback: (state: T) => void) => () => void;
  setData: (newData: Partial<T>) => void;
  resetData: () => void;
  setQueryData: (queryKey: string, updater: (old: T) => T) => void;
  invalidateQuery: (queryKey: string) => void;
};

export function createGlobalState<
  T extends object,
  A extends ActionMap<T> = ActionMap<T>,
>(
  stateKey: string,
  initialData: T,
  options: EnhancedStateOptions<T> & { actions?: A } = {},
): (selector?: StateSelector<T, any>) => GlobalStateReturn<T, A> {
  const STATE_VERSION = options.version || 1;
  const STORAGE_KEY = `globalState_${String(stateKey)}_v${STATE_VERSION}`;

  // Enhanced persistence with version control and migration
  const persistState = (state: T) => {
    if (options.persist && typeof window !== "undefined") {
      const storage = options.storage || window.localStorage;
      const persistData = {
        version: STATE_VERSION,
        state,
        timestamp: new Date().toISOString(),
      };
      storage.setItem(STORAGE_KEY, JSON.stringify(persistData));
    }
  };

  const loadPersistedState = (): T | null => {
    if (options.persist && typeof window !== "undefined") {
      const storage = options.storage || window.localStorage;
      const saved = storage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return data.state;
      }
    }
    return null;
  };

  const listeners = new Set<(state: T) => void>();
  let batchTimeout: NodeJS.Timeout | null = null;
  let pendingState: T | null = null;

  const notifyListeners = (state: T) => {
    if (batchTimeout) {
      pendingState = state;
      return;
    }

    batchTimeout = setTimeout(() => {
      if (pendingState) {
        listeners.forEach((listener) => listener(pendingState!));
        pendingState = null;
      }
      batchTimeout = null;
    }, 0);

    listeners.forEach((listener) => listener(state));
  };

  return function useGlobalState(
    selector?: StateSelector<T, any>,
  ): GlobalStateReturn<T, A> {
    const queryClient = useQueryClient();
    const stateQueryKey = [stateKey, STATE_VERSION] as const;

    const { data, isLoading, error } = useQuery({
      queryKey: stateQueryKey,
      queryFn: async () => {
        const persisted = loadPersistedState();
        return persisted || initialData;
      },
      initialData,
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    });

    const mutation = useMutation({
      mutationFn: async (newData: Partial<T>) => {
        const currentData = queryClient.getQueryData(stateQueryKey) as T;
        const updatedData = produce(currentData, (draft) => {
          Object.assign(draft, newData);
        });

        if (options.persist) {
          persistState(updatedData);
        }

        notifyListeners(updatedData);
        return updatedData;
      },
      onSuccess: (newData) => {
        queryClient.setQueryData(stateQueryKey, newData);
        options.onSuccess?.(newData);

        if (options.middleware) {
          options.middleware.forEach((middleware) => middleware(newData));
        }
      },
      onError: (error: Error) => {
        options.onError?.(error);
        const previousData = queryClient.getQueryData(stateQueryKey);
        if (previousData) {
          queryClient.setQueryData(stateQueryKey, previousData);
        }
      },
    });

    const update = useCallback(
      (updater: (draft: T) => void) => {
        const currentData = queryClient.getQueryData(stateQueryKey) as T;
        const newState = produce(currentData, updater);
        mutation.mutate(newState as any);
      },
      [queryClient, mutation, stateQueryKey],
    );

    const setData = useCallback(
      (newData: Partial<T>) => {
        mutation.mutate(newData);
      },
      [mutation],
    );

    const resetData = useCallback(() => {
      queryClient.setQueryData(stateQueryKey, initialData);
      if (options.persist) {
        persistState(initialData);
      }
    }, [queryClient]);

    const subscribe = useCallback((callback: (state: T) => void) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    }, []);

    const dispatch = useCallback(
      <K extends ActionType<T, A>>(
        actionType: K,
        payload?: ActionPayload<T, A, K>,
      ) => {
        if (options.actions?.[actionType]) {
          update((draft) => {
            (options.actions![actionType] as any)(draft, payload);
          });
        }
      },
      [update],
    );

    const setQueryData = useCallback(
      (queryKey: string, updater: (old: T) => T) => {
        const currentData = queryClient.getQueryData([queryKey]) as T;
        const newData = updater(currentData);
        queryClient.setQueryData([queryKey], newData);

        if (options.persist) {
          persistState(newData);
        }

        if (options.middleware) {
          options.middleware.forEach((middleware) => middleware(newData));
        }
      },
      [queryClient],
    );

    const invalidateQuery = useCallback(
      (queryKey: string) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
      [queryClient],
    );

    return {
      data: data as T,
      isLoading,
      error,
      update,
      dispatch,
      subscribe,
      setData,
      resetData,
      selected: selector ? selector(data as T) : data,
      setQueryData,
      invalidateQuery,
    };
  };
}

export function createDerivedState<T, R>(
  useBaseState: () => { data: T },
  deriveFn: (state: T) => R,
) {
  return function useDerivedState(): R {
    const { data } = useBaseState();
    return useMemo(() => deriveFn(data), [data]);
  };
}
