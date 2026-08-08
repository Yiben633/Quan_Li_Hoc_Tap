import { Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '../../components/ui'
import { getApiErrorMessage } from '../auth/auth.api'
import { useStartStudySessionMutation } from './studySessions.hooks'

type StartStudyButtonProps = { subjectId?: string | null; taskId?: string; className?: string; label?: string }

export function StartStudyButton({ subjectId, taskId, className, label = 'Bắt đầu học' }: StartStudyButtonProps) {
  const navigate = useNavigate()
  const start = useStartStudySessionMutation()
  const begin = () => start.mutate({ subjectId: subjectId ?? null }, {
    onSuccess: (activeSession) => {
      const params = new URLSearchParams()
      if (subjectId) params.set('subjectId', subjectId)
      if (taskId) params.set('taskId', taskId)
      navigate({ pathname: '/study', search: params.toString() ? `?${params}` : '' }, { state: { activeSession } })
      toast.success('Đã bắt đầu phiên học')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể bắt đầu phiên học')),
  })

  return <Button className={className} onClick={begin} loading={start.isPending}><Play size={16} /> {label}</Button>
}
