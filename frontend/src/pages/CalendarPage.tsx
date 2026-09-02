import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Button,
  ConfirmDialog,
  ErrorState,
  Modal,
  Skeleton,
  Tabs,
} from "../components/ui";
import { getApiErrorMessage } from "../features/auth/auth.api";
import type {
  CalendarItem,
  CalendarView,
} from "../features/calendar/calendar.api";
import {
  useCalendarEventMutation,
  useCalendarQuery,
} from "../features/calendar/calendar.hooks";
import { NatureFlora, NatureMascot } from "../components/nature";
import { natureEmptyStateAssets } from "../config/natureAssets";
import { getVietnamDateTimeParts, toVietnamIso } from "../utils/calendarTime";

const labels: Record<CalendarItem["type"], string> = {
  schedule: "Lịch",
  event: "Sự kiện",
  task_due: "Hạn công việc",
  exam: "Kỳ thi",
};
const scheduleLabels = {
  class: "Lớp học",
  self_study: "Tự học",
  exam: "Lịch thi",
  presentation: "Thuyết trình",
  group_work: "Làm nhóm",
  personal: "Cá nhân",
} as const;
const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const calendarDayStartMinutes = 7 * 60;
const calendarDayEndMinutes = 21 * 60;
const calendarTimeSlots = Array.from({ length: 15 }, (_, index) => `${String(index + 7).padStart(2, "0")}:00`);

