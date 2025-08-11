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
const PREFIX = '!';

// --- Express setup ---
const app = express();
const PORT = process.env.PORT || 3000;

// Serve dashboard static files (if you have any)
app.use(express.static(path.join(__dirname, 'dashboard')));

// Middleware to parse JSON body
app.use(express.json());

// In-memory welcome settings (default)
let welcomeSettings = {
  title: 'Welcome to the server!',
  description: 'Have a great time here!',
  // Add other fields as needed
};

// API endpoints for dashboard
app.get('/api/welcome', (req, res) => {
  res.json(welcomeSettings);
});

app.post('/api/welcome', (req, res) => {
  // TODO: Add validation if you want
  welcomeSettings = req.body;
  res.json({ status: 'success', data: welcomeSettings });
});

// Basic healthcheck route
app.get('/', (req, res) => {
  res.send('Bot is alive!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Webserver running on port ${PORT}`);
});

// Keep-alive function to prevent the bot from sleeping
setInterval(() => {
  const http = require('http');
  http.get(`http://localhost:${PORT}/`, (res) => {
    console.log('Keep-alive ping sent');
  }).on('error', (err) => {
    console.log('Keep-alive error:', err.message);
  });
}, 5 * 60 * 1000); // Ping every 5 minutes

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

// Welcome new members with dynamic embed using welcomeSettings
client.on('guildMemberAdd', member => {
  const channel = member.guild.systemChannel;
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle(welcomeSettings.title)
    .setDescription(welcomeSettings.description)
    .setColor(0xff0000)
    .setTimestamp();

  channel.send({ embeds: [embed] });
});

// Message commands handler
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // HELP COMMAND
  if (message.content === `${PREFIX}help`) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setAuthor({
        name: 'AstralX',
        iconURL: 'https://files.catbox.moe/wjy92c.png'
      })
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTitle('Prefix & Slash Commands Info')
      .setDescription(
        `â€¢ **Server Prefix:** \`${PREFIX}\`\n` +
        `â€¢ **Command Type:** Works with both **Prefix & Slash**\n\n` +
        `**My Commands:**\n` +
        'ðŸ›¡ï¸ : Antinuke\n' +
        'ðŸ›¡ï¸ : Automod\n' +
        'âš™ï¸ : Config\n' +
        'ðŸ“‚ : Extra\n' +
        'ðŸ˜„ : Fun\n' +
        'â„¹ï¸ : Information\n' +
        'ðŸ”¨ : Moderation\n' +
        'ðŸŽµ : Music\n' +
        'ðŸ‘¤ : Profile\n' +
        'ðŸŽ­ : Role\n' +
        'ðŸ”§ : Utility\n' +
        'ðŸŽ™ï¸ : Voice\n' +
        'ðŸ‘‹ : Welcome'
      )
      .setImage('https://cdn.discordapp.com/attachments/1399652585622999080/1403998391825862747/standard.gif')
      .setFooter({
        text: `AstralX â€¢ Loved by ${client.guilds.cache.size} Servers â€¢ Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true })
      });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help-category')
        .setPlaceholder('ðŸ“‚ Select a Command Category')
        .addOptions([
          { label: 'Antinuke', value: 'antinuke', emoji: 'ðŸ›¡ï¸' },
          { label: 'Automod', value: 'automod', emoji: 'ðŸ›¡ï¸' },
          { label: 'Config', value: 'config', emoji: 'âš™ï¸' },
          { label: 'Extra', value: 'extra', emoji: 'ðŸ“‚' },
          { label: 'Fun', value: 'fun', emoji: 'ðŸ˜„' },
          { label: 'Information', value: 'information', emoji: 'â„¹ï¸' },
          { label: 'Moderation', value: 'moderation', emoji: 'ðŸ”¨' },
          { label: 'Music', value: 'music', emoji: 'ðŸŽµ' },
          { label: 'Profile', value: 'profile', emoji: 'ðŸ‘¤' },
          { label: 'Role', value: 'role', emoji: 'ðŸŽ­' },
          { label: 'Utility', value: 'utility', emoji: 'ðŸ”§' },
          { label: 'Voice', value: 'voice', emoji: 'ðŸŽ™ï¸' },
          { label: 'Welcome', value: 'welcome', emoji: 'ðŸ‘‹' }
        ])
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }

  // OWNER COMMAND
  else if (message.content === `${PREFIX}owner`) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('Owner Info')
      .setDescription('My Owner Is **__GodSpiderz__**')
      .setImage('https://cdn.discordapp.com/attachments/1399599107856666722/1404035904774996052/Pi7_GIF_CMP.gif')
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true })
      });
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
      .setColor(0x00AE86)
      .setAuthor({ name: user.tag, iconURL: avatarURL })
      .setThumbnail(avatarURL)
      .addFields(
        { name: 'Account Created', value: createdAt, inline: true },
        { name: 'Joined Server', value: joinedAt, inline: true }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

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
      return message.reply({ content: 'âŒ You do not have permission to manage messages.', allowedMentions: { repliedUser: false } });

    const args = message.content.split(/\s+/);
    if (!args[1]) return message.reply({ content: 'âŒ Please specify amount or "all".', allowedMentions: { repliedUser: false } });

    if (args[1].toLowerCase() === 'all') {
      try {
        const fetched = await message.channel.messages.fetch({ limit: 100 });
        await message.channel.bulkDelete(fetched, true);
        const confirmMsg = await message.channel.send({ embeds: [new EmbedBuilder().setColor(0x00AE86).setDescription('ðŸ§¹ Deleted up to 100 recent messages.')] });
        setTimeout(() => confirmMsg.delete().catch(() => { }), 5000);
      } catch {
        message.channel.send({ content: 'âŒ Failed to delete messages.', allowedMentions: { repliedUser: false } });
      }
      return;
    }

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 1 || amount > 100) return message.reply({ content: 'âŒ Please provide an amount between 1 and 100 or "all".', allowedMentions: { repliedUser: false } });

    try {
      await message.channel.bulkDelete(amount, true);
      const confirmMsg = await message.channel.send({ embeds: [new EmbedBuilder().setColor(0x00AE86).setDescription(`ðŸ§¹ Deleted **${amount}** messages.`)] });
      setTimeout(() => confirmMsg.delete().catch(() => { }), 5000);
    } catch {
      message.channel.send({ content: 'âŒ Failed to delete messages.', allowedMentions: { repliedUser: false } });
    }
  }

  // NUKE COMMAND
  else if (message.content === `${PREFIX}nuke`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels))
      return message.reply({ content: 'âŒ You do not have permission to manage channels.', allowedMentions: { repliedUser: false } });

    const embed = new EmbedBuilder()
      .setTitle('âš ï¸ Confirm Channel Nuke')
      .setDescription('Are you sure you want to nuke this channel? All messages will be deleted!')
      .setColor(0xFF0000);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nuke_confirm')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId('nuke_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Success),
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
      .setColor(0x0099FF)
      .addFields(
        { name: 'Total Members', value: totalMembers.toString(), inline: true },
        { name: 'Boosts', value: boostCount.toString(), inline: true },
        { name: 'Online Members', value: onlineCount.toString(), inline: true },
        { name: 'Offline Members', value: offlineCount.toString(), inline: true },
        { name: 'Total Roles', value: totalRoles.toString(), inline: true },
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

    return message.channel.send({ embeds: [embed] });
  }

  // MC COMMAND
  else if (message.content === `${PREFIX}mc`) {
    const guild = message.guild;
    const totalMembers = guild.memberCount;

    const embed = new EmbedBuilder()
      .setTitle(guild.name)
      .setColor(0x0099FF)
      .setDescription(`**__Total Members__** : ${totalMembers}`);

    return message.channel.send({ embeds: [embed] });
  }

  // ROLE COMMAND
  else if (message.content.startsWith(`${PREFIX}role`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles))
      return message.reply({ content: 'âŒ You do not have permission to manage roles.', allowedMentions: { repliedUser: false } });

    const args = message.content.split(/\s+/);
    const member = message.mentions.members.first();
    const role = message.mentions.roles.first();

    if (!member) return message.reply({ content: 'âŒ Please mention a member to assign a role.', allowedMentions: { repliedUser: false } });
    if (!role) return message.reply({ content: 'âŒ Please mention a role to assign.', allowedMentions: { repliedUser: false } });

    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply({ content: 'âŒ I cannot assign that role because it is higher or equal to my highest role.', allowedMentions: { repliedUser: false } });
    }

    if (message.member.roles.highest.position <= role.position) {
      return message.reply({ content: 'âŒ You cannot assign a role higher or equal to your highest role.', allowedMentions: { repliedUser: false } });
    }

    try {
      await member.roles.add(role);
      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle('Role Assigned')
        .setDescription(`Successfully assigned role ${role} to member ${member}.`)
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });
      return message.channel.send({ embeds: [embed] });
    } catch {
      return message.reply({ content: 'âŒ Failed to assign role.', allowedMentions: { repliedUser: false } });
    }
  }
});

// Interaction handler for buttons (like nuke confirm/cancel)
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'nuke_confirm') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ content: 'âŒ You do not have permission to manage channels.', ephemeral: true });
    }

    try {
      const channel = interaction.channel;
      await channel.clone();
      const newChannel = channel.guild.channels.cache.find(c => c.name === channel.name && c.id !== channel.id);
      await channel.delete();
      return interaction.reply({ content: `ðŸ’¥ Channel has been nuked and recreated: ${newChannel}`, ephemeral: true });
    } catch {
      return interaction.reply({ content: 'âŒ Failed to nuke the channel.', ephemeral: true });
    }
  }

  if (interaction.customId === 'nuke_cancel') {
    if (interaction.message.deletable) {
      await interaction.message.delete();
    }
    return interaction.reply({ content: 'âŒ Nuke cancelled.', ephemeral: true });
  }
});

client.login(TOKEN);
