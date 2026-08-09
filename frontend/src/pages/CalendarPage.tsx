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
import toast from "react-hot-toast";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Modal,
  Select,
  Skeleton,
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
import { getVietnamDateTimeParts, toVietnamIso } from "../utils/calendarTime";

const labels: Record<CalendarItem["type"], string> = {
  schedule: "Lịch",
  event: "Sự kiện",
  task_due: "Hạn công việc",
  exam: "Kỳ thi",
};
const weekdays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
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
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(() => new Date());
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
  const query = useCalendarQuery(view, date);
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
      <div className="page-heading">
        <div>
          <p className="eyebrow">LỊCH CỦA BẠN</p>
          <h1>Lịch</h1>
          <p className="subtle">
            Sự kiện, hạn công việc và những mốc quan trọng trong một nơi.
          </p>
        </div>
        <Button onClick={() => openCreate(anchor)}>
          <Plus size={16} /> Tạo sự kiện
        </Button>
      </div>
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
          <strong>
            {anchor.toLocaleDateString("vi-VN", {
              month: "long",
              year: "numeric",
            })}
          </strong>
        </div>
        <Select
          customMenu
          value={view}
          onChange={(event) => setView(event.target.value as CalendarView)}
          aria-label="Chế độ xem"
        >
          <option value="day">Ngày</option>
          <option value="week">Tuần</option>
          <option value="month">Tháng</option>
        </Select>
      </section>
      {query.isLoading ? (
        <Skeleton height={520} />
      ) : query.isError ? (
        <EmptyState
          title="Không thể tải lịch"
          description="Kiểm tra kết nối rồi thử lại."
          action={<Button onClick={() => query.refetch()}>Thử lại</Button>}
        />
      ) : (
        <section className={`panel calendar-grid calendar-view-${view}`}>
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
                  className={`calendar-cell${cell.getMonth() !== anchor.getMonth() && view === "month" ? " is-outside" : ""}`}
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
                        className={`calendar-item calendar-item-${item.type}`}
                        style={
                          {
                            "--item-color": item.colorHex ?? undefined,
                          } as React.CSSProperties
                        }
                        draggable={item.type === "event"}
                        onDragStart={() => setDraggedEvent(item)}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelected(item);
                        }}
                      >
                        <span className="calendar-item-dot" />
                        <span>{item.title}</span>
                        <small>
                          {item.type !== "task_due" && timeLabel(item.startAt)}
                        </small>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
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
            {selected ? labels[selected.type] : ""}
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
