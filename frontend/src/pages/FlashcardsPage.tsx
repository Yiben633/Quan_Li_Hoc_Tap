import { BookOpenCheck, Brain, Check, Edit3, Plus, RotateCcw, Sparkles, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Badge, Button, Checkbox, ConfirmDialog, Drawer, EmptyState, IconButton, Input, Modal, Select, Skeleton, Tabs, Textarea } from '../components/ui'
import { aiFeaturesEnabled } from '../config/features'
import { useGenerateFlashcardsMutation } from '../features/ai/ai.hooks'
import type { GeneratedCard } from '../features/ai/ai.api'
import { getApiErrorMessage } from '../features/auth/auth.api'
import type { Flashcard, FlashcardInput, FlashcardSet, FlashcardSetInput } from '../features/flashcards/flashcards.api'
import { useDueFlashcardsQuery, useFlashcardCreateMutation, useFlashcardDeleteMutation, useFlashcardReviewMutation, useFlashcardSetCreateMutation, useFlashcardSetDeleteMutation, useFlashcardSetQuery, useFlashcardSetsQuery, useFlashcardSetUpdateMutation, useFlashcardUpdateMutation } from '../features/flashcards/flashcards.hooks'
import { useTopicsQuery } from '../features/learning/learning.hooks'

type FlashcardTab = 'sets' | 'review'

function SetEditor({ open, item, onClose }: { open: boolean; item?: FlashcardSet; onClose: () => void }) {
  const topics = useTopicsQuery()
  const create = useFlashcardSetCreateMutation()
  const update = useFlashcardSetUpdateMutation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setDescription(item?.description ?? '')
    setSubjectId(item?.subjectId ?? '')
  }, [item, open])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) return
    const input: FlashcardSetInput = { name: name.trim(), description: description.trim() || null, subjectId: subjectId || null }
    const callbacks = {
      onSuccess: () => { toast.success(item ? 'Đã cập nhật bộ thẻ' : 'Đã tạo bộ thẻ'); onClose() },
      onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Không thể lưu bộ thẻ')),
    }
    if (item) update.mutate({ id: item.id, input }, callbacks)
    else create.mutate(input, callbacks)
  }

  return <Modal open={open} title={item ? 'Chỉnh sửa bộ thẻ' : 'Tạo bộ thẻ'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="flashcard-set-form" loading={create.isPending || update.isPending}>Lưu bộ thẻ</Button></>}>
    <form id="flashcard-set-form" className="flashcard-form" onSubmit={submit}>
      <Input label="Tên bộ thẻ" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Từ vựng giao tiếp" autoFocus maxLength={160} />
      <Textarea label="Mô tả (tùy chọn)" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={5000} />
      <Select customMenu label="Môn học (tùy chọn)" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Không gắn môn học</option>{topics.data?.items.map((topic) => <option key={topic.id} value={topic.id}>{topic.code ? `${topic.code} · ${topic.name}` : topic.name}</option>)}</Select>
    </form>
  </Modal>
}

function CardEditor({ open, setId, item, onClose }: { open: boolean; setId: string; item?: Flashcard; onClose: () => void }) {
  const create = useFlashcardCreateMutation()
  const update = useFlashcardUpdateMutation()
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isDifficult, setIsDifficult] = useState(false)

  useEffect(() => {
    if (!open) return
    setQuestion(item?.question ?? '')
    setAnswer(item?.answer ?? '')
    setIsDifficult(item?.isDifficult ?? false)
  }, [item, open])

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!question.trim() || !answer.trim()) {
      toast.error('Nhập đầy đủ mặt trước và mặt sau')
      return
    }
    const input: FlashcardInput = { question: question.trim(), answer: answer.trim(), isDifficult }
    const callbacks = {
      onSuccess: () => { toast.success(item ? 'Đã cập nhật thẻ' : 'Đã thêm thẻ'); onClose() },
      onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Không thể lưu thẻ')),
    }
    if (item) update.mutate({ id: item.id, setId, input }, callbacks)
    else create.mutate({ setId, input }, callbacks)
  }

  return <Modal open={open} title={item ? 'Chỉnh sửa thẻ' : 'Tạo thẻ thủ công'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button><Button type="submit" form="flashcard-form" loading={create.isPending || update.isPending}>Lưu thẻ</Button></>}>
    <form id="flashcard-form" className="flashcard-form" onSubmit={submit}>
      <Textarea label="Mặt trước" value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} placeholder="Câu hỏi, thuật ngữ hoặc gợi ý..." autoFocus maxLength={10000} />
      <Textarea label="Mặt sau" value={answer} onChange={(event) => setAnswer(event.target.value)} rows={5} placeholder="Đáp án hoặc nội dung cần nhớ..." maxLength={10000} />
      <Checkbox label="Đánh dấu là thẻ khó" checked={isDifficult} onChange={(event) => setIsDifficult(event.target.checked)} />
    </form>
  </Modal>
}

