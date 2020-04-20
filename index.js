const { Plugin } = require('powercord/entities');
const { React, i18n: { Messages } } = require('powercord/webpack');
const http = require('powercord/http');
const moment = require('moment');
const { resolve } = require('path');
const Settings = require('./Settings.jsx');

module.exports = class Qiwi extends Plugin {

    startPlugin () {
        powercord.api.i18n.loadAllStrings(require('./i18n/index'));
        this.registerSettings('powercord-qiwi', () => Messages.QIWI_PLUGIN_NAME, Settings);
        this.loadCSS(resolve(__dirname, 'style.css'));
       this.registerCommand('qiwi', [], 'Checks your Qiwi Account balance and latest IN and OUT operation.', '{c}', this.qiwi.bind(this));
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
        const req = http.get(`https://edge.qiwi.com/funding-sources/v2/persons/${wallet}/accounts`);
        req.opts.headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token
        }; // Thx zziger#8040 for this part ^
        const oIN = http.get(`https://edge.qiwi.com/payment-history/v2/persons/${wallet}/payments?operation=IN&rows=1`);
        const oOUT = http.get(`https://edge.qiwi.com/payment-history/v2/persons/${wallet}/payments?operation=OUT&rows=1`);
        oIN.opts.headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token
        };
        oOUT.opts.headers = {
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + token
        };
        try {
        const {body} = await req.execute();
        const {body: body_in} = await oIN.execute();
        const {body: body_out} = await oOUT.execute();
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
};