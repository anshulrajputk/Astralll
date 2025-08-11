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

const TOKEN = process.env.TOKEN;i
const PREFIX = '!';

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

// Keep-alive ping
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
    GatewayIntentBits.GuildPresences
  ]
});

client.once('ready', () => {
  console.log(`${client.user.tag} is online!`);
});

// Welcome message
client.on('guildMemberAdd', member => {
  const channel = member.guild.systemChannel;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(welcomeSettings.title)
    .setDescription(welcomeSettings.description)
    .setColor('#00faff')
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

// Message commands
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // HELP COMMAND
  if (message.content === `${PREFIX}help`) {
    const embed = new EmbedBuilder()
      .setColor('#00faff')
      .setAuthor({
        name: 'AstralX',
        iconURL: 'https://files.catbox.moe/84j0t8.png'
      })
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
      .setImage('https://cdn.discordapp.com/attachments/1404284248713592874/1404404916944113754/standard_3.gif?ex=689b1180&is=6899c000&hm=25b0b7a180931ebceec06b64e04adb3caf7bc51d3d9bfb45ee66e2a7b9c3faa4&')
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
      return message.reply({ content: '❌ You do not have permission to manage messages.', allowedMentions: { repliedUser: false } });

    const args = message.content.split(/\s+/);
    if (!args[1]) return message.reply({ content: '❌ Please specify amount or "all".', allowedMentions: { repliedUser: false } });

    if (args[1].toLowerCase() === 'all') {
      try {
        const fetched = await message.channel.messages.fetch({ limit: 100 });
        await message.channel.bulkDelete(fetched, true);
        const confirmMsg = await message.channel.send({ embeds: [new EmbedBuilder().setColor('#2CFF05').setDescription('<:t_:1404452236637114429> Deleted up to 100 recent messages.')] });
        setTimeout(() => confirmMsg.delete().catch(() => { }), 5000);
      } catch {
        message.channel.send({ content: '❌ Failed to delete messages.', allowedMentions: { repliedUser: false } });
      }
      return;
    }

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 1 || amount > 100) return message.reply({ content: '❌ Please provide an amount between 1 and 100 or "all".', allowedMentions: { repliedUser: false } });

    try {
      await message.channel.bulkDelete(amount, true);
      const confirmMsg = await message.channel.send({ embeds: [new EmbedBuilder().setColor('#2CFF05').setDescription(`<:t_:1404452236637114429> Deleted **${amount}** messages.`)] });                                      
      setTimeout(() => confirmMsg.delete().catch(() => { }), 5000);
    } catch {
      message.channel.send({ content: '❌ Failed to delete messages.', allowedMentions: { repliedUser: false } });
    }
  }

  // NUKE COMMAND
  else if (message.content === `${PREFIX}nuke`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply({ content: '❌ You do not have permission to manage channels.', allowedMentions: { repliedUser: false } });

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
        .setStyle(ButtonStyle.Success)
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
      return message.reply({ content: '❌ You do not have permission to manage roles.', allowedMentions: { repliedUser: false } });

    const args = message.content.split(/\s+/);
    const member = message.mentions.members.first();
    const role = message.mentions.roles.first();

    if (!member) return message.reply({ content: '❌ Please mention a member to assign a role.', allowedMentions: { repliedUser: false } });
    if (!role) return message.reply({ content: '❌ Please mention a role to assign.', allowedMentions: { repliedUser: false } });

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({ content: '❌ I cannot assign that role because it is higher or equal to my highest role.', allowedMentions: { repliedUser: false } });
    }

    if (message.member.roles.highest.position <= role.position) {
      return message.reply({ content: '❌ You cannot assign a role higher or equal to your highest role.', allowedMentions: { repliedUser: false } });
    }

    try {
      await member.roles.add(role);
      const embed = new EmbedBuilder()
        .setColor('#00faff')
        .setTitle('Role Assigned')
        .setDescription(`Successfully assigned role ${role} to member ${member}.`)
        .setFooter({ text: 'AstralX', iconURL: message.author.displayAvatarURL({ dynamic: true }) });
      return message.channel.send({ embeds: [embed] });
    } catch {
      return message.reply({ content: '❌ Failed to assign role.', allowedMentions: { repliedUser: false } });
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'nuke_confirm') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ content: '❌ You do not have permission to manage channels.', ephemeral: true });
    }

    try {
      const channel = interaction.channel;
      await channel.clone();
      const newChannel = channel.guild.channels.cache.find(c => c.name === channel.name && c.id !== channel.id);
      await channel.delete();
      return interaction.reply({ content: `<:t_:1404452236637114429> Channel has been nuked and recreated: ${newChannel}`, ephemeral: true });
    } catch {
      return interaction.reply({ content: '❌ Failed to nuke the channel.', ephemeral: true });
    }
  }

  if (interaction.customId === 'nuke_cancel') {
    if (interaction.message.deletable) {
      await interaction.message.delete();
    }
    return interaction.reply({ content: '❌ Nuke cancelled.', ephemeral: true });
  }
});

client.login(TOKEN);
         


                                                                              