function AiCardGenerator({ open, setId, onClose }: { open: boolean; setId: string; onClose: () => void }) {
  const generate = useGenerateFlashcardsMutation()
  const create = useFlashcardCreateMutation()
  const [text, setText] = useState('')
  const [count, setCount] = useState('10')
  const [consent, setConsent] = useState(false)
  const [cards, setCards] = useState<GeneratedCard[]>([])

  useEffect(() => {
    if (!open) return
    setText('')
    setCount('10')
    setConsent(false)
    setCards([])
  }, [open])

  const preview = () => {
    const number = Number(count)
    if (!text.trim() || !consent || !Number.isInteger(number) || number < 1 || number > 50) return
    generate.mutate({ text: text.trim(), count: number }, {
      onSuccess: (data) => setCards(data.cards),
      onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể tạo bản nháp thẻ')),
    })
  }

  const save = async () => {
    const validCards = cards.filter((card) => card.question.trim() && card.answer.trim())
    if (!validCards.length) return
    try {
      await Promise.all(validCards.map((card) => create.mutateAsync({ setId, input: { question: card.question.trim(), answer: card.answer.trim() } })))
      toast.success(`Đã thêm ${validCards.length} thẻ`)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu các thẻ đã chọn'))
    }
  }

  return <Modal open={open} title="Tạo thẻ từ nội dung" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Hủy</Button>{cards.length ? <Button onClick={save} loading={create.isPending}>Xác nhận thêm {cards.length} thẻ</Button> : <Button onClick={preview} disabled={!text.trim() || !consent} loading={generate.isPending}>Tạo bản xem trước</Button>}</>}>
    <div className="flashcard-form ai-card-generator">
      {!cards.length ? <><Textarea label="Nội dung nguồn" value={text} onChange={(event) => setText(event.target.value)} rows={9} placeholder="Dán nội dung bạn có quyền sử dụng..." maxLength={100000} /><Input label="Số thẻ" type="number" min="1" max="50" value={count} onChange={(event) => setCount(event.target.value)} /><Checkbox label="Tôi đồng ý gửi nội dung này tới provider AI đã cấu hình" checked={consent} onChange={(event) => setConsent(event.target.checked)} /></> : <div className="ai-card-preview"><p>{cards.length} thẻ trong bản xem trước. Bạn có thể chỉnh lại trước khi lưu.</p>{cards.map((card, index) => <article key={index}><Input aria-label={`Mặt trước thẻ ${index + 1}`} value={card.question} onChange={(event) => setCards((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item))} /><Textarea aria-label={`Mặt sau thẻ ${index + 1}`} rows={3} value={card.answer} onChange={(event) => setCards((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, answer: event.target.value } : item))} /><IconButton label={`Bỏ thẻ ${index + 1}`} onClick={() => setCards((current) => current.filter((_item, itemIndex) => itemIndex !== index))}><X size={15} /></IconButton></article>)}</div>}
    </div>
  </Modal>
}

