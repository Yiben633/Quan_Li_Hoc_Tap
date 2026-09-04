import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, CheckSquare2, Clock3, Route, Sparkles } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { NatureMascot } from '../components/nature'
import { natureAssets } from '../config/natureAssets'
import { useAuthStore } from '../stores/authStore'

const features = [
  { icon: BookOpen, title: 'Quản lý môn học', description: 'Giữ tài liệu, mục tiêu và tiến độ của từng môn trong một không gian rõ ràng.' },
  { icon: Route, title: 'Lập kế hoạch học tập', description: 'Chia mục tiêu lớn thành những chặng nhỏ có thể bắt đầu ngay hôm nay.' },
  { icon: CheckSquare2, title: 'Theo dõi công việc', description: 'Biết việc nào đang chờ, việc nào cần ưu tiên và bước tiếp theo là gì.' },
  { icon: CalendarDays, title: 'Lịch học trực quan', description: 'Sắp xếp lớp học, hạn nộp và phiên tự học trong một lịch nhẹ nhàng.' },
  { icon: Clock3, title: 'Pomodoro tập trung', description: 'Tạo những khoảng tập trung vừa sức để việc học có nhịp hơn.' },
  { icon: Sparkles, title: 'AI Coach hỗ trợ', description: 'Khi khả dụng, AI giúp bạn xem trước một kế hoạch để tự quyết định.' },
]

const workflow = [
  ['01', 'Gom lại', 'Đưa môn học, công việc và lịch học về cùng một nơi.'],
  ['02', 'Chia nhỏ', 'Biến mục tiêu thành những việc vừa sức và có thời điểm rõ ràng.'],
  ['03', 'Giữ nhịp', 'Mỗi ngày hoàn thành một bước nhỏ, rồi nhìn lại tiến độ của mình.'],
]

