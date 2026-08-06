import { useMutation } from '@tanstack/react-query'
import { login, register, requestOtp, resetPassword, verifyOtp } from './auth.api'
export const useLoginMutation = () => useMutation({ mutationFn: login })
export const useRegisterMutation = () => useMutation({ mutationFn: register })
export const useRequestOtpMutation = () => useMutation({ mutationFn: requestOtp })
export const useVerifyOtpMutation = () => useMutation({ mutationFn: ({ email, otp }: { email: string; otp: string }) => verifyOtp(email, otp) })
export const useResetPasswordMutation = () => useMutation({ mutationFn: ({ email, otp, newPassword }: { email: string; otp: string; newPassword: string }) => resetPassword(email, otp, newPassword) })
