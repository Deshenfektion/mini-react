import { useState } from 'mini-react'
import { Clock } from './Clock'
import { Counter } from './Counter'
import { TodoList } from './TodoList'

type Tab = 'counter' | 'todos' | 'clock'

const TABS: { id: Tab; label: string }[] = [
  { id: 'counter', label: 'Counter' },
  { id: 'todos', label: 'Todos' },
  { id: 'clock', label: 'Clock' },
]

export function App() {
  const [tab, setTab] = useState<Tab>('counter')
  return (
    <div class="app">
      <header class="app-header">
        <h1>mini-react</h1>
        <p class="tagline">A miniature React runtime, built from scratch.</p>
      </header>
      <nav class="tabs">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            class={entry.id === tab ? 'tab tab-active' : 'tab'}
            onClick={() => {
              setTab(entry.id)
            }}
          >
            {entry.label}
          </button>
        ))}
      </nav>
      <main class="panel">
        {tab === 'counter' && <Counter />}
        {tab === 'todos' && <TodoList />}
        {tab === 'clock' && <Clock />}
      </main>
    </div>
  )
}