export function LandingPage() {
  const accessToken = useAuthStore((state) => state.accessToken)

  if (accessToken) return <Navigate to="/dashboard" replace />

  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <div className="landing-container landing-navbar-inner">
          <a className="landing-brand" href="#top" aria-label="StudyFlow - về đầu trang">
            <img src={natureAssets.brand.logoMark} alt="" width={36} height={36} />
            <span>StudyFlow</span>
          </a>
          <nav className="landing-nav-links" aria-label="Điều hướng landing page">
            <a href="#features">Tính năng</a>
            <a href="#workflow">Cách hoạt động</a>
            <a href="#experience">Trải nghiệm</a>
          </nav>
          <div className="landing-nav-actions">
            <Link className="landing-login-link" to="/login">Đăng nhập</Link>
            <Link className="landing-start-button" to="/register">Bắt đầu <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="landing-hero">
          <div className="landing-container landing-hero-grid">
            <div className="landing-hero-copy">
              <p className="landing-eyebrow">MỘT KHÔNG GIAN HỌC CÓ NHỊP</p>
              <h1>Học có kế hoạch,<br /><em>tiến bộ nhẹ nhàng.</em></h1>
              <p className="landing-hero-lead">StudyFlow giúp bạn gom lịch học, công việc và mục tiêu vào một nơi rõ ràng hơn.</p>
              <div className="landing-hero-actions">
                <Link className="landing-button landing-button-primary" to="/register">Tạo không gian học <ArrowRight size={17} aria-hidden="true" /></Link>
                <a className="landing-button landing-button-secondary" href="#workflow">Khám phá cách hoạt động</a>
              </div>
              <p className="landing-hero-note"><CheckCircle2 size={15} aria-hidden="true" /> Bắt đầu từ một bước nhỏ hôm nay.</p>
            </div>
            <div className="landing-hero-visual" aria-hidden="true">
              <div className="landing-hero-glow" />
              <div className="landing-hero-mountain landing-hero-mountain-back" />
              <div className="landing-hero-mountain landing-hero-mountain-front" />
              <div className="landing-hero-lake" />
              <img className="landing-hero-cloud" src={natureAssets.effects.cloud01} alt="" width={220} height={110} loading="eager" decoding="async" />
              <div className="landing-hero-preview">
                <span>BẢN XEM TRƯỚC</span>
                <strong>Nhịp học của bạn</strong>
                <div className="landing-hero-preview-lines"><i /><i /><i /></div>
                <small>Rõ ràng hơn từng bước</small>
              </div>
              <NatureMascot animal="fox" motion="study" size={128} priority className="landing-hero-fox" />
            </div>
          </div>
        </section>

        <section className="landing-feature-band" aria-label="Tổng quan StudyFlow">
          <div className="landing-container landing-feature-band-grid">
            <p>Ít rối hơn trong đầu.<br /><strong>Rõ ràng hơn trong ngày.</strong></p>
            <div><span>Không gian môn học</span><span>Kế hoạch theo chặng</span><span>Khoảng tập trung</span></div>
          </div>
        </section>

        <section className="landing-section landing-features" id="features">
          <div className="landing-container">
            <div className="landing-section-heading">
              <div><p className="landing-eyebrow">MỌI THỨ Ở ĐÚNG CHỖ</p><h2>Một nhịp học dễ nhìn,<br /><em>dễ bắt đầu.</em></h2></div>
              <p>Không cần làm mọi thứ cùng lúc. Chỉ cần nhìn thấy bước tiếp theo.</p>
            </div>
            <div className="landing-feature-grid">
              {features.map(({ icon: Icon, title, description }) => <article className="landing-feature-item" key={title}><span className="landing-feature-icon"><Icon size={19} aria-hidden="true" /></span><h3>{title}</h3><p>{description}</p></article>)}
            </div>
          </div>
        </section>

        <section className="landing-section landing-experience" id="experience">
          <div className="landing-container landing-experience-grid">
            <div className="landing-experience-visual" aria-hidden="true">
              <div className="landing-paper-card landing-paper-card-back" />
              <div className="landing-paper-card landing-paper-card-main"><span className="landing-paper-kicker">HÔM NAY</span><strong>Chọn một việc để bắt đầu</strong><span className="landing-paper-line wide" /><span className="landing-paper-line" /><span className="landing-paper-line short" /><div className="landing-paper-check"><CheckCircle2 size={15} /><span>Ôn lại bài hôm qua</span></div></div>
            </div>
            <div className="landing-experience-copy"><p className="landing-eyebrow">NATURE LEARNING EXPERIENCE</p><h2>Nhẹ mắt để<br /><em>tập trung lâu hơn.</em></h2><p>Giao diện sáng, khoảng thở vừa đủ và những dấu mốc nhỏ giúp bạn quay lại với điều quan trọng.</p><Link className="landing-text-link" to="/register">Tạo không gian của bạn <ArrowRight size={15} aria-hidden="true" /></Link></div>
          </div>
        </section>

        <section className="landing-section landing-workflow" id="workflow">
          <div className="landing-container">
            <div className="landing-section-heading landing-section-heading-centered"><div><p className="landing-eyebrow">WORKFLOW</p><h2>Từ mục tiêu lớn đến<br /><em>một bước vừa sức.</em></h2></div><p>StudyFlow giúp hành trình học tập hiện ra theo từng chặng, không phải một danh sách vô tận.</p></div>
            <div className="landing-workflow-grid">{workflow.map(([number, title, description]) => <article className="landing-workflow-item" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
          </div>
        </section>

        <section className="landing-section landing-showcase">
          <div className="landing-container">
            <div className="landing-section-heading"><div><p className="landing-eyebrow">NHỮNG KHOẢNG HỌC QUEN THUỘC</p><h2>Một nơi cho<br /><em>cả hành trình.</em></h2></div><p>Những công cụ bạn cần cho ngày học bình thường, được đặt cạnh nhau một cách yên tĩnh.</p></div>
            <div className="landing-showcase-grid">
              <article className="landing-showcase-card landing-showcase-card-wide"><div><span className="landing-showcase-icon"><CalendarDays size={19} /></span><h3>Lịch học</h3><p>Nhìn tuần học của bạn trong một trang giấy rõ ràng.</p></div><div className="landing-mini-calendar" aria-hidden="true"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><i /><i /><i /><i /></div></article>
              <article className="landing-showcase-card"><span className="landing-showcase-icon"><Clock3 size={19} /></span><h3>Pomodoro</h3><p>Một khoảng tập trung. Một việc đang làm.</p><div className="landing-timer" aria-hidden="true">25:00</div></article>
              <article className="landing-showcase-card landing-showcase-card-dark"><span className="landing-showcase-icon"><Sparkles size={19} /></span><h3>AI Coach</h3><p>Khi khả dụng, xem trước kế hoạch rồi tự quyết định.</p><span className="landing-showcase-quiet">Gợi ý có thể xem lại</span></article>
            </div>
          </div>
        </section>

        <section className="landing-voice">
          <div className="landing-container landing-voice-inner"><p>“Một bước nhỏ mỗi ngày<br /><em>sẽ tạo thành quãng đường dài.”</em></p><span className="landing-voice-leaf" aria-hidden="true" /></div>
        </section>

        <section className="landing-final-cta">
          <div className="landing-container"><p className="landing-eyebrow">SẴN SÀNG BẮT ĐẦU?</p><h2>Ngày học của bạn<br /><em>có thể bắt đầu từ đây.</em></h2><p>Gom lại điều quan trọng và đi từng bước theo nhịp của riêng bạn.</p><Link className="landing-button landing-button-primary" to="/register">Bắt đầu với StudyFlow <ArrowRight size={17} aria-hidden="true" /></Link></div>
        </section>
      </main>

      <footer className="landing-footer"><div className="landing-container landing-footer-inner"><div className="landing-brand landing-footer-brand"><img src={natureAssets.brand.logoMark} alt="" width={30} height={30} /><span>StudyFlow</span></div><p>Một bước nhỏ mỗi ngày.</p><div><Link to="/login">Đăng nhập</Link><Link to="/register">Đăng ký</Link></div></div></footer>
    </div>
  )
}
