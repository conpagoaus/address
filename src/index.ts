import XRegExp, { NamedGroupsArray } from 'xregexp'
import { Directional, Street_Type, State_Code } from './constants'
import { capitalize, flatten, invert, keys, each, values } from './utils'
import fastJson from 'fast-json-stringify'
import stringSimilarity from 'string-similarity'
import schema from './schema.json'

let Addr_Match: any = {}

XRegExp.install('namespacing')

export type Address = {
  number: string
  street: string
  type: string
  sec_unit_type: string
  sec_unit_num: string
  city: string
  state: string
  postcode: string
}

let Direction_Code: any
let initialized = false

const Normalize_Map = {
  prefix: Directional,
  prefix1: Directional,
  prefix2: Directional,
  suffix: Directional,
  suffix1: Directional,
  suffix2: Directional,
  type: Street_Type,
  type1: Street_Type,
  type2: Street_Type,
  state: State_Code
}

function lazyInit() {
  if (initialized) {
    return
  }
  initialized = true

  Direction_Code = invert(Directional)

  Addr_Match = {
    type: flatten(Street_Type)
      .sort()
      .filter(function (v, i, arr) {
        return arr.indexOf(v) === i
      })
      .join('|'),
    fraction: '\\d+\\/\\d+',
    state:
      '\\b(?:' +
      keys(State_Code)
        .concat(values(State_Code))
        .map(XRegExp.escape)
        .join('|') +
      ')\\b',
    direct: values(Directional)
      .sort((a: string, b: string) => (a.length < b.length ? -1 : 1))
      .reduce(function (prev, curr) {
        return prev.concat([XRegExp.escape(curr.replace(/\w/g, '$&.')), curr])
      }, keys(Directional))
      .join('|'),
    dircode: keys(Direction_Code).join('|'),
    postcode: '(?<postcode>\\d{4})',
    corner: '(?:\\band\\b|\\bat\\b|&|\\@)'
  }

  Addr_Match.number = '(?<number>(\\d+-?\\d*))(?=\\D)'

  Addr_Match.street =
    '                                       \n\
    (?:                                                       \n\
      (?:(?<street_0>' +
    Addr_Match.direct +
    ')\\W+               \n\
          (?<type_0>' +
    Addr_Match.type +
    ')\\b                    \n\
      )                                                       \n\
      |                                                       \n\
      (?:(?<prefix_0>' +
    Addr_Match.direct +
    ')\\W+)?             \n\
      (?:                                                     \n\
        (?<street_1>[^,]*\\d)                                 \n\
        (?:[^\\w,]*(?<suffix_1>' +
    Addr_Match.direct +
    ')\\b)     \n\
        |                                                     \n\
        (?<street_2>[^,]+)                                    \n\
        (?:[^\\w,]+(?<type_2>' +
    Addr_Match.type +
    ')\\b)         \n\
        (?:[^\\w,]+(?<suffix_2>' +
    Addr_Match.direct +
    ')\\b)?    \n\
        |                                                     \n\
        (?<street_3>[^,]+?)                                   \n\
        (?:[^\\w,]+(?<type_3>' +
    Addr_Match.type +
    ')\\b)?        \n\
        (?:[^\\w,]+(?<suffix_3>' +
    Addr_Match.direct +
    ')\\b)?    \n\
      )                                                       \n\
    )'

  Addr_Match.po_box = 'p\\W*(?:[om]|ost\\ ?office)\\W*b(?:ox)?'

  Addr_Match.sec_unit_type_numbered =
    '             \n\
    (?<sec_unit_type_1>su?i?te                      \n\
      |' +
    Addr_Match.po_box +
    '                        \n\
      |(?:ap|dep)(?:ar)?t(?:me?nt)?                 \n\
      |ro*m                                         \n\
      |flo*r?                                       \n\
      |uni?t                                        \n\
      |bu?i?ldi?n?g                                 \n\
      |ha?nga?r                                     \n\
      |lo?t                                         \n\
      |pier                                         \n\
      |slip                                         \n\
      |spa?ce?                                      \n\
      |stop                                         \n\
      |le?ve?l?                                     \n\
      |tra?i?le?r                                   \n\
      |box)(?![a-z]                                 \n\
    )                                               \n\
    '

  Addr_Match.sec_unit_type_unnumbered =
    '           \n\
    (?<sec_unit_type_2>ba?se?me?n?t                 \n\
      |fro?nt                                       \n\
      |lo?bby                                       \n\
      |lowe?r                                       \n\
      |off?i?ce?                                    \n\
      |pe?n?t?ho?u?s?e?                             \n\
      |rear                                         \n\
      |side                                         \n\
      |uppe?r                                       \n\
    )\\b'

  Addr_Match.sec_unit =
    '                               \n\
    (?:                               #fix3             \n\
      (?:                             #fix1             \n\
        (?:                                             \n\
          (?:' +
    Addr_Match.sec_unit_type_numbered +
    '\\W*) \n\
          |(?<sec_unit_type_3>\\#)\\W*                  \n\
        )                                               \n\
        (?<sec_unit_num_1>[\\w-]+)                      \n\
      )                                                 \n\
      |                                                 \n\
      ' +
    Addr_Match.sec_unit_type_unnumbered +
    '           \n\
    )'

  Addr_Match.city_and_state =
    '                       \n\
    (?:                                               \n\
      (?<city>[^\\d,]+?)\\W+                          \n\
      (?<state>' +
    Addr_Match.state +
    ')                  \n\
    )                                                 \n\
    '

  Addr_Match.place =
    '                                \n\
    (?:' +
    Addr_Match.city_and_state +
    '\\W*)?            \n\
    (?:' +
    Addr_Match.postcode +
    ')?                           \n\
    '

  Addr_Match.address = XRegExp(
    '                      \n\
    ^                                                 \n\
    [^\\w\\#]*                                        \n\
    (' +
      Addr_Match.number +
      ')\\W*                       \n\
    (?:' +
      Addr_Match.fraction +
      '\\W*)?                  \n\
        ' +
      Addr_Match.street +
      '\\W+                      \n\
    (?:' +
      Addr_Match.sec_unit +
      ')?\\W*          #fix2   \n\
        ' +
      Addr_Match.place +
      '                           \n\
    \\W*$',
    'ix'
  )

  const sep = '(?:\\W+|$)' // no support for \Z

  Addr_Match.informal_address = XRegExp(
    '                   \n\
    ^                                                       \n\
    \\s*                                                    \n\
    (?:' +
      Addr_Match.sec_unit +
      sep +
      ')?                        \n\
    (?:' +
      Addr_Match.number +
      ')?\\W*                          \n\
    (?:' +
      Addr_Match.fraction +
      '\\W*)?                        \n\
        ' +
      Addr_Match.street +
      sep +
      '                            \n\
    (?:' +
      Addr_Match.sec_unit.replace(/_\d/g, '$&1') +
      sep +
      ')?  \n\
    (?:' +
      Addr_Match.place +
      ')?                               \n\
    ',
    'ix'
  )

  Addr_Match.po_address = XRegExp(
    '                         \n\
    ^                                                       \n\
    \\s*                                                    \n\
    (?:' +
      Addr_Match.sec_unit.replace(/_\d/g, '$&1') +
      sep +
      ')?  \n\
    (?:' +
      Addr_Match.place +
      ')?                               \n\
    ',
    'ix'
  )

  Addr_Match.intersection = XRegExp(
    '                     \n\
    ^\\W*                                                 \n\
    ' +
      Addr_Match.street.replace(/_\d/g, '1$&') +
      '\\W*?      \n\
    \\s+' +
      Addr_Match.corner +
      '\\s+                         \n\
    ' +
      Addr_Match.street.replace(/_\d/g, '2$&') +
      '($|\\W+) \n\
    ' +
      Addr_Match.place +
      '\\W*$',
    'ix'
  )
}
const normalize_address = function (parts: NamedGroupsArray | undefined) {
  lazyInit()
  if (!parts) return null
  const parsed: any = {}

  Object.keys(parts).forEach((k) => {
    if (['input', 'index'].indexOf(k) !== -1 || isFinite(Number(k))) return
    const key = isFinite(Number(k.split('_').pop()))
      ? k.split('_').slice(0, -1).join('_')
      : k
    if (parts[k])
      parsed[key] = parts[k].trim().replace(/^\s+|\s+$|[^\w\s\-#&]/g, '')
  })
  each(Normalize_Map, function (map: any, key: any) {
    if (parsed[key] && map[parsed[key].toLowerCase()]) {
      parsed[key] = map[parsed[key].toLowerCase()]
    }
  })
  ;['type', 'type1', 'type2'].forEach((key) => {
    // use short street type
    if (Object.keys(Street_Type).indexOf(parsed[key]) > 0) {
      parsed[key] = Street_Type[parsed[key]]
    }

    if (key in parsed) {
      parsed[key] =
        parsed[key].charAt(0).toUpperCase() + parsed[key].slice(1).toLowerCase()
    }
  })

  if (parsed.city) {
    parsed.city = XRegExp.replace(
      parsed.city,
      XRegExp('^(?<dircode>' + Addr_Match.dircode + ')\\s+(?=\\S)', 'ix'),
      function (match) {
        return capitalize(Direction_Code[match.dircode.toUpperCase()]) + ' '
      }
    )
  }
  return parsed
}

export const parseAddress = function (address: string): Address {
  lazyInit()

  const parts = XRegExp.exec(address, Addr_Match.address)

  return normalize_address(parts?.groups)
}
export const parseInformalAddress = function (address: string): Address {
  lazyInit()

  const parts = XRegExp.exec(address, Addr_Match.informal_address)
  return normalize_address(parts?.groups)
}
export const parsePoAddress = function (address: string) {
  lazyInit()
  const parts = XRegExp.exec(address, Addr_Match.po_address)
  return normalize_address(parts?.groups)
}
export const parseLocation = function (address: string): Address {
  lazyInit()

  if (address.match(/^(\s+)?\d+\/\d+.(\D)/)) {
    address = `unit ${address}`
  }

  return parseAddress(address) || parseInformalAddress(address)
}

export const parseIntersection = function (address: string) {
  lazyInit()
  let parts = XRegExp.exec(address, Addr_Match.intersection)
  parts = normalize_address(parts?.groups)
  if (parts) {
    parts.type2 = parts.type2 || ''
    parts.type1 = parts.type1 || ''
    if ((parts.type2 && !parts.type1) || parts.type1 === parts.type2) {
      let type = parts.type2
      type = XRegExp.replace(type, /s\W*$/, '')
      if (XRegExp('^' + Addr_Match.type + '$', 'ix').test(type)) {
        parts.type1 = parts.type2 = type
      }
    }
  }

  return parts
}

export const normalize = (address: { [key: string]: string }): Address => {
  const stringify = fastJson(schema)
  return stringify(address)
}

export const toString = (address: Address): string => {
  const stringify = fastJson(schema)
  return stringify(address)
}

export const compare = (first: Address, second: Address): number => {
  return stringSimilarity.compareTwoStrings(toString(first), toString(second))
}

export const compareStrings = (first: string, second: string): number => {
  const ad1 = parseLocation(first)

  const ad2 = parseLocation(second)

  return stringSimilarity.compareTwoStrings(toString(ad1), toString(ad2))
}
