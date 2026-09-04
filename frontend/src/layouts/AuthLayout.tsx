import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { NatureFlora, NatureMascot } from '../components/nature'
import { natureAssets } from '../config/natureAssets'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <aside className="auth-showcase" aria-labelledby="auth-showcase-title">
        <div className="auth-showcase-content">
          <img
            className="auth-showcase-logo"
            src={natureAssets.brand.logoFull}
            alt="StudyFlow"
            width={170}
            height={56}
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
        <div className="auth-showcase-scene" aria-hidden="true">
          <img className="auth-showcase-cloud" src={natureAssets.effects.cloud01} alt="" width={220} height={110} loading="eager" decoding="async" />
          <span className="auth-showcase-mountains" />
          <span className="auth-showcase-lake" />
          <NatureFlora name="bush" width={270} height={270} className="auth-showcase-bush" />
          <NatureMascot animal="fox" motion="none" size={128} priority className="auth-showcase-fox" />
        </div>
      </aside>
      <div className="auth-layout-content">{children}</div>
    </div>
  )
}
