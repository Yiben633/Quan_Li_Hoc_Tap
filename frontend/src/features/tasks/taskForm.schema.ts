import { z } from 'zod'

const optionalText = z.preprocess((value) => typeof value === 'string' && value.trim() ? value.trim() : null, z.string().nullable())
const optionalInteger = (minimum: number, maximum?: number) => z.preprocess(
  (value) => value === '' || value === undefined || value === null ? null : Number(value),
  maximum === undefined
    ? z.number().int().min(minimum, `Giá trị phải từ ${minimum} trở lên`).nullable()
    : z.number().int().min(minimum, `Giá trị phải từ ${minimum} trở lên`).max(maximum, `Giá trị không được vượt quá ${maximum}`).nullable(),
)

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tên công việc'),
  description: optionalText,
  subjectId: optionalText,
  studyPlanId: optionalText,
  startDate: optionalText,
  dueDate: optionalText,
  estimatedMinutes: optionalInteger(0),
  difficulty: optionalInteger(1, 5),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['todo', 'in_progress', 'waiting', 'done']),
}).superRefine((value, context) => {
  if (value.startDate && value.dueDate && value.dueDate < value.startDate) {
    context.addIssue({ code: 'custom', path: ['dueDate'], message: 'Hạn hoàn thành cần sau hoặc trùng ngày bắt đầu' })
  }
})

export type TaskFormValues = z.output<typeof taskFormSchema>
