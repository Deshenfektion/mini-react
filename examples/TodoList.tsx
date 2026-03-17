import { useState } from 'mini-react'

export interface Todo {
  id: number
  title: string
  done: boolean
}

type Filter = 'all' | 'active' | 'done'

const FILTERS: Filter[] = ['all', 'active', 'done']

let nextId = 3

const INITIAL: Todo[] = [
  { id: 1, title: 'Read the reconciler', done: true },
  { id: 2, title: 'Reorder this list and watch the DOM', done: false },
]

export function TodoList() {
  const [todos, setTodos] = useState<Todo[]>(INITIAL)
  const [draft, setDraft] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const visible = todos.filter((todo) => {
    if (filter === 'active') {
      return !todo.done
    }
    if (filter === 'done') {
      return todo.done
    }
    return true
  })

  const remaining = todos.filter((todo) => !todo.done).length

  function add(title: string) {
    const trimmed = title.trim()
    if (trimmed.length === 0) {
      return
    }
    nextId += 1
    setTodos([...todos, { id: nextId, title: trimmed, done: false }])
    setDraft('')
  }

  function toggle(id: number) {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)))
  }

  function remove(id: number) {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  function move(id: number, offset: number) {
    const index = todos.findIndex((todo) => todo.id === id)
    const target = index + offset
    if (index < 0 || target < 0 || target >= todos.length) {
      return
    }
    const next = [...todos]
    const [moved] = next.splice(index, 1)
    if (moved) {
      next.splice(target, 0, moved)
    }
    setTodos(next)
  }

  return (
    <section>
      <h2>Todos</h2>
      <p class="hint">
        Demonstrates keyed reconciliation, list rendering, forms, and parent-child
        communication through callback props.
      </p>
      <form
        class="row"
        onSubmit={(event: Event) => {
          event.preventDefault()
          add(draft)
        }}
      >
        <input
          class="grow"
          placeholder="What needs doing?"
          value={draft}
          onInput={(event: Event) => {
            setDraft((event.target as HTMLInputElement).value)
          }}
        />
        <button type="submit">add</button>
      </form>
      <div class="row">
        {FILTERS.map((entry) => (
          <button
            key={entry}
            class={entry === filter ? 'chip chip-active' : 'chip'}
            onClick={() => {
              setFilter(entry)
            }}
          >
            {entry}
          </button>
        ))}
        <span class="spacer" />
        <span class="hint">{remaining} left</span>
      </div>
      {visible.length === 0 ? (
        <p class="empty">Nothing here.</p>
      ) : (
        <ul class="todos">
          {visible.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onToggle={toggle}
              onRemove={remove}
              onMove={move}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface TodoRowProps {
  todo: Todo
  onToggle: (id: number) => void
  onRemove: (id: number) => void
  onMove: (id: number, offset: number) => void
}

function TodoRow(props: TodoRowProps) {
  const { todo } = props
  return (
    <li class={todo.done ? 'todo todo-done' : 'todo'}>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => {
          props.onToggle(todo.id)
        }}
      />
      <span class="grow">{todo.title}</span>
      <button
        class="icon"
        onClick={() => {
          props.onMove(todo.id, -1)
        }}
      >
        up
      </button>
      <button
        class="icon"
        onClick={() => {
          props.onMove(todo.id, 1)
        }}
      >
        down
      </button>
      <button
        class="icon"
        onClick={() => {
          props.onRemove(todo.id)
        }}
      >
        remove
      </button>
    </li>
  )
}
