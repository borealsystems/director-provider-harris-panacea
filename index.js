import ConnectionProviderSerial from '../../connectionProviders/ConnectionProviderSerial'

class DeviceProviderHarrisPanacea extends ConnectionProviderSerial {
  constructor (_device) {
    super(_device)
    this.levels = []
  }

  static providerRegistration = {
    id: 'DeviceProviderHarrisPanacea',
    label: 'Harris Panacea Router',
    manufacturer: 'Harris',
    protocol: 'Serial',
    description: 'The fully programmable Panacea router offers comprehensive format coverage, including HD-SDI, SDI/ASI, AES, and analogue video and audio in a flexible array of matrix sizes.',
    category: 'Router',
    parameters: this.parameters,
    constructor: DeviceProviderHarrisPanacea
  }

  providerFunctions = () => new Promise(resolve => {
    const levelArray = [
      { id: '00', label: 'SDI', disabled: true },
      { id: '01', label: 'ANALOG AUDIO', disabled: true }
    ]
    if (this.levels.length === 0) {
      this.serialport.write('INFORMATION\r\n')
      const levelData = []
      const listener = data => {
        levelData.push(data)
        if (data.match(/Level 15: ((\d\d\dx\d\d\d)|(-------))/gm)) {
          this.parser.removeListener('data', listener)
          levelData.join('\n').match(/\d\d: \d\d\dx\d\d\d/gm).map(level => { levelArray[Number(level.slice(0, 2))].disabled = false })
          this.levels = levelArray
        }
      }
      this.parser.addListener('data', listener)
    }
    resolve([
      {
        id: 'crosspoint',
        label: 'Crosspoint Route',
        parameters: [
          {
            inputType: 'comboBox',
            label: 'Level',
            id: 'level',
            items: this.levels.length === 0 ? levelArray : this.levels,
            required: true,
            placeholder: 'Router Level',
            tooltip: 'The Router Level is typically which signal this XPT will switch.'
          },
          {
            inputType: 'numberInput',
            id: 'dst',
            label: 'Destination',
            required: true,
            placeholder: 'Destination',
            min: 1
          },
          {
            inputType: 'numberInput',
            id: 'src',
            label: 'Source',
            required: true,
            placeholder: 'Source',
            min: 1
          }
        ]
      }
    ])
  })

  interface = (_action) => {
    switch (_action.providerFunction.id) {
      case 'crosspoint': // Clear Composition
        this.connectionProviderInterface({
          message: `LEVEL ${_action.parameters.level.id}`
        })
        this.connectionProviderInterface({
          message: `SOURCE ${_action.parameters.src}`
        })
        this.connectionProviderInterface({
          message: `DESTINATION ${_action.parameters.dst}`
        })
        break
    }
  }
}

export default DeviceProviderHarrisPanacea
