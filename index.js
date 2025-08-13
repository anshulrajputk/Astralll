const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');

const express = require('express');
const path = require('path');
require('dotenv').config();

const TOKEN = process.env.TOKEN;

// Require welcome command module
const welcomeCmd = require('./commands/welcome');

// --- After your other requires ---
const musicCommand = require('./commands/music'); // single music file

// default prefix
let PREFIX = '!';

// --- Express setup ---
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'dashboard')));
app.use(express.json());

let welcomeSettings = {
  title: 'Welcome to the server!',
  description: 'Have a great time here!',
};

app.get('/api/welcome', (req, res) => res.json(welcomeSettings));

app.post('/api/welcome', (req, res) => {
  welcomeSettings = req.body;
  res.json({ status: 'success', data: welcomeSettings });
});

app.get('/', (req, res) => res.send('Bot is alive!'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Webserver running on port ${PORT}`);
});

// Keep-alive ping (5 minutes)
setInterval(() => {
  const http = require('http');
  http.get(`http://localhost:${PORT}/`, () => {
    console.log('Keep-alive ping sent');
  }).on('error', (err) => console.log('Keep-alive error:', err.message));
}, 5 * 60 * 1000);

// --- Discord Bot setup ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ]
});

client.once('ready', () => {
  console.log(`${client.user.tag} is online!`);

  // Listening to statuses
  const activities = [
    { name: '!help', type: 2 }, // LISTENING
    { name: 'AstralX Your Multipurpose Bot do !help', type: 2 }
  ];

  let i = 0;
  setInterval(() => {
    client.user.setActivity(activities[i]);
    i = (i + 1) % activities.length;
  }, 10000);
});

