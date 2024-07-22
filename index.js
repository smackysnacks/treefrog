require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const { checkForCodes } = require('./notify');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const token = process.env.TOKEN;
const prefix = config.prefix;

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.name, command);
}


client.once('ready', () => {
    console.log('Bot is online!');

    setInterval(() => {
        checkForCodes(client);
    }, 3600000);

    const restartPath = path.join(__dirname, 'restart.json');
    if (fs.existsSync(restartPath)) {
        const restartData = JSON.parse(fs.readFileSync(restartPath, 'utf8'));
        const channel = client.channels.cache.get(restartData.channelId);

        if (channel) {
            channel.send("I'm back!").catch(console.error);
        }

        fs.unlinkSync(restartPath);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) return;

    const command = client.commands.get(commandName);

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
    }
});

client.login(token);
