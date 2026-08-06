import { z } from 'zod'

const password = z.string().min(8, 'Mật khẩu cần ít nhất 8 ký tự').max(128, 'Mật khẩu quá dài')
export const loginSchema = z.object({ email: z.string().trim().email('Email không hợp lệ'), password: z.string().min(1, 'Vui lòng nhập mật khẩu'), remember: z.boolean().default(false) })
export const registerSchema = z.object({ fullName: z.string().trim().min(2, 'Họ tên cần ít nhất 2 ký tự').max(120), email: z.string().trim().email('Email không hợp lệ'), studentCode: z.string().trim().max(50, 'Mã sinh viên quá dài').optional().or(z.literal('')), password, confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'), school: z.string().trim().max(160).optional().or(z.literal('')), major: z.string().trim().max(160).optional().or(z.literal('')), courseYear: z.preprocess((value) => value === '' ? undefined : value, z.coerce.number().int('Năm học phải là số nguyên').min(1900, 'Năm học không hợp lệ').max(2200, 'Năm học không hợp lệ').optional()) }).refine((value) => value.password === value.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' })
export const emailSchema = z.object({ email: z.string().trim().email('Email không hợp lệ') })
export const otpSchema = emailSchema.extend({ otp: z.string().regex(/^\d{6}$/, 'OTP phải gồm đúng 6 chữ số') })
export const resetPasswordSchema = otpSchema.extend({ newPassword: password, confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu') }).refine((value) => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: 'Mật khẩu nhập lại không khớp' })
export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
