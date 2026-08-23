import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { Icon, categoryIconChoices } from '../lib/icons'
import { categoryColorChoices } from '../lib/colors'
import type { Category } from '../types'

function CategoryRow({ category }: { category: Category }) {
  const updateCategory = useStore((s) => s.updateCategory)
  const removeCategory = useStore((s) => s.removeCategory)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [icon, setIcon] = useState(category.icon)
  const [color, setColor] = useState(category.color)

  const save = () => {
    updateCategory(category.id, { name: name.trim() || category.name, icon, color })
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="task-row">
        <button className="task-body" onClick={() => setEditing(true)}>
          <Icon name={category.icon} className="task-emoji" style={{ color: category.color }} />
          <span className="task-title">{category.name}</span>
        </button>
        <button className="task-delete" onClick={() => removeCategory(category.id)}>
          <Trash2 size={15} />
        </button>
      </div>
    )
  }

  return (
    <div className="new-category-box">
      <div className="emoji-grid">
        {categoryIconChoices.map((key) => (
          <button
            key={key}
            className={`emoji-btn ${icon === key ? 'emoji-btn-active' : ''}`}
            onClick={() => setIcon(key)}
          >
            <Icon name={key} size={16} />
          </button>
        ))}
      </div>
      <div className="color-swatch-row">
        {categoryColorChoices.map((c) => (
          <button
            key={c}
            className={`color-swatch ${color === c ? 'color-swatch-active' : ''}`}
            style={{ background: c }}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <div className="row-gap">
        <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-small" onClick={save}>
          OK
        </button>
      </div>
    </div>
  )
}

export function CategoryManager() {
  const categories = useStore((s) => s.categories)

  return (
    <div className="stats-card">
      <div className="task-list">
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </div>
    </div>
  )
}
