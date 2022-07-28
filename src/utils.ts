export function capitalize(s: string) {
  return s && s[0].toUpperCase() + s.slice(1)
}

export function keys(o: object): string[] {
  return Object.keys(o)
}

export function values(o: any): string[] {
  return keys(o).map((k) => o[k])
}

export function each(o: any, fn: any) {
  keys(o).forEach(function (k) {
    fn(o[k], k)
  })
}

export function invert(o: { [key: string]: string }): {
  [key: string]: string
} {
  const o1: { [key: string]: string } = {}
  keys(o).forEach((k: string) => (o1[o[k]] = k))
  return o1
}

export function flatten(o: any) {
  return keys(o).concat(values(o))
}
