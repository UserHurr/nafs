import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Category, Member, Priority, RoutineItem, RoutineType, Task, Todo } from './types'
import { myMemberId } from './syncStore'

const uid = () => crypto.randomUUID()

const defaultCategories: Category[] = [
  { id: 'travail', name: 'Travail', icon: 'briefcase', color: '#6366f1' },
  { id: 'sport', name: 'Sport', icon: 'dumbbell', color: '#f97316' },
  { id: 'etude', name: 'Étude', icon: 'book', color: '#3b82f6' },
  { id: 'sante', name: 'Santé', icon: 'heart-pulse', color: '#22c55e' },
  { id: 'social', name: 'Social', icon: 'users', color: '#ec4899' },
  { id: 'maison', name: 'Maison', icon: 'home', color: '#a855f7' },
  { id: 'repas', name: 'Repas', icon: 'utensils', color: '#eab308' },
  { id: 'perso', name: 'Perso', icon: 'sparkles', color: '#14b8a6' },
]

const defaultMorningRoutine = (ownerId: string): RoutineItem[] => [
  { id: uid(), title: 'Boire un verre d’eau', icon: 'glass-water', ownerId },
  { id: uid(), title: 'Étirements', icon: 'stretch', ownerId },
  { id: uid(), title: 'Petit-déjeuner', icon: 'coffee', ownerId },
]

const defaultEveningRoutine = (ownerId: string): RoutineItem[] => [
  { id: uid(), title: 'Ranger la journée', icon: 'home', ownerId },
  { id: uid(), title: 'Lecture', icon: 'book-text', ownerId },
  { id: uid(), title: 'Préparer demain', icon: 'notebook-pen', ownerId },
]

interface AppState {
  categories: Category[]
  members: Member[]
  tasks: Task[]
  todos: Todo[]
  routines: Record<RoutineType, RoutineItem[]>
  taskCompletions: Record<string, boolean>
  routineCompletions: Record<string, boolean>
  notificationsEnabled: boolean
  notifiedReminders: Record<string, boolean>

  addCategory: (c: Omit<Category, 'id'>) => void
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void
  removeCategory: (id: string) => void

  addMember: (m: Omit<Member, 'id'> & { id: string }) => void
  updateMember: (id: string, patch: Partial<Omit<Member, 'id'>>) => void

  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => void
  updateTask: (id: string, patch: Partial<Task>) => void
  removeTask: (id: string) => void
  toggleTaskDone: (taskId: string, dateIso: string) => void

  addTodo: (title: string, ownerId: string, dueDate?: string, priority?: Priority) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
  setTodoPriority: (id: string, priority: Priority) => void
  addSubtask: (todoId: string, title: string) => void
  toggleSubtask: (todoId: string, subtaskId: string) => void
  removeSubtask: (todoId: string, subtaskId: string) => void

  addRoutineItem: (type: RoutineType, title: string, icon: string, ownerId: string) => void
  removeRoutineItem: (type: RoutineType, id: string) => void
  toggleRoutineItem: (type: RoutineType, itemId: string, dateIso: string) => void

  setNotificationsEnabled: (enabled: boolean) => void
  markReminderNotified: (taskId: string, dateIso: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      categories: defaultCategories,
      members: [{ id: myMemberId(), name: 'Moi', icon: 'user', color: '#ec4899' }],
      tasks: [],
      todos: [],
      routines: { morning: defaultMorningRoutine(myMemberId()), evening: defaultEveningRoutine(myMemberId()) },
      taskCompletions: {},
      routineCompletions: {},
      notificationsEnabled: false,
      notifiedReminders: {},

      addCategory: (c) =>
        set((s) => ({ categories: [...s.categories, { ...c, id: uid() }] })),
      updateCategory: (id, patch) =>
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeCategory: (id) =>
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

      addMember: (m) =>
        set((s) => (s.members.some((x) => x.id === m.id) ? s : { members: [...s.members, m] })),
      updateMember: (id, patch) =>
        set((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

      addTask: (t) =>
        set((s) => ({
          tasks: [...s.tasks, { ...t, id: uid(), createdAt: new Date().toISOString() }],
        })),
      updateTask: (id, patch) =>
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          taskCompletions: Object.fromEntries(
            Object.entries(s.taskCompletions).filter(([k]) => !k.startsWith(`${id}_`)),
          ),
        })),
      toggleTaskDone: (taskId, dateIso) =>
        set((s) => {
          const key = `${taskId}_${dateIso}_${myMemberId()}`
          return { taskCompletions: { ...s.taskCompletions, [key]: !s.taskCompletions[key] } }
        }),

      addTodo: (title, ownerId, dueDate, priority) =>
        set((s) => ({
          todos: [
            ...s.todos,
            { id: uid(), title, ownerId, doneBy: [], dueDate, priority, subtasks: [], createdAt: new Date().toISOString() },
          ],
        })),
      toggleTodo: (id) =>
        set((s) => ({
          todos: s.todos.map((t) => {
            if (t.id !== id) return t
            const me = myMemberId()
            const doneBy = t.doneBy.includes(me) ? t.doneBy.filter((m) => m !== me) : [...t.doneBy, me]
            return { ...t, doneBy }
          }),
        })),
      removeTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),
      setTodoPriority: (id, priority) =>
        set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, priority } : t)) })),
      addSubtask: (todoId, title) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === todoId
              ? { ...t, subtasks: [...(t.subtasks ?? []), { id: uid(), title, done: false }] }
              : t,
          ),
        })),
      toggleSubtask: (todoId, subtaskId) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  subtasks: (t.subtasks ?? []).map((st) =>
                    st.id === subtaskId ? { ...st, done: !st.done } : st,
                  ),
                }
              : t,
          ),
        })),
      removeSubtask: (todoId, subtaskId) =>
        set((s) => ({
          todos: s.todos.map((t) =>
            t.id === todoId ? { ...t, subtasks: (t.subtasks ?? []).filter((st) => st.id !== subtaskId) } : t,
          ),
        })),

      addRoutineItem: (type, title, icon, ownerId) =>
        set((s) => ({
          routines: { ...s.routines, [type]: [...s.routines[type], { id: uid(), title, icon, ownerId }] },
        })),
      removeRoutineItem: (type, id) =>
        set((s) => ({
          routines: { ...s.routines, [type]: s.routines[type].filter((i) => i.id !== id) },
        })),
      toggleRoutineItem: (type, itemId, dateIso) =>
        set((s) => {
          const key = `${type}_${itemId}_${dateIso}_${myMemberId()}`
          return { routineCompletions: { ...s.routineCompletions, [key]: !s.routineCompletions[key] } }
        }),

      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      markReminderNotified: (taskId, dateIso) =>
        set((s) => ({ notifiedReminders: { ...s.notifiedReminders, [`${taskId}_${dateIso}`]: true } })),
    }),
    { name: 'nafs-store-v3' },
  ),
)
