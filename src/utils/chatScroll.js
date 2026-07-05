export function isNearBottom(scrollArea, threshold = 80) {
  if (!scrollArea) {
    return true
  }

  const distanceFromBottom =
    scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight

  return distanceFromBottom <= threshold
}

export function getAutoScrollAction({
  wasNearBottom,
  previousCount,
  currentCount,
  newestRole,
  currentIsLoading
}) {
  const messageWasAdded = currentCount > previousCount

  if (messageWasAdded && newestRole === 'user') {
    return 'bottom'
  }

  if (messageWasAdded && newestRole === 'assistant') {
    return wasNearBottom ? 'assistant-start' : 'none'
  }

  if (currentIsLoading && wasNearBottom) {
    return 'bottom'
  }

  return 'none'
}
