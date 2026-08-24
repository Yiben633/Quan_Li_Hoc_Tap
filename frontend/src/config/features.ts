const featureFlag = import.meta.env.VITE_AI_ENABLED?.trim().toLowerCase()
const aiProvider = import.meta.env.VITE_AI_PROVIDER?.trim().toLowerCase() || 'mock'

// The backend ships with MockAIProvider, so the coach is usable without a public AI key.
// Deployments can still explicitly hide it with VITE_AI_ENABLED=false or VITE_AI_PROVIDER=disabled.
export const aiFeaturesEnabled = featureFlag !== 'false' && aiProvider !== 'disabled'

export const configuredAiProvider = aiFeaturesEnabled ? aiProvider : undefined
