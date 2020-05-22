export function sortStrings (str1, str2) {
  str1 = (str1 || '').toString().toLowerCase()
  str2 = (str2 || '').toString().toLowerCase()
  if (str1 < str2) { return -1 }
  if (str1 > str2) { return 1 }
  return 0
}

export function indexesOf (str, search, caseSensitive) {
  const out = []
  if (!search || !search.length || !str || !str.length) { return out }
  if (!caseSensitive) {
    str = str.toLowerCase()
    search = search.toLowerCase()
  }
  let index = 0
  let startIndex = 0
  while ((index = str.indexOf(search, startIndex)) !== -1) {
    out.push(index)
    startIndex = index + search.length
  }
  return out
}

export function wrapWith (str, search, startTag, endTag) {
  const indexes = indexesOf(str, search)
  indexes.reverse().forEach((i) => {
    str = str.substr(0, i) + startTag + str.substr(i, search.length) + endTag + str.substr(i + search.length)
  })
  return str
}

export function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
