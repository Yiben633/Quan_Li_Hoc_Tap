import { natureAssets } from '../config/natureAssets'

export function Logo() {
  return <div className="brand">
    <img className="brand-logo" src={natureAssets.brand.logoFull} alt="StudyFlow" />
  </div>
}
