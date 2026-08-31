import { natureAssets } from '../config/natureAssets'

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return <div className={`brand${collapsed ? ' brand-collapsed' : ''}`}>
    <img className="brand-logo brand-logo-full" src={natureAssets.brand.logoFull} alt="StudyFlow" width={142} height={48} />
    <img className="brand-logo brand-logo-mark" src={natureAssets.brand.logoMark} alt="StudyFlow" width={40} height={40} />
  </div>
}
