const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { loadDB, saveDB } = require('../utils/db');

// Icons (custom emojis)
const enabledIcon = '<a:Dot:1404991890784256050>';
const disabledIcon = '<a:red_point:1404991936657358999>';
const tickIcon = '<:tick:1404612664038265006>';
const crossIcon = '<:cross:1404801104872738936>';

module.exports = {
  name: 'welcome',
  description: 'Setup welcome system',
  
  run: async (client, message) => {
    let db = loadDB();
    let guildId = message.guild.id;

    if (!db[guildId]) db[guildId] = { status: false, channel: null };
    saveDB(db);

    const statusText = db[guildId].status ? `${enabledIcon} Enabled` : `${disabledIcon} Disabled`;
    const channelText = db[guildId].channel ? `<#${db[guildId].channel}>` : 'Not set';

    const setupEmbed = new EmbedBuilder()
      .setColor('#2B2D31')
      .setTitle('Welcome System Setup')
      .setDescription(`**Channel:** ${channelText}\n**Status:** ${statusText}`)
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({ text: message.guild.name })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('set_channel').setLabel('Set Channel').setStyle(ButtonStyle.Secondary).setEmoji('📺'),
      new ButtonBuilder().setCustomId('toggle_status').setLabel(db[guildId].status ? 'Disable' : 'Enable').setStyle(db[guildId].status ? ButtonStyle.Danger : ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('test_welcome').setLabel('Test').setStyle(ButtonStyle.Primary).setEmoji('🧪')
    );

    await message.channel.send({ embeds: [setupEmbed], components: [row1, row2] });
  },

  buttons: async (client, interaction) => {
    let db = loadDB();
    let guildId = interaction.guild.id;

    if (!db[guildId]) db[guildId] = { status: false, channel: null };

    if (interaction.customId === 'toggle_status') {
      db[guildId].status = !db[guildId].status;
      saveDB(db);
      return interaction.reply({ content: `${db[guildId].status ? tickIcon : crossIcon} | Welcome system is now **${db[guildId].status ? 'enabled' : 'disabled'}**.`, ephemeral: true });
    }

    if (interaction.customId === 'set_channel') {
      await interaction.reply({ content: '📺 | Mention the channel where you want welcome messages.', ephemeral: true });

      const filter = m => m.author.id === interaction.user.id && m.mentions.channels.first();
      interaction.channel.awaitMessages({ filter, max: 1, time: 15000, errors: ['time'] })
        .then(collected => {
          const channel = collected.first().mentions.channels.first();
          if (!channel || channel.type !== ChannelType.GuildText) {
            return interaction.followUp({ content: `${crossIcon} | Invalid channel.`, ephemeral: true });
          }
          db[guildId].channel = channel.id;
          saveDB(db);
          interaction.followUp({ content: `${tickIcon} | Welcome channel set to ${channel}`, ephemeral: true });
        })
        .catch(() => {
          interaction.followUp({ content: '⏰ | Timed out. Please try again.', ephemeral: true });
        });
    }

    if (interaction.customId === 'test_welcome') {
      const channelId = db[guildId].channel;
      if (!channelId) return interaction.reply({ content: `${crossIcon} | No channel set.`, ephemeral: true });

      const channel = interaction.guild.channels.cache.get(channelId);
      if (!channel) return interaction.reply({ content: `${crossIcon} | Channel not found.`, ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor('#2B2D31')
        .setTitle('Welcome!')
        .setDescription(`Glad to have you here, ${interaction.user}!\nEnjoy your stay!`)
        .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

      channel.send({ embeds: [embed] });
      return interaction.reply({ content: `${tickIcon} | Test welcome sent.`, ephemeral: true });
    }
  }
};
