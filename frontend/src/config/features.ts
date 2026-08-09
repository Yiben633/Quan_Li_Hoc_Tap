const aiProvider = import.meta.env.VITE_AI_PROVIDER?.trim().toLowerCase()

export const aiFeaturesEnabled = import.meta.env.VITE_AI_ENABLED === 'true'
  && Boolean(aiProvider)
  && aiProvider !== 'disabled'

export const configuredAiProvider = aiFeaturesEnabled ? aiProvider : undefined