function calendarItemLabel(item: CalendarItem) {
  return item.type === "schedule" && item.scheduleType ? scheduleLabels[item.scheduleType] : labels[item.type];
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function calendarEventTiming(item: CalendarItem) {
  const start = timeToMinutes(getVietnamDateTimeParts(item.startAt).time);
  const end = timeToMinutes(getVietnamDateTimeParts(item.endAt).time);
  const totalMinutes = calendarDayEndMinutes - calendarDayStartMinutes;
  const duration = end > start ? end - start : item.type === "task_due" ? 45 : 60;
  const topMinutes = Math.min(Math.max(start - calendarDayStartMinutes, 0), totalMinutes - 30);
  const visibleDuration = Math.min(duration, totalMinutes - topMinutes);

  return {
    "--calendar-event-top": `${(topMinutes / totalMinutes) * 100}%`,
    "--calendar-event-height": `${Math.max(visibleDuration / totalMinutes, 0.06) * 100}%`,
  } as React.CSSProperties;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateFromQuery(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = parseDate(value);
  return Number.isNaN(date.getTime()) || dayKey(date) !== value ? null : date;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function monday(date: Date) {
  const day = date.getDay();
  return addDays(date, -(day === 0 ? 6 : day - 1));
}

function monthCells(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = monday(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function CalendarInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = parseDate(value);
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(
    new Date(selected.getFullYear(), selected.getMonth(), 1),
  );
  const cells = monthCells(month);

  return (
    <div className="calendar-input">
      <button
        type="button"
        className="calendar-input-trigger"
        onClick={() => setOpen((current) => !current)}
      >
        <span>
          {value ? selected.toLocaleDateString("vi-VN") : "dd/mm/yyyy"}
        </span>
        <CalendarDays size={16} />
      </button>
      {open && (
        <div className="calendar-input-popover">
          <div className="calendar-input-head">
            <button
              type="button"
              className="icon-button"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
              aria-label="Tháng trước"
            >
              <ChevronLeft size={15} />
            </button>
            <strong>
              {month.toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              type="button"
              className="icon-button"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
              aria-label="Tháng sau"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="calendar-input-weekdays">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-input-days">
            {cells.map((day) => (
              <button
                type="button"
                className={`${day.getMonth() !== month.getMonth() ? "is-muted " : ""}${dayKey(day) === value ? "is-selected" : ""}`}
                key={dayKey(day)}
                onClick={() => {
                  onChange(dayKey(day));
                  setOpen(false);
                }}
              >
                {day.getDate()}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="calendar-input-today"
            onClick={() => {
              const today = dayKey(new Date());
              onChange(today);
              setMonth(new Date());
              setOpen(false);
            }}
          >
            Hôm nay
          </button>
        </div>
      )}
    </div>
  );
}

export function CalendarPage() {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(() => dateFromQuery(searchParams.get("date")) ?? new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<CalendarItem | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarItem | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: dayKey(new Date()),
    start: "09:00",
    end: "10:00",
  });
  const date = dayKey(anchor);
  const today = dayKey(new Date());
  const query = useCalendarQuery(view, date);
  const agenda = useCalendarQuery("day", today);
  const mutations = useCalendarEventMutation();
  const cells = useMemo(
    () =>
      view === "month"
        ? monthCells(anchor)
        : view === "week"
          ? Array.from({ length: 7 }, (_, index) =>
              addDays(monday(anchor), index),
            )
          : [anchor],
    [anchor, view],
  );
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    (query.data?.items ?? []).forEach((item) => {
      const key = getVietnamDateTimeParts(item.startAt).date;
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return map;
  }, [query.data]);

  const move = (amount: number) =>
    setAnchor((current) =>
      view === "month"
        ? new Date(current.getFullYear(), current.getMonth() + amount, 1)
        : addDays(current, view === "week" ? amount * 7 : amount),
    );
  const openCreate = (selectedDate: Date) => {
    setSelected(null);
    setEditingEvent(null);
    setForm({
      title: "",
      date: dayKey(selectedDate),
      start: "09:00",
      end: "10:00",
    });
    setModalOpen(true);
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.start) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.end)
    ) {
      toast.error("Giờ cần có định dạng HH:mm, ví dụ 09:30");
      return;
    }
    const startAt = toVietnamIso(form.date, form.start);
    const endAt = toVietnamIso(form.date, form.end);
    const input = { title: form.title.trim(), startAt, endAt };
    const options = {
      onSuccess: () => {
        setModalOpen(false);
        setEditingEvent(null);
        toast.success(editingEvent ? "Đã cập nhật sự kiện" : "Đã thêm sự kiện");
      },
      onError: (error: unknown) =>
        toast.error(getApiErrorMessage(error, "Không thể lưu sự kiện")),
    };
    if (editingEvent)
      mutations.update.mutate(
        { id: editingEvent.sourceEntity.id, input },
        options,
      );
    else mutations.create.mutate(input, options);
  };
  const editSelected = () => {
    if (!selected || selected.type !== "event") return;
    const start = getVietnamDateTimeParts(selected.startAt);
    const end = getVietnamDateTimeParts(selected.endAt);
    setEditingEvent(selected);
    setForm({
      title: selected.title,
      date: start.date,
      start: start.time,
      end: end.time,
    });
    setSelected(null);
    setModalOpen(true);
  };
  const dropEvent = (target: Date) => {
    if (!draggedEvent || draggedEvent.type !== "event") return;
    const oldStart = new Date(draggedEvent.startAt);
    const oldEnd = new Date(draggedEvent.endAt);
    const startAt = toVietnamIso(
      dayKey(target),
      getVietnamDateTimeParts(draggedEvent.startAt).time,
    );
    const endAt = new Date(
      new Date(startAt).getTime() +
        Math.max(30 * 60_000, oldEnd.getTime() - oldStart.getTime()),
    ).toISOString();
    mutations.update.mutate(
      { id: draggedEvent.sourceEntity.id, input: { startAt, endAt } },
      {
        onSuccess: () => toast.success("Đã đổi thời gian sự kiện"),
        onError: (error) =>
          toast.error(
            getApiErrorMessage(error, "Không thể đổi thời gian sự kiện"),
          ),
      },
    );
    setDraggedEvent(null);
  };
  const remove = () => {
    if (!deletingEvent || deletingEvent.type !== "event") return;
    mutations.remove.mutate(deletingEvent.sourceEntity.id, {
      onSuccess: () => {
        setDeletingEvent(null);
        toast.success("Đã xóa sự kiện");
      },
      onError: (error) =>
        toast.error(getApiErrorMessage(error, "Không thể xóa sự kiện")),
    });
  };

  return (
    <div className="calendar-page">
      <header className="calendar-heading">
        <div>
          <p className="eyebrow">LỊCH HỌC</p>
          <h1>{anchor.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}</h1>
        </div>
      </header>
      <section className="panel calendar-toolbar">
        <div className="calendar-nav">
          <button
            className="icon-button"
            onClick={() => move(-1)}
            aria-label="Khoảng thời gian trước"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="calendar-today"
            onClick={() => setAnchor(new Date())}
          >
            Hôm nay
          </button>
          <button
            className="icon-button"
            onClick={() => move(1)}
            aria-label="Khoảng thời gian sau"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <Tabs
          value={view}
          onChange={setView}
          items={[{ value: "day", label: "Ngày" }, { value: "week", label: "Tuần" }, { value: "month", label: "Tháng" }]}
        />
        <Button className="calendar-create-event" onClick={() => openCreate(anchor)}>
          <Plus size={16} /> Sự kiện
        </Button>
      </section>
      {query.isLoading ? (
        <Skeleton height={520} />
      ) : query.isError ? (
        <ErrorState
          title="Không thể tải lịch."
          action={<Button onClick={() => query.refetch()}>Thử lại</Button>}
        />
      ) : (
        <div className="calendar-content-layout">
        <section className={`panel calendar-grid calendar-view-${view}`}>
          {view !== "month" && <div className="calendar-time-axis" aria-hidden="true"><span /><div>{calendarTimeSlots.map((slot, index) => <span key={slot} style={{ "--calendar-slot-position": `${(index / (calendarTimeSlots.length - 1)) * 100}%` } as React.CSSProperties}>{slot}</span>)}</div></div>}
          <div className="calendar-weekdays">
            {(view === "day"
              ? [weekdays[(anchor.getDay() + 6) % 7]]
              : weekdays
            ).map((label) => (
              <strong key={label}>{label}</strong>
            ))}
          </div>
          <div className="calendar-cells">
            {cells.map((cell) => {
              const items = byDay.get(dayKey(cell)) ?? [];
              return (
                <div
                  className={`calendar-cell${cell.getMonth() !== anchor.getMonth() && view === "month" ? " is-outside" : ""}${dayKey(cell) === today ? " is-today" : ""}${view === "month" && (cell.getDay() === 0 || cell.getDay() === 6) ? " is-weekend" : ""}`}
                  key={dayKey(cell)}
                  onDragOver={(event) => {
                    if (draggedEvent) event.preventDefault();
                  }}
                  onDrop={() => dropEvent(cell)}
                  onDoubleClick={() => openCreate(cell)}
                >
                  <button
                    className="calendar-day"
                    onClick={() => openCreate(cell)}
                  >
                    {cell.getDate()}
                  </button>
                  <div className="calendar-items">
                    {items.map((item) => (
                      <button
                        key={`${item.type}-${item.sourceEntity.id}-${item.startAt}`}
                        className={`calendar-item calendar-item-${item.type}${item.scheduleType ? ` calendar-item-schedule-${item.scheduleType}` : ""}`}
                        style={view === "month" ? undefined : calendarEventTiming(item)}
                        draggable={item.type === "event"}
                        onDragStart={() => setDraggedEvent(item)}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelected(item);
                        }}
                      >
                        <span className="calendar-item-dot" />
                        <span className="calendar-item-copy"><span className="calendar-item-title">{item.title}</span><small><b>{calendarItemLabel(item)}</b>{item.type !== "task_due" && ` · ${timeLabel(item.startAt)}`}</small></span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <TodayAgenda items={agenda.data?.items ?? []} loading={agenda.isLoading} error={agenda.isError} onCreate={() => openCreate(new Date())} onSelect={setSelected} onRetry={() => void agenda.refetch()} />
        </div>
      )}
      <Modal
        open={modalOpen}
        title={editingEvent ? "Sửa sự kiện" : "Tạo sự kiện"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="calendar-event-form"
              loading={mutations.create.isPending || mutations.update.isPending}
            >
              {editingEvent ? "Lưu thay đổi" : "Lưu sự kiện"}
            </Button>
          </>
        }
      >
        <form id="calendar-event-form" className="modal-form" onSubmit={save}>
          <label className="field">
            <span>Tên sự kiện</span>
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Ví dụ: Ôn tập chương 1"
            />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Ngày</span>
              <CalendarInput
                value={form.date}
                onChange={(nextDate) => setForm({ ...form, date: nextDate })}
              />
            </label>
            <label className="field">
              <span>Bắt đầu</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-2][0-9]:[0-5][0-9]"
                placeholder="09:00"
                maxLength={5}
                required
                value={form.start}
                onChange={(event) =>
                  setForm({ ...form, start: event.target.value })
                }
              />
            </label>
          </div>
          <label className="field">
            <span>Kết thúc</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-2][0-9]:[0-5][0-9]"
              placeholder="10:00"
              maxLength={5}
              required
              value={form.end}
              onChange={(event) =>
                setForm({ ...form, end: event.target.value })
              }
            />
          </label>
        </form>
      </Modal>
      <Modal
        open={Boolean(selected)}
        title={selected?.title ?? "Chi tiết lịch"}
        onClose={() => setSelected(null)}
        footer={
          selected?.type === "event" ? (
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Đóng
              </Button>
              <Button onClick={editSelected}>
                <Edit3 size={15} /> Sửa
              </Button>
              <Button variant="danger" onClick={() => { setDeletingEvent(selected); setSelected(null); }}>
                <Trash2 size={15} /> Xóa sự kiện
              </Button>
            </>
          ) : (
            <Button onClick={() => setSelected(null)}>Đóng</Button>
          )
        }
      >
        <div className="calendar-detail">
          <span className={`badge ${selected?.type ?? "blue"}`}>
            {selected ? calendarItemLabel(selected) : ""}
          </span>
          {selected && (
            <p>
              <Clock3 size={15} />{" "}
              {new Intl.DateTimeFormat("vi-VN", {
                dateStyle: "full",
                timeStyle: "short",
                timeZone: "Asia/Ho_Chi_Minh",
              }).format(new Date(selected.startAt))}
            </p>
          )}
          <p className="subtle">
            {selected?.type === "task_due"
              ? "Đây là hạn hoàn thành của công việc."
              : selected?.type === "exam"
                ? "Ngày thi được lấy từ thành phần đánh giá."
                : "Bạn có thể quản lý sự kiện trong lịch."}
          </p>
        </div>
      </Modal>
      <ConfirmDialog
        open={Boolean(deletingEvent)}
        title="Xóa sự kiện?"
        description={`Sự kiện “${deletingEvent?.title ?? ""}” sẽ bị xóa khỏi lịch.`}
        onCancel={() => setDeletingEvent(null)}
        onConfirm={remove}
        loading={mutations.remove.isPending}
      />
    </div>
  );
}

function TodayAgenda({ items, loading, error, onCreate, onSelect, onRetry }: { items: CalendarItem[]; loading: boolean; error: boolean; onCreate: () => void; onSelect: (item: CalendarItem) => void; onRetry: () => void }) {
  return <aside className="calendar-agenda" aria-label="Lịch hôm nay">
    <header><p className="eyebrow">HÔM NAY</p><h2>Lịch trong ngày</h2></header>
    {loading
      ? <div className="calendar-agenda-loading"><Skeleton height={48} /><Skeleton height={48} /><Skeleton height={48} /></div>
      : error
        ? <ErrorState compact title="Không thể tải lịch hôm nay." action={<Button variant="secondary" onClick={onRetry}>Thử lại</Button>} />
        : items.length
          ? <div className="calendar-agenda-list">{items.map((item) => <button key={`${item.type}-${item.sourceEntity.id}-${item.startAt}`} type="button" className={`calendar-agenda-item calendar-agenda-item-${item.type}${item.scheduleType ? ` calendar-agenda-item-schedule-${item.scheduleType}` : ""}`} onClick={() => onSelect(item)}><time>{timeLabel(item.startAt)}</time><span><strong>{item.title}</strong><small>{calendarItemLabel(item)}</small></span></button>)}</div>
          : <CalendarAgendaEmpty onCreate={onCreate} />}
    <footer aria-hidden="true"><span className="calendar-agenda-branch" /></footer>
  </aside>
}

function CalendarAgendaEmpty({ onCreate }: { onCreate: () => void }) {
  return <div className="calendar-agenda-empty">
    <div className="calendar-agenda-empty-art" aria-hidden="true"><img className="calendar-agenda-empty-cloud nature-cloud--drift" src={natureEmptyStateAssets.calendar.cloud} alt="" width={64} height={36} /><NatureMascot animal="robin" motion="perch" size={72} className="calendar-agenda-empty-robin" /><NatureFlora name="bush" width={72} height={72} className="calendar-agenda-empty-bush" /></div>
    <h3>Chưa có sự kiện trong ngày này.</h3>
    <Button onClick={onCreate}><Plus size={16} /> Thêm lịch học</Button>
  </div>
}
