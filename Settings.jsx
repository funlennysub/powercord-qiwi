const { React, i18n: { Messages } } = require('powercord/webpack');
const { Category, SwitchItem, TextInput } = require('powercord/components/settings');

module.exports = class Settings extends React.Component {

    constructor (props) {
        super(props);
        this.plugin = powercord.pluginManager.get('powercord-qiwi');
        this.state = {
            settingsOpened: false,
        };
    }
    render() {
        const { getSetting, toggleSetting, updateSetting } = this.props;
        return (
          <div>
              <Category
                  name={Messages.QIWI_PLUGIN_SETTINGS_CATEGORY_NAME}
                  opened={this.state.settingsOpened}
                  onChange={() => this.setState({ settingsOpened: !this.state.settingsOpened })}
              >
                  <TextInput
                      note={Messages.QIWI_PLUGIN_SETTINGS_OAUTH_DESC}
                      defaultValue = {getSetting('token')}
                      className='qiwi-settings-fields'
                      required={true}
                      onChange={val => updateSetting('token', val)}
                  >
                      {Messages.QIWI_PLUGIN_SETTINGS_OAUTH}
                  </TextInput>
                  <TextInput
                      note={Messages.QIWI_PLUGIN_SETTINGS_PERSON_ID_DESC}
                      defaultValue = {getSetting('personId')}
                      className='qiwi-settings-fields'
                      required={true}
                      onChange={val => updateSetting('personId', val)}
                  >
                      {Messages.QIWI_PLUGIN_SETTINGS_PERSON_ID}
                  </TextInput>
              </Category>
          </div>
        );
    }
};