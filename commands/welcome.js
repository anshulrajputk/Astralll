const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadDB, saveDB } = require('../utils/db');

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

    if (!db[guildId]) db[guildId] = {
      status: false,
      channel: null,
      title: 'Welcome to the server!',
      description: 'Have a great time here!',
      footer: message.guild.name,
      thumbnail: message.guild.iconURL({ dynamic: true }),
      image: null,
      color: '#00faff',
    };

    saveDB(db);

    const data = db[guildId];
    const statusText = data.status ? `${enabledIcon} Enabled` : `${disabledIcon} Disabled`;
    const channelText = data.channel ? `<#${data.channel}>` : 'Not set';

    const embed = new EmbedBuilder()
      .setColor(data.color)
      .setTitle(data.title)
      .setDescription(`**Channel:** ${channelText}\n**Status:** ${statusText}\n\n${data.description}`)
      .setThumbnail(data.thumbnail)
      .setImage(data.image)
      .setFooter({ text: data.footer })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('set_channel').setLabel('Set Channel').setStyle(ButtonStyle.Secondary).setEmoji('📺'),
      new ButtonBuilder().setCustomId('toggle_status').setLabel(data.status ? 'Disable' : 'Enable').setStyle(data.status ? ButtonStyle.Danger : ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('edit_title').setLabel('Edit Title').setStyle(ButtonStyle.Primary).setEmoji('✏️'),
      new ButtonBuilder().setCustomId('edit_description').setLabel('Edit Description').setStyle(ButtonStyle.Primary).setEmoji('📝'),
      new ButtonBuilder().setCustomId('edit_footer').setLabel('Edit Footer').setStyle(ButtonStyle.Primary).setEmoji('📜')
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('edit_thumbnail').setLabel('Edit Thumbnail').setStyle(ButtonStyle.Primary).setEmoji('🖼️'),
      new ButtonBuilder().setCustomId('edit_image').setLabel('Edit Image').setStyle(ButtonStyle.Primary).setEmoji('🖼️'),
      new ButtonBuilder().setCustomId('edit_color').setLabel('Edit Color').setStyle(ButtonStyle.Primary).setEmoji('🎨')
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('test_welcome').setLabel('Test Welcome').setStyle(ButtonStyle.Success).setEmoji('🧪')
    );

    await message.channel.send({ embeds: [embed], components: [row1, row2, row3, row4] });
  },

  buttons: async (client, interaction) => {
    let db = loadDB();
    let guildId = interaction.guild.id;
    if (!db[guildId]) return interaction.reply({ content: `${crossIcon} | DB not found. Please run setup again.`, ephemeral: true });

    const data = db[guildId];

    // Helper to update embed and message after changes
    const updateSetupMessage = async () => {
      const statusText = data.status ? `${enabledIcon} Enabled` : `${disabledIcon} Disabled`;
      const channelText = data.channel ? `<#${data.channel}>` : 'Not set';

      const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle(data.title)
        .setDescription(`**Channel:** ${channelText}\n**Status:** ${statusText}\n\n${data.description}`)
        .setThumbnail(data.thumbnail)
        .setImage(data.image)
        .setFooter({ text: data.footer })
        .setTimestamp();

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('set_channel').setLabel('Set Channel').setStyle(ButtonStyle.Secondary).setEmoji('📺'),
        new ButtonBuilder().setCustomId('toggle_status').setLabel(data.status ? 'Disable' : 'Enable').setStyle(data.status ? ButtonStyle.Danger : ButtonStyle.Success)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('edit_title').setLabel('Edit Title').setStyle(ButtonStyle.Primary).setEmoji('✏️'),
        new ButtonBuilder().setCustomId('edit_description').setLabel('Edit Description').setStyle(ButtonStyle.Primary).setEmoji('📝'),
        new ButtonBuilder().setCustomId('edit_footer').setLabel('Edit Footer').setStyle(ButtonStyle.Primary).setEmoji('📜')
      );

      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('edit_thumbnail').setLabel('Edit Thumbnail').setStyle(ButtonStyle.Primary).setEmoji('🖼️'),
        new ButtonBuilder().setCustomId('edit_image').setLabel('Edit Image').setStyle(ButtonStyle.Primary).setEmoji('🖼️'),
        new ButtonBuilder().setCustomId('edit_color').setLabel('Edit Color').setStyle(ButtonStyle.Primary).setEmoji('🎨')
      );

      const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('test_welcome').setLabel('Test Welcome').setStyle(ButtonStyle.Success).setEmoji('🧪')
      );

      try {
        await interaction.message.edit({ embeds: [embed], components: [row1, row2, row3, row4] });
      } catch (e) {
        console.error('Failed to edit setup message:', e);
      }
    };

    if (interaction.customId === 'toggle_status') {
      data.status = !data.status;
      saveDB(db);
      await interaction.reply({ content: `${data.status ? tickIcon : crossIcon} | Welcome system is now **${data.status ? 'enabled' : 'disabled'}**.`, ephemeral: true });
      return updateSetupMessage();
    }

    if (interaction.customId === 'set_channel') {
      await interaction.reply({ content: '📺 | Mention the text channel for welcome messages.', ephemeral: true });
      const filter = m => m.author.id === interaction.user.id && m.mentions.channels.first();
      interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
        .then(collected => {
          const channel = collected.first().mentions.channels.first();
          if (!channel || channel.type !== 0) { // 0 = GuildText in discord.js v14+
            return interaction.followUp({ content: `${crossIcon} | Invalid channel. Please mention a valid text channel.`, ephemeral: true });
          }
          data.channel = channel.id;
          saveDB(db);
          interaction.followUp({ content: `${tickIcon} | Welcome channel set to ${channel}.`, ephemeral: true });
          updateSetupMessage();
        })
        .catch(() => {
          interaction.followUp({ content: '⏰ | Timed out. Please try again.', ephemeral: true });
        });
      return;
    }

    // To edit title, description, footer, thumbnail, image, color, we prompt user to reply with new content

    const editFields = {
      edit_title: 'Please send the new **Title** text (max 256 characters).',
      edit_description: 'Please send the new **Description** text.',
      edit_footer: 'Please send the new **Footer** text.',
      edit_thumbnail: 'Please send the new **Thumbnail** URL (must be an image URL).',
      edit_image: 'Please send the new **Image** URL (must be an image URL).',
      edit_color: 'Please send the new **Color** in HEX format (e.g. #00faff).',
    };

    if (Object.keys(editFields).includes(interaction.customId)) {
      await interaction.reply({ content: editFields[interaction.customId], ephemeral: true });

      const filter = m => m.author.id === interaction.user.id;
      interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
        .then(collected => {
          const input = collected.first().content.trim();

          switch (interaction.customId) {
            case 'edit_title':
              if (input.length > 256) return interaction.followUp({ content: `${crossIcon} | Title too long. Max 256 characters.`, ephemeral: true });
              data.title = input;
              break;
            case 'edit_description':
              data.description = input;
              break;
            case 'edit_footer':
              data.footer = input;
              break;
            case 'edit_thumbnail':
              if (!input.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return interaction.followUp({ content: `${crossIcon} | Invalid image URL.`, ephemeral: true });
              data.thumbnail = input;
              break;
            case 'edit_image':
              if (!input.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return interaction.followUp({ content: `${crossIcon} | Invalid image URL.`, ephemeral: true });
              data.image = input;
              break;
            case 'edit_color':
              if (!input.match(/^#([0-9A-F]{6})$/i)) return interaction.followUp({ content: `${crossIcon} | Invalid HEX color. Example: #00faff`, ephemeral: true });
              data.color = input;
              break;
          }

          saveDB(db);
          interaction.followUp({ content: `${tickIcon} | Updated successfully!`, ephemeral: true });
          updateSetupMessage();
        })
        .catch(() => {
          interaction.followUp({ content: '⏰ | Timed out. Please try again.', ephemeral: true });
        });

      return;
    }

    if (interaction.customId === 'test_welcome') {
      if (!data.channel) return interaction.reply({ content: `${crossIcon} | No welcome channel set.`, ephemeral: true });

      const channel = interaction.guild.channels.cache.get(data.channel);
      if (!channel) return interaction.reply({ content: `${crossIcon} | Channel not found.`, ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle(data.title)
        .setDescription(data.description)
        .setThumbnail(data.thumbnail)
        .setImage(data.image)
        .setFooter({ text: data.footer })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      return interaction.reply({ content: `${tickIcon} | Test welcome message sent.`, ephemeral: true });
    }
  }
};
