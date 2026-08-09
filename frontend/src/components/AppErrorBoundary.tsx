import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

type Props = { children: ReactNode }
type State = { failed: boolean }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('StudyFlow render error', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="system-page" role="alert">
      <span className="system-page-icon danger"><AlertTriangle size={26} /></span>
      <h1>StudyFlow gặp sự cố hiển thị</h1>
      <p>Thông tin của bạn không bị thay đổi. Hãy tải lại ứng dụng để tiếp tục.</p>
      <button type="button" className="button primary" onClick={() => window.location.reload()}><RotateCcw size={17} /> Tải lại ứng dụng</button>
    </main>
  }
}
