import type { ReactNode } from 'react'
import { GraduationCap } from 'lucide-react'

export function AuthLayout({ children }: { children: ReactNode }) { return <div className="auth-layout"><div className="auth-layout-brand"><span className="brand-mark"><GraduationCap size={20} /></span><span>StudyFlow</span></div>{children}<div className="auth-layout-foot">Học tập rõ ràng hơn, từng bước một.</div></div> }