function SetDrawer({ setId, onClose, onEditSet, onDeleteSet }: { setId: string; onClose: () => void; onEditSet: (item: FlashcardSet) => void; onDeleteSet: (item: FlashcardSet) => void }) {
  const query = useFlashcardSetQuery(setId)
  const removeCard = useFlashcardDeleteMutation()
  const [editingCard, setEditingCard] = useState<Flashcard | undefined>()
  const [cardEditorOpen, setCardEditorOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [deletingCard, setDeletingCard] = useState<Flashcard | null>(null)

  return <>
    <Drawer open title={query.data?.name ?? 'Bộ thẻ'} onClose={onClose}>
      {query.isLoading ? <div className="flashcard-drawer-skeleton"><Skeleton height={90} /><Skeleton height={90} /><Skeleton height={90} /></div> : query.isError ? <EmptyState title="Không thể tải bộ thẻ" action={<Button onClick={() => query.refetch()}>Thử lại</Button>} /> : query.data && <div className="flashcard-drawer-content">
        <div className="flashcard-set-meta"><div><span>{query.data.flashcards.length} thẻ</span>{query.data.description && <p>{query.data.description}</p>}</div><div><IconButton label="Chỉnh sửa bộ thẻ" onClick={() => onEditSet(query.data)}><Edit3 size={16} /></IconButton><IconButton label="Xóa bộ thẻ" onClick={() => onDeleteSet(query.data)}><Trash2 size={16} /></IconButton></div></div>
        <div className="flashcard-drawer-actions"><Button onClick={() => { setEditingCard(undefined); setCardEditorOpen(true) }}><Plus size={16} /> Tạo thẻ</Button>{aiFeaturesEnabled && <Button variant="secondary" onClick={() => setAiOpen(true)}><Sparkles size={16} /> Tạo từ nội dung</Button>}</div>
        {query.data.flashcards.length ? <div className="flashcard-card-list">{query.data.flashcards.map((card, index) => <article key={card.id}><span>{index + 1}</span><div><strong>{card.question}</strong><p>{card.answer}</p><small>{card.isDifficult ? 'Thẻ khó · ' : ''}{card.correctCount} đúng · {card.wrongCount} chưa nhớ</small></div><div><IconButton label="Chỉnh sửa thẻ" onClick={() => { setEditingCard(card); setCardEditorOpen(true) }}><Edit3 size={15} /></IconButton><IconButton label="Xóa thẻ" onClick={() => setDeletingCard(card)}><Trash2 size={15} /></IconButton></div></article>)}</div> : <EmptyState icon={<BookOpenCheck size={23} />} title="Bộ thẻ đang trống" description="Tạo thẻ thủ công để bắt đầu ôn tập." action={<Button onClick={() => setCardEditorOpen(true)}><Plus size={16} /> Tạo thẻ đầu tiên</Button>} />}
      </div>}
    </Drawer>
    <CardEditor open={cardEditorOpen} setId={setId} item={editingCard} onClose={() => { setCardEditorOpen(false); setEditingCard(undefined) }} />
    {aiFeaturesEnabled && <AiCardGenerator open={aiOpen} setId={setId} onClose={() => setAiOpen(false)} />}
    <ConfirmDialog open={Boolean(deletingCard)} title="Xóa thẻ?" description="Thẻ này sẽ bị xóa khỏi bộ thẻ và hàng đợi ôn tập." onCancel={() => setDeletingCard(null)} onConfirm={() => { if (!deletingCard) return; removeCard.mutate({ id: deletingCard.id, setId }, { onSuccess: () => { toast.success('Đã xóa thẻ'); setDeletingCard(null) }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể xóa thẻ')) }) }} loading={removeCard.isPending} />
  </>
}

function ReviewQueue() {
  const query = useDueFlashcardsQuery()
  const review = useFlashcardReviewMutation()
  const [revealed, setRevealed] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const card = query.data?.[0]

  const answer = (correct: boolean) => {
    if (!card) return
    review.mutate({ card, correct }, {
      onSuccess: () => { setReviewed((value) => value + 1); setRevealed(false) },
      onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể lưu kết quả ôn tập')),
    })
  }

  if (query.isLoading) return <div className="review-shell"><Skeleton height={360} /></div>
  if (query.isError) return <EmptyState title="Không thể tải hàng đợi ôn tập" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={() => query.refetch()}>Thử lại</Button>} />
  if (!card) return <EmptyState icon={<Check size={25} />} title={reviewed ? `Đã ôn ${reviewed} thẻ` : 'Không có thẻ đến hạn'} description="Các thẻ mới hoặc đến lịch sẽ xuất hiện tại đây." />

  return <div className="review-shell">
    <div className="review-progress"><span><strong>{query.data?.length ?? 0}</strong> thẻ còn lại</span>{reviewed > 0 && <span>{reviewed} thẻ đã ôn</span>}</div>
    <button type="button" className={`review-card ${revealed ? 'revealed' : ''}`} onClick={() => setRevealed(true)} aria-label={revealed ? 'Đã mở đáp án' : 'Mở đáp án'}>
      <small>{card.flashcardSet?.name ?? 'Bộ thẻ'}</small>
      <strong>{card.question}</strong>
      {revealed ? <div><span>Đáp án</span><p>{card.answer}</p></div> : <span className="review-hint"><RotateCcw size={16} /> Chạm để xem đáp án</span>}
    </button>
    {revealed && <div className="review-actions"><Button variant="secondary" onClick={() => answer(false)} loading={review.isPending}>Chưa nhớ</Button><Button onClick={() => answer(true)} loading={review.isPending}><Check size={16} /> Đã nhớ</Button></div>}
  </div>
}

export function FlashcardsPage() {
  const [tab, setTab] = useState<FlashcardTab>('sets')
  const sets = useFlashcardSetsQuery()
  const due = useDueFlashcardsQuery()
  const topics = useTopicsQuery()
  const removeSet = useFlashcardSetDeleteMutation()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<FlashcardSet | undefined>()
  const [selectedSetId, setSelectedSetId] = useState('')
  const [deletingSet, setDeletingSet] = useState<FlashcardSet | null>(null)
  const topicById = useMemo(() => new Map(topics.data?.items.map((topic) => [topic.id, topic]) ?? []), [topics.data])

  return <div className="flashcards-page">
    <div className="page-heading"><div><p className="eyebrow">GHI NHỚ CHỦ ĐỘNG</p><h1>Thẻ ghi nhớ</h1><p className="subtle">Tạo bộ thẻ theo cách của bạn và ôn lại đúng lúc.</p></div><Button onClick={() => { setEditingSet(undefined); setEditorOpen(true) }}><Plus size={17} /> Tạo bộ thẻ</Button></div>
    <div className="flashcards-tabs"><Tabs value={tab} onChange={setTab} items={[{ value: 'sets', label: 'Bộ thẻ' }, { value: 'review', label: <>Ôn tập {Boolean(due.data?.length) && <Badge tone="orange">{due.data?.length}</Badge>}</> }]} /></div>
    {tab === 'review' ? <ReviewQueue /> : sets.isLoading ? <div className="flashcard-set-grid">{[1, 2, 3].map((item) => <Skeleton key={item} height={210} />)}</div> : sets.isError ? <EmptyState icon={<Brain size={24} />} title="Không thể tải bộ thẻ" description="Kiểm tra kết nối rồi thử lại." action={<Button onClick={() => sets.refetch()}>Thử lại</Button>} /> : sets.data?.length ? <div className="flashcard-set-grid">{sets.data.map((set) => {
      const topic = set.subjectId ? topicById.get(set.subjectId) : undefined
      return <article key={set.id} className="flashcard-set-card"><div className="flashcard-set-card-head"><span className="flashcard-set-icon"><BookOpenCheck size={19} /></span><Badge tone="blue">{set._count?.flashcards ?? 0} thẻ</Badge></div><div><h2>{set.name}</h2>{set.description && <p>{set.description}</p>}</div><div className="flashcard-set-card-foot"><span>{topic ? `${topic.code} · ${topic.name}` : 'Bộ thẻ cá nhân'}</span><Button variant="secondary" onClick={() => setSelectedSetId(set.id)}>Mở bộ thẻ</Button></div></article>
    })}</div> : <EmptyState icon={<BookOpenCheck size={25} />} title="Chưa có bộ thẻ" description="Tạo một bộ thẻ thủ công để bắt đầu ghi nhớ." action={<Button onClick={() => setEditorOpen(true)}><Plus size={16} /> Tạo bộ thẻ đầu tiên</Button>} />}
    <SetEditor open={editorOpen} item={editingSet} onClose={() => { setEditorOpen(false); setEditingSet(undefined) }} />
    {selectedSetId && <SetDrawer setId={selectedSetId} onClose={() => setSelectedSetId('')} onEditSet={(item) => { setSelectedSetId(''); setEditingSet(item); setEditorOpen(true) }} onDeleteSet={setDeletingSet} />}
    <ConfirmDialog open={Boolean(deletingSet)} title="Xóa bộ thẻ?" description={`Bộ “${deletingSet?.name ?? ''}” và toàn bộ thẻ bên trong sẽ bị xóa.`} onCancel={() => setDeletingSet(null)} onConfirm={() => { if (!deletingSet) return; removeSet.mutate(deletingSet.id, { onSuccess: () => { toast.success('Đã xóa bộ thẻ'); setDeletingSet(null); setSelectedSetId('') }, onError: (error) => toast.error(getApiErrorMessage(error, 'Không thể xóa bộ thẻ')) }) }} loading={removeSet.isPending} />
  </div>
}
