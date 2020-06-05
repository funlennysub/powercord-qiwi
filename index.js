const { Plugin } = require('powercord/entities');
const { React, i18n: { Messages } } = require('powercord/webpack');
const http = require('powercord/http');
const moment = require('moment');
const { resolve } = require('path');
const Settings = require('./Settings.jsx');

module.exports = class Qiwi extends Plugin {

    startPlugin () {
        powercord.api.i18n.loadAllStrings(require('./i18n/index'));
        powercord.api.settings.registerSettings('powercord-qiwi', {
            category: this.entityID,
            label: () => Messages.QIWI_PLUGIN_NAME,
            render: Settings
        })
        this.loadStylesheet('./style.css');
        powercord.api.commands.registerCommand({
            command: 'qiwi',
            aliases: [],
            description: 'Checks your Qiwi Account balance and latest IN and OUT operation.',
            usage: '{c}',
            executor: this.qiwi.bind(this)
          })
    }

    async qiwi () {
        const token = this.settings.get('token');
        const wallet = this.settings.get('personId');
        const codes = {
            643: "RUB (₽)",
            840: "USD ($)",
            978: "EUR (€)",
            398: "KZT (₸)"
        };


        try {
            const { body } = await (
                http.get(`https://edge.qiwi.com/funding-sources/v2/persons/${wallet}/accounts`)
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + token)
            );
            const { body: body_in } = await (http.get(`https://edge.qiwi.com/payment-history/v2/persons/${wallet}/payments?operation=IN&rows=1`)
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + token)
            );
            const { body: body_out } = await (
                http.get(`https://edge.qiwi.com/payment-history/v2/persons/${wallet}/payments?operation=OUT&rows=1`)
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + token)
            );

            return {
                send: false,
                result: {
                    type: 'rich',
                    color: parseInt("FF8C00", 16),
                    footer: {
                        text: "QIWI",
                        icon_url: 'https://static.qiwi.com/img/providers/logoBig/99_l.png'
                    },
                    title: body.accounts[0].title,
                    description: Messages.QIWI_PLUGIN_MESSAGE_EMBED_DESC,
                    fields: [
                        ...body.accounts.map(acc => ({
                            name: codes[acc.balance.currency] || 'unknown',
                            value: acc.balance.amount.toString() || 'unknown',
                            inline: true
                        })),
                        { name: Messages.QIWI_PLUGIN_MESSAGE_EMBED_OPERATIONS, value: `• ${moment.parseZone(body_in.data[0].date).locale('ru').format("L")} ⬇ ${Messages.QIWI_PLUGIN_MESSAGE_EMBED_IN} ${body_in.data[0].total.amount} ${codes[body_in.data[0].total.currency]}\n• ${moment.parseZone(body_out.data[0].date).locale('ru').format("L")} ⬆ ${Messages.QIWI_PLUGIN_MESSAGE_EMBED_OUT} ${body_out.data[0].total.amount} ${codes[body_out.data[0].total.currency]}` },
                    ],
                }
            };
        } catch (e) {
            console.log(e);
            return {
                send: false,
                result: `Error while connecting to API, check your token or person ID.`
            }
        }
    }

    pluginWillUnload () {
        powercord.api.commands.unregisterCommand('qiwi')
        powercord.api.settings.unregisterSettings('powercord-qiwi')
      }

};
