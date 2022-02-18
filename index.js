const { Client } = require("discord.js"),
    fetch = require("node-fetch"),
    config = require('./config');

require('colors');

const sleep = (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));

const date = () => {
    const date = new Date();
    return date.getHours().toString().padStart(2, "0") + ":" +
        date.getMinutes().toString().padStart(2, "0") + ":" +
        date.getSeconds().toString().padStart(2, "0")
}

process.log = (input, error) => {
    console.log(`[${date().yellow.bold}] [${error ? 'DJS'.red.bold : 'DJS'.blue.bold}] ${input}`);
}

const client = new Client();

client.on('ready', async () => {
    process.log(`Connecter en tant que ${client.user.tag}`);

    const { guildId, highestRoleId, interval } = config;

    const guild = client.guilds.get(guildId);
    if (!guild) {
        process.log('Impossible de trouver le serveur', true)
        return;
    }

    const highestRole = guild.roles.get(highestRoleId);
    if (!highestRole) {
        process.log('Impossible de trouver le rôle le plus haut', true)
        return;
    }

    const roles = [...guild.roles.values()]
        .filter(r => r.id !== guild.defaultRole.id)
        .filter(r => r.position < highestRole.position);

    while (true) {

        const mappedRoles = roles
            .reverse()
            .map((role) => {
                let position = role.position + Math.round(roles.length / 2) + 1;

                if (position > roles.length)
                    position = (roles.length - role.position) + 1;

                return {
                    ...role,
                    position
                };
            })
            .map(({ id, position }) => ({ id, position }));

        (() => {
            return new Promise(async (resolve, reject) => {
                fetch('https://discord.com/api/v9/guilds/' + guild.id + '/roles', {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': client.token,
                        'origin': 'discord.com',
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'same-origin',
                        'user-agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
                    },
                    body: JSON.stringify(mappedRoles)
                })
                    .then(response => response.json())
                    .then(json => {
                        if (json.code)
                            reject(json);
                        else
                            resolve(json);
                    })
                    .catch(reject)
            })
        })().then(() => {
            process.log(`J'ai modifier la position de ${mappedRoles.length} rôles`);
        }).catch(() => {
            process.log(`Je n'ai pas pu modifier la position de ${mappedRoles.length} rôles`, true);
        })

        await sleep(interval);

    }
})

client.on('rateLimit', (info) => process.log(info, true));

client.login(config.token);