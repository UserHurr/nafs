import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Category, Habit, Member, Priority, RoutineItem, RoutineType, Task, Todo } from './types'
import { myMemberId } from './syncStore'
import { categoryColorChoicesForTheme } from './lib/colors'

const uid = () => crypto.randomUUID()

// Default theme is 'pink' — these shades stay within that gradient.
const [c0, c1, c2, c3, c4, c5, c6, c7] = categoryColorChoicesForTheme('pink')

const defaultCategories: Category[] = [
  { id: 'travail', name: 'Travail', icon: 'briefcase', color: c5 },
  { id: 'sport', name: 'Sport', icon: 'dumbbell', color: c6 },
  { id: 'etude', name: 'Étude', icon: 'book', color: c1 },
  { id: 'sante', name: 'Santé', icon: 'heart-pulse', color: c3 },
  { id: 'social', name: 'Social', icon: 'users', color: c4 },
  { id: 'maison', name: 'Maison', icon: 'home', color: c2 },
  { id: 'repas', name: 'Repas', icon: 'utensils', color: c0 },
  { id: 'perso', name: 'Perso', icon: 'sparkles', color: c7 },
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

  qadaTarget: Record<string, number>
  qadaBaseCount: Record<string, number>
  /** Number of catch-up days logged per real calendar date — several can be
   * logged on the same date since one can catch up on more than one missed
   * day at a time. Key: `${dateIso}_${memberId}`. */
  qadaDayCounts: Record<string, number>

  habits: Habit[]
  /** Key: `${habitId}_${dateIso}_${memberId}`. */
  habitCompletions: Record<string, boolean>

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

  setQadaTarget: (memberId: string, n: number) => void
  setQadaBaseCount: (memberId: string, n: number) => void
  incrementQadaDay: (dateIso: string) => void
  decrementQadaDay: (dateIso: string) => void

  addHabit: (name: string, icon: string, ownerId: string) => void
  removeHabit: (id: string) => void
  toggleHabitDay: (habitId: string, dateIso: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      categories: defaultCategories,
      members: [{ id: myMemberId(), name: 'Moi', icon: 'user', color: c4 }],
      tasks: [],
      todos: [],
      routines: { morning: defaultMorningRoutine(myMemberId()), evening: defaultEveningRoutine(myMemberId()) },
      taskCompletions: {},
      routineCompletions: {},
      notificationsEnabled: false,
      notifiedReminders: {},

      qadaTarget: {},
      qadaBaseCount: {},
      qadaDayCounts: {},

      habits: [],
      habitCompletions: {},

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

      setQadaTarget: (memberId, n) =>
        set((s) => ({ qadaTarget: { ...s.qadaTarget, [memberId]: Math.max(0, n) } })),
      setQadaBaseCount: (memberId, n) =>
        set((s) => ({ qadaBaseCount: { ...s.qadaBaseCount, [memberId]: Math.max(0, n) } })),
      incrementQadaDay: (dateIso) =>
        set((s) => {
          const key = `${dateIso}_${myMemberId()}`
          return { qadaDayCounts: { ...s.qadaDayCounts, [key]: (s.qadaDayCounts[key] ?? 0) + 1 } }
        }),
      decrementQadaDay: (dateIso) =>
        set((s) => {
          const key = `${dateIso}_${myMemberId()}`
          const next = Math.max(0, (s.qadaDayCounts[key] ?? 0) - 1)
          return { qadaDayCounts: { ...s.qadaDayCounts, [key]: next } }
        }),

      addHabit: (name, icon, ownerId) =>
        set((s) => ({
          habits: [...s.habits, { id: uid(), name, icon, ownerId, createdAt: new Date().toISOString() }],
        })),
      removeHabit: (id) =>
        set((s) => ({
          habits: s.habits.filter((h) => h.id !== id),
          habitCompletions: Object.fromEntries(
            Object.entries(s.habitCompletions).filter(([k]) => !k.startsWith(`${id}_`)),
          ),
        })),
      toggleHabitDay: (habitId, dateIso) =>
        set((s) => {
          const key = `${habitId}_${dateIso}_${myMemberId()}`
          return { habitCompletions: { ...s.habitCompletions, [key]: !s.habitCompletions[key] } }
        }),
    }),
    {
      name: 'nafs-store-v3',
      version: 1,
      migrate: (persisted: unknown, version) => {
        const state = persisted as Record<string, unknown>
        if (version < 1 && state && typeof state === 'object' && 'qadaCompletions' in state) {
          const qadaCompletions = state.qadaCompletions as Record<string, boolean>
          const qadaDayCounts: Record<string, number> = {}
          for (const [k, v] of Object.entries(qadaCompletions)) {
            if (v) qadaDayCounts[k] = 1
          }
          const { qadaCompletions: _old, ...rest } = state
          return { ...rest, qadaDayCounts }
        }
        return state
      },
    },
  ),
)
