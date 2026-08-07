import { Columns3, ListTodo } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export function TaskModuleTabs() {
  return <nav className="task-module-tabs" aria-label="Chế độ xem công việc"><NavLink end to="/tasks" className={({ isActive }) => `task-module-tab ${isActive ? 'active' : ''}`}><ListTodo size={16} /> Danh sách</NavLink><NavLink to="/tasks/kanban" className={({ isActive }) => `task-module-tab ${isActive ? 'active' : ''}`}><Columns3 size={16} /> Kanban</NavLink></nav>
}
