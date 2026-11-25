import { useEffect, useRef, useState } from 'react';

export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);

  const mutationRef = useRef(null);
  const mountedRef = useRef(true);

  const q = filters?.q ?? '';
  const completed = filters?.completed ?? '';
  const priority = filters?.priority ?? '';
  const categoryId = filters?.categoryId ?? '';

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const current = mutationRef.current;
      mutationRef.current = null;
      if (current) current.abort();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    setStatus('loading');
    setError(null);

    async function load() {
      try {
        const data = await api.loadInitialData(
          { q, completed, priority, categoryId },
          { signal: controller.signal },
        );
        if (!active) return;
        setSnapshot({
          tasks: data.tasks,
          categories: data.categories,
          meta: data.meta,
        });
        setStatus('ready');
      } catch (cause) {
        if (!active || controller.signal.aborted) return;
        setError(cause);
        setStatus('error');
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [api, q, completed, priority, categoryId, revision]);

  const refresh = () => {
    setRevision(previous => previous + 1);
  };

  const mutate = async operation => {
    if (!mountedRef.current) return false;
    if (mutationRef.current !== null) return false;

    const controller = new AbortController();
    mutationRef.current = controller;

    setPending(true);
    setMutationError(null);

    try {
      await operation(controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return false;
      setRevision(previous => previous + 1);
      return true;
    } catch (cause) {
      if (mountedRef.current && !controller.signal.aborted) {
        setMutationError(cause);
      }
      return false;
    } finally {
      if (mutationRef.current === controller) mutationRef.current = null;
      if (mountedRef.current) setPending(false);
    }
  };

  const saveTask = (id, value) => mutate(signal => (
    id === null || id === undefined
      ? api.createTask(value, { signal })
      : api.updateTask(id, value, { signal })
  ));

  const toggleTask = task => mutate(signal => (
    api.setTaskCompleted(task.id, !task.completed, { signal })
  ));

  const deleteTask = id => mutate(signal => api.deleteTask(id, { signal }));

  const resetData = () => mutate(signal => api.resetDemoData({ signal }));

  return {
    snapshot,
    status,
    error,
    mutationError,
    pending,
    refresh,
    saveTask,
    toggleTask,
    deleteTask,
    resetData,
  };
}