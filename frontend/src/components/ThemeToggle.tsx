import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { IconButton } from './ui'

export function ThemeToggle() { const [dark, setDark] = useState(() => localStorage.getItem('studyflow_theme') === 'dark'); useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; localStorage.setItem('studyflow_theme', dark ? 'dark' : 'light') }, [dark]); return <IconButton label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'} onClick={() => setDark(!dark)}>{dark ? <Sun size={17} /> : <Moon size={17} />}</IconButton> }