// --- Welcome message on member join using DB ---
client.on('guildMemberAdd', member => {
  const db = require('./utils/db').loadDB();
  const guildId = member.guild.id;

  if (!db[guildId] || !db[guildId].status) return; // Welcome disabled or not set

  const channelId = db[guildId].channel;
  if (!channelId) return;

  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(db[guildId].title || 'Welcome!')
    .setDescription(db[guildId].description || `Glad to have you here, ${member.user}! Enjoy your stay!`)
    .setColor('#00faff')
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

// --- Message commands handler ---

    if (!message.member.permissions.has(Permisclient.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const sendError = (text) => {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setDescription(`<:cross:1404801104872738936> | ${text}`);
    return message.channel.send({ embeds: [embed] });
  };

  const sendSuccess = (text) => {
    const embed = new EmbedBuilder()
      .setColor('#2CFF05')
      .setDescription(`<:tick:1404612664038265006> | ${text}`);
    return message.channel.send({ embeds: [embed] });
  };

  // --- MUSIC COMMAND ---
  if (message.content.startsWith(`${PREFIX}music`)) {
    const args = message.content.slice(PREFIX.length).trim().split(/ +/g);
    args.shift(); // remove the command itself
    return musicCommand.run(client, message, args);
  }

  // PREFIX CHANGE COMMAND
  if (message.content.startsWith(`${PREFIX}setprefix`)) { 
  }sionsBitField.Flags.ManageGuild)) {
      return sendError('You do not have permission to change the prefix.');
    }
    const args = message.content.split(/\s+/);
    if (!args[1]) return sendError('Please provide a new prefix.');
    PREFIX = args[1];
    return sendSuccess(`Prefix has been changed to \`${PREFIX}\``);
  }

  // WELCOME SETUP COMMAND
  if (message.content.startsWith(`${PREFIX}setup welcome`)) {
    await welcomeCmd.run(client, message);
    return;
  }

  // HELP COMMAND
  if (message.content === `${PREFIX}help`) {
    const embed = new EmbedBuilder()
      .setColor('#00faff')
      .setAuthor({ name: 'AstralX', iconURL: 'https://files.catbox.moe/84j0t8.png' })
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTitle('Prefix & Slash Commands Info')
      .setDescription(
        `• **Server Prefix:** \`${PREFIX}\`\n` +
        `• **Command Type:** Works with both **Prefix & Slash**\n\n` +
        `<:head:1404441425453514814> **__My Commands:__**\n` +
        `> <:antinuke:1404440300273008703> \`:\` **Antinuke**\n` +
        `> <:automod:1404441015250849915> \`:\` **Automod**\n` +
        `> <:utility:1404443195181629585> \`:\` **Config**\n` +
        `> <:extra:1404442477070651502> \`:\` **Extra**\n` +
        `> <:dumb:1404442563422851163> \`:\` **Fun**\n` +
        `> <:info:1404442532602970203> \`:\` **Information**\n` +
        `> <:moderation:1404442504845332520> \`:\` **Moderation**\n` +
        `> <:music:1404443059999080449> \`:\` **Music**\n` +
        `> <:playlist:1404442968840081470> \`:\` **Playlists**\n` +
        `> <:autorole:1404442940243181668> \`:\` **Profile**\n` +
        `> <:autorole:1404442940243181668> \`:\` **Role**\n` +
        `> <:utility:1404441956037165147> \`:\` **Utility**\n` +
        `> <:volup:1404443196519612559> \`:\` **Voice**\n` +
        `> <:welcome:1404443195856650281> \`:\` **Welcome**\n` +
        `> <:giveaway:1404420200371191828> \`:\` **Giveaway**\n` +
        `> <:ticket:1404420115008851999> \`:\` **Ticket**`
      )
      .setImage('https://cdn.discordapp.com/attachments/1404284248713592874/1404401022016950313/standard_2.gif')
      .setFooter({ text: 'AstralX', iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help-category')
        .setPlaceholder('Select a Command Category')
        .addOptions([
          { label: 'Antinuke', value: 'antinuke', emoji: '<:antinuke:1395712971354804266>' },
          { label: 'Automod', value: 'automod', emoji: '<:automod:1368545884136013824>' },
          { label: 'Config', value: 'config', emoji: '<:utility:1369525259098656809>' },
          { label: 'Extra', value: 'extra', emoji: '<:extra:1395706131682164927>' },
          { label: 'Fun', value: 'fun', emoji: '<:dumb:1368548200532938793>' },
          { label: 'Information', value: 'information', emoji: '<:info:1368557726447439983>' },
          { label: 'Moderation', value: 'moderation', emoji: '<:moderation:1369523757055479818>' },
          { label: 'Music', value: 'music', emoji: '<:music:1369523861107769364>' },
          { label: 'Playlists', value: 'playlists', emoji: '<:playlist:1369524616288014346>' },
          { label: 'Profile', value: 'profile', emoji: '<:autorole:1368545900917424259>' },
          { label: 'Role', value: 'role', emoji: '<:autorole:1368545900917424259>' },
          { label: 'Utility', value: 'utility', emoji: '<:utility:1369525259098656809>' },
          { label: 'Voice', value: 'voice', emoji: '<:volup:1369525408353222767>' },
          { label: 'Welcome', value: 'welcome', emoji: '<:welcome:1369525441135771669>' },
          { label: 'Giveaway', value: 'giveaways', emoji: '<:giveaway:1404420200371191828>' },
          { label: 'Ticket', value: 'ticket', emoji: '<:ticket:1404420115008851999>' }
        ])
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // OWNER COMMAND
  else if (message.content === `${PREFIX}owner`) {
    const embed = new EmbedBuilder()
      .setColor('#00faff')
      .setTitle('Owner Info')
      .setDescription('**My Owner Is** **__GodSpiderz__**')
      .setImage('https://cdn.discordapp.com/attachments/1404284248713592874/1404404916944113754/standard_3.gif')
      .setFooter({ text: 'AstralX', iconURL: message.author.displayAvatarURL({ dynamic: true }) });
    return message.channel.send({ embeds: [embed] });
  }

  // PROFILE COMMAND
  else if (message.content.startsWith(`${PREFIX}profile`)) {
    const member = message.mentions.members.first() || message.member;
    const user = member.user;
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const createdAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`;
    const joinedAt = member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'N/A';

    const embed = new EmbedBuilder()
      .setColor('#00faff')
      .setAuthor({ name: user.tag, iconURL: avatarURL })
      .setThumbnail(avatarURL)
      .addFields(
        { name: 'Account Created', value: createdAt, inline: true },
        { name: 'Joined Server', value: joinedAt, inline: true }
      )
      .setFooter({ text: 'AstralX', iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Download Avatar')
        .setStyle(ButtonStyle.Link)
        .setURL(avatarURL)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // PURGE COMMAND
  else if (message.content.startsWith(`${PREFIX}purge`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return sendError('You do not have permission to manage messages.');

    const args = message.content.split(/\s+/);
    if (!args[1]) return sendError('Please specify amount or "all".');

    if (args[1].toLowerCase() === 'all') {
      try {
        const fetched = await message.channel.messages.fetch({ limit: 100 });
        await message.channel.bulkDelete(fetched, true);
        return sendSuccess('Deleted up to 100 recent messages.');
      } catch (error) {
        console.error(error);
        return sendError('Failed to delete messages.');
      }
    }

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 1 || amount > 100)
      return sendError('Please provide an amount between 1 and 100 or "all".');

    try {
      await message.channel.bulkDelete(amount, true);
      return sendSuccess(`Deleted **${amount}** messages.`);
    } catch (error) {
      console.error(error);
      return sendError('Failed to delete messages.');
    }
  }

  // NUKE COMMAND
  else if (message.content === `${PREFIX}nuke`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return sendError('You do not have permission to manage channels.');

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Confirm Channel Nuke')
      .setDescription('Are you sure you want to nuke this channel? All messages will be deleted!')
      .setColor('#00faff')
      .setFooter({ text: 'AstralX', iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nuke_confirm')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('nuke_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // INFO COMMAND
  else if (message.content === `${PREFIX}info`) {
    const guild = message.guild;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const totalMembers = guild.memberCount;
    const totalRoles = guild.roles.cache.size;
    const onlineCount = guild.members.cache.filter(m => m.presence?.status === 'online').size;
    const offlineCount = totalMembers - onlineCount;

    const embed = new EmbedBuilder()
      .setTitle(`${guild.name} Server Info`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setColor('#00faff')
      .addFields(
        { name: 'Total Members', value: totalMembers.toString(), inline: true },
        { name: 'Boosts', value: boostCount.toString(), inline: true },
        { name: 'Online Members', value: onlineCount.toString(), inline: true },
        { name: 'Offline Members', value: offlineCount.toString(), inline: true },
        { name: 'Total Roles', value: totalRoles.toString(), inline: true },
      )
      .setFooter({ text: 'AstralX', iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    return message.channel.send({ embeds: [embed] });
  }

  // MC COMMAND
  else if (message.content === `${PREFIX}mc`) {
    const guild = message.guild;
    const totalMembers = guild.memberCount;

    const embed = new EmbedBuilder()
      .setTitle(guild.name)
      .setColor('#00faff')
      .setDescription(`**__Total Members__** : ${totalMembers}`)
      .setFooter({ text: 'AstralX', iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    return message.channel.send({ embeds: [embed] });
  }

  // ROLE COMMAND
  else if (message.content.startsWith(`${PREFIX}role`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return sendError('You do not have permission to manage roles.');

    const args = message.content.split(/\s+/);
    const member = message.mentions.members.first();
    const role = message.mentions.roles.first();

    if (!member) return sendError('Please mention a member to assign a role.');
    if (!role) return sendError('Please mention a role to assign.');

    if (role.position >= message.guild.members.me.roles.highest.position)
      return sendError('I cannot assign that role because it is higher or equal to my highest role.');

    if (message.member.roles.highest.position <= role.position)
      return sendError('You cannot assign a role higher or equal to your highest role.');

    try {
      await member.roles.add(role);
      return sendSuccess(`Successfully assigned role ${role} to member ${member}.`);
    } catch (error) {
      console.error(error);
      return sendError('Failed to assign role.');
    }
  }
});

// --- Interaction handler ---
client.on('interactionCreate', async interaction => {
  // Handle welcome buttons
  if (interaction.isButton()) {
    await welcomeCmd.buttons(client, interaction);
  }

  const sendError = (text) => {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setDescription(`<:cross:1404801104872738936> | ${text}`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  };

  const sendSuccess = (text) => {
    const embed = new EmbedBuilder()
      .setColor('#2CFF05')
      .setDescription(`<:tick:1404612664038265006> | ${text}`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  };

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'help-category') {
      return sendSuccess(`You selected: ${interaction.values[0]}`);
    }
  }

  if (!interaction.isButton()) return;

  if (interaction.customId === 'nuke_confirm') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return sendError('You do not have permission to manage channels.');

    try {
      const channel = interaction.channel;
      await channel.clone();
      const newChannel = channel.guild.channels.cache.find(c => c.name === channel.name && c.id !== channel.id);
      await channel.delete();
      return sendSuccess(`Channel nuked and recreated: ${newChannel}`);
    } catch (error) {
      console.error(error);
      return sendError('Failed to nuke the channel.');
    }
  }

  if (interaction.customId === 'nuke_cancel') {
    if (interaction.message.deletable) await interaction.message.delete
    return sendSuccess('Nuke cancelled.');
  }
});

client.login(TOKEN);


