import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { natureAssets } from '../config/natureAssets'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <aside
        className="auth-showcase"
        aria-labelledby="auth-showcase-title"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(232, 240, 227, .72), rgba(238, 244, 232, .2)), url("${natureAssets.scenes.pastelMeadowSignboard}")` }}
      >
        <div className="auth-showcase-content">
          <img
            className="auth-showcase-logo"
            src={natureAssets.brand.logoMark}
            alt="StudyFlow"
            width={84}
            height={84}
            loading="eager"
            decoding="async"
          />
          <div className="auth-showcase-copy">
            <p className="auth-showcase-eyebrow">KHÔNG GIAN HỌC TẬP CỦA BẠN</p>
            <h1 id="auth-showcase-title">Học có kế hoạch,<br /><em>tiến bộ có nhịp.</em></h1>
            <p>Gom lịch học, công việc và mục tiêu vào một nơi rõ ràng hơn.</p>
          </div>
          <ul className="auth-showcase-highlights" aria-label="Điểm nổi bật của StudyFlow">
            <li><span><Check size={15} aria-hidden="true" /></span><strong>Lịch học rõ ràng</strong><small>Biết mình cần làm gì tiếp theo.</small></li>
            <li><span><Check size={15} aria-hidden="true" /></span><strong>Tiến bộ từng bước</strong><small>Duy trì nhịp học vừa sức mỗi ngày.</small></li>
            <li><span><Check size={15} aria-hidden="true" /></span><strong>Tập trung đúng lúc</strong><small>Gom việc học vào những khoảng phù hợp.</small></li>
          </ul>
        </div>
      </aside>
      <div className="auth-layout-content">{children}</div>
    </div>
  )
}
