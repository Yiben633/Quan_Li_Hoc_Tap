const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'PRE', 'CODE', 'A'])

export function sanitizeNoteHtml(value: string) {
  const document = new DOMParser().parseFromString(value, 'text/html')
  for (const element of Array.from(document.body.querySelectorAll('*'))) {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      continue
    }
    for (const attribute of Array.from(element.attributes)) {
      const allowedLink = element.tagName === 'A' && ['href', 'target', 'rel'].includes(attribute.name.toLowerCase())
      if (!allowedLink) element.removeAttribute(attribute.name)
    }
    if (element.tagName === 'A') {
      const href = element.getAttribute('href') ?? ''
      if (!/^(https?:|mailto:)/i.test(href)) element.removeAttribute('href')
      else { element.setAttribute('target', '_blank'); element.setAttribute('rel', 'noopener noreferrer') }
    }
  }
  return document.body.innerHTML
}
