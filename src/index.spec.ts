import { parseLocation, compare } from './index'

const addressess: { [key: string]: object } = {
  '9 Mulga St Blackwater QLD 4717': {
    city: 'Blackwater',
    number: '9',
    postcode: '4717',
    state: 'QLD',
    street: 'Mulga',
    type: 'St'
  },
  '2963 Shannons Flat Rd Shannons Flat NSW 2630': {
    city: 'Shannons Flat',
    number: '2963',
    postcode: '2630',
    state: 'NSW',
    street: 'Shannons Flat',
    type: 'Rd'
  },
  '3 Doris St, North Sydney, NSW 206': {
    city: 'North Sydney',
    number: '3',
    state: 'NSW',
    street: 'Doris',
    type: 'St'
  },
  'Level 4/ 235 Macquarie St Sydney NSW 2000': {
    city: 'Sydney',
    number: '235',
    postcode: '2000',
    sec_unit_num: '4',
    sec_unit_type: 'Level',
    state: 'NSW',
    street: 'Macquarie',
    type: 'St'
  },
  'lv 5/235 Macquarie St Sydney NSW 2000': {
    city: 'Sydney',
    number: '235',
    postcode: '2000',
    sec_unit_num: '5',
    sec_unit_type: 'lv',
    state: 'NSW',
    street: 'Macquarie',
    type: 'St'
  },
  'Lv 6 235 Macquarie St Sydney NSW 2000': {
    city: 'Sydney',
    number: '235',
    postcode: '2000',
    sec_unit_num: '6',
    sec_unit_type: 'Lv',
    state: 'NSW',
    street: 'Macquarie',
    type: 'St'
  },
  '20/180-90 Phillip St Sydney NSW 2000': {
    city: 'Sydney',
    number: '180-90',
    postcode: '2000',
    sec_unit_num: '20',
    sec_unit_type: 'unit',
    state: 'NSW',
    street: 'Phillip',
    type: 'St'
  },
  '123-200 Sussex St Sydney NSW 2001': {
    city: 'Sydney',
    number: '123-200',
    postcode: '2001',
    state: 'NSW',
    street: 'Sussex',
    type: 'St'
  },
  '2 Hampden Street, North Sydney, NSW 2060': {
    city: 'North Sydney',
    number: '2',
    postcode: '2060',
    state: 'NSW',
    street: 'Hampden',
    type: 'St'
  },
  'Lot 72 Libercal St Sydney NSW 2000': {
    city: 'Sydney',
    postcode: '2000',
    sec_unit_num: '72',
    sec_unit_type: 'Lot',
    state: 'NSW',
    street: 'Libercal',
    type: 'St'
  },
  '405/2 Marlborough Street, Drummoyne NSW 2047': {
    city: 'Drummoyne',
    number: '2',
    postcode: '2047',
    sec_unit_num: '405',
    sec_unit_type: 'unit',
    state: 'NSW',
    street: 'Marlborough',
    type: 'St'
  },
  '41 Ensfield St Unit 6 Burrington QLD 2000': {
    city: 'Burrington',
    number: '41',
    postcode: '2000',
    sec_unit_num: '6',
    sec_unit_type: 'Unit',
    state: 'QLD',
    street: 'Ensfield',
    type: 'St'
  }
}

describe('addressess', () => {
  test.each(
    Object.keys(addressess).map((k) => ({
      a: k,
      b: parseLocation(k),
      expected: addressess[k]
    }))
  )('$a', ({ b, expected }) => {
    expect(b).toMatchObject(expected)
  })
})

describe('compare', () => {
  test('sameAddress ', () => {
    const sameAddress = compare(
      {
        city: 'Burrington',
        number: '41',
        postcode: '2000',
        sec_unit_num: '6',
        sec_unit_type: 'Unit',
        state: 'QLD',
        street: 'Ensfield',
        type: 'St'
      },
      {
        city: 'Burrington',
        number: '41',
        postcode: '2000',
        sec_unit_num: '6',
        sec_unit_type: 'Unit',
        state: 'QLD',
        street: 'Ensfield',
        type: 'St'
      }
    )

    expect(sameAddress).toEqual(1)
  })

  test('differentAddress ', () => {
    const differentAddress = compare(
      {
        sec_unit_type: 'Level',
        sec_unit_num: '23',
        number: '353',
        street: 'Brunswick',
        type: 'St',
        city: 'Fortitude Valley',
        state: 'QLD',
        postcode: '4006'
      },
      {
        city: 'Burrington',
        number: '41',
        postcode: '2000',
        sec_unit_num: '6',
        sec_unit_type: 'Unit',
        state: 'QLD',
        street: 'Ensfield',
        type: 'St'
      }
    )

    expect(differentAddress).toEqual(0.7820069204152249)
  })
})
