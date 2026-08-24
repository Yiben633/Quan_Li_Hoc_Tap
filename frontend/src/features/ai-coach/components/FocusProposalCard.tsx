import { Play, Timer } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui'
import { getApiErrorMessage } from '../../auth/auth.api'
import { useStartFocusPomodoroMutation } from '../../study-sessions/studySessions.hooks'
import type { CoachChatResponse } from '../aiCoach.types'

type FocusProposalCardProps = {
  proposal: NonNullable<CoachChatResponse['focusProposal']>
}

export function FocusProposalCard({ proposal }: FocusProposalCardProps) {
  const navigate = useNavigate()
  const startFocus = useStartFocusPomodoroMutation()

  const begin = () => startFocus.mutate({
    subjectId: proposal.subjectId,
    plannedMinutes: proposal.plannedMinutes,
  }, {
    onSuccess: (activeSession) => {
      const params = new URLSearchParams({ taskId: proposal.taskId })
      if (proposal.subjectId) params.set('subjectId', proposal.subjectId)
      navigate({ pathname: '/study', search: `?${params}` }, { state: { activeSession } })
      toast.success(`Đã bắt đầu Pomodoro ${proposal.plannedMinutes} phút`)
    },
    onError: (error) => {
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 409) {
        toast('Bạn đang có một phiên tập trung chưa kết thúc. Đang mở phiên đó…')
        navigate('/study')
        return
      }
      toast.error(getApiErrorMessage(error, 'Không thể bắt đầu Pomodoro'))
    },
  })

  return (
    <section className="ai-coach-focus-proposal" aria-label={`Đề xuất Pomodoro cho ${proposal.title}`}>
      <header>
        <span className="ai-coach-focus-proposal-icon"><Timer size={18} /></span>
        <div><span>POMODORO ĐỀ XUẤT</span><strong>{proposal.title}</strong></div>
      </header>
      <p>Phiên tập trung {proposal.plannedMinutes} phút. Bộ đếm chỉ bắt đầu sau khi bạn xác nhận.</p>
      <Button type="button" onClick={begin} loading={startFocus.isPending} disabled={startFocus.isPending}>
        <Play size={16} /> Bắt đầu Pomodoro
      </Button>
    </section>
  )
}
