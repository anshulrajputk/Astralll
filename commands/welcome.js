const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType
} = require('discord.js');
const { loadDB, saveDB } = require('../utils/db');

const enabledIcon = '<a:Dot:1404991890784256050>';
const disabledIcon = '<a:red_point:1404991936657358999>';
const tickIcon = '<:tick:1404612664038265006>';
const crossIcon = '<:cross:1404801104872738936>';

function getStatusText(status) {
  return status ? `${enabledIcon} Enabled` : `${disabledIcon} Disabled`;
}

function colorFromHex(hex) {
  if (!hex) return 0x2B2D31; // default color
  if (hex.startsWith('#')) hex = hex.slice(1);
  return parseInt(hex, 16);
}

module.exports = {
  name: 'welcome',
  description: 'Setup welcome system',

  run: async (client, message) => {
    let db = loadDB();
    let guildId = message.guild.id;

    if (!db[guildId]) {
      db[guildId] = {
        status: false,
        channel: null,
        embed: {
          title: 'Welcome to the server!',
          description: 'Have a great time here!',
          footer: message.guild.name,
          thumbnail: null,
          image: null,
          color: '#00faff',
        }
      };
      saveDB(db);
    }

    const guildData = db[guildId];

    const embed = new EmbedBuilder()
      .setColor(colorFromHex(guildData.embed.color))
      .setTitle(guildData.embed.title || 'Welcome!')
      .setDescription(guildData.embed.description || '')
      .setFooter({ text: guildData.embed.footer || message.guild.name })
      .setTimestamp();

    if (guildData.embed.thumbnail) {
      embed.setThumbnail(guildData.embed.thumbnail);
    }
    if (guildData.embed.image) {
      embed.setImage(guildData.embed.image);
    }

    const statusText = getStatusText(guildData.status);
    const channelText = guildData.channel ? `<#${guildData.channel}>` : 'Not set';

    const mainEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Welcome System Setup')
      .setDescription(
        `**Status:** ${statusText}\n` +
        `**Channel:** ${channelText}\n\n` +
        `**Embed Preview:**`
      )
      .addFields(
        { name: 'Title', value: guildData.embed.title || 'Not set', inline: true },
        { name: 'Description', value: guildData.embed.description || 'Not set', inline: true },
        { name: 'Footer', value: guildData.embed.footer || 'Not set', inline: true },
        { name: 'Thumbnail', value: guildData.embed.thumbnail || 'Not set', inline: true },
        { name: 'Image', value: guildData.embed.image || 'Not set', inline: true },
        { name: 'Color', value: guildData.embed.color || 'Not set', inline: true }
      )
      .setTimestamp();

    const previewEmbed = embed;

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('toggle_status').setLabel(guildData.status ? 'Disable Welcome' : 'Enable Welcome').setStyle(guildData.status ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder().setCustomId('set_channel').setLabel('Set Channel').setStyle(ButtonStyle.Secondary).setEmoji('📺'),
      new ButtonBuilder().setCustomId('test_welcome').setLabel('Test Welcome').setStyle(ButtonStyle.Primary).setEmoji('🧪')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('edit_title').setLabel('Edit Title').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('edit_description').setLabel('Edit Description').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('edit_footer').setLabel('Edit Footer').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('edit_thumbnail').setLabel('Edit Thumbnail URL').setStyle(ButtonStyle.Primary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('edit_image').setLabel('Edit Image URL').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('edit_color').setLabel('Edit Color (Hex)').setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({ embeds: [mainEmbed, previewEmbed], components: [row1, row2, row3] });
  },

  buttons: async (client, interaction) => {
    let db = loadDB();
    let guildId = interaction.guild.id;

    if (!db[guildId]) {
      db[guildId] = {
        status: false,
        channel: null,
        embed: {
          title: 'Welcome to the server!',
          description: 'Have a great time here!',
          footer: interaction.guild.name,
          thumbnail: null,
          image: null,
          color: '#00faff',
        }
      };
    }
    let guildData = db[guildId];

    const updateSetupMessage = async () => {
      const embed = new EmbedBuilder()
        .setColor(colorFromHex(guildData.embed.color))
        .setTitle(guildData.embed.title || 'Welcome!')
        .setDescription(guildData.embed.description || '')
        .setFooter({ text: guildData.embed.footer || interaction.guild.name })
        .setTimestamp();

      if (guildData.embed.thumbnail) embed.setThumbnail(guildData.embed.thumbnail);
      if (guildData.embed.image) embed.setImage(guildData.embed.image);

      const statusText = getStatusText(guildData.status);
      const channelText = guildData.channel ? `<#${guildData.channel}>` : 'Not set';

      const mainEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Welcome System Setup')
        .setDescription(
          `**Status:** ${statusText}\n` +
          `**Channel:** ${channelText}\n\n` +
          `**Embed Preview:**`
        )
        .addFields(
          { name: 'Title', value: guildData.embed.title || 'Not set', inline: true },
          { name: 'Description', value: guildData.embed.description || 'Not set', inline: true },
          { name: 'Footer', value: guildData.embed.footer || 'Not set', inline: true },
          { name: 'Thumbnail', value: guildData.embed.thumbnail || 'Not set', inline: true },
          { name: 'Image', value: guildData.embed.image || 'Not set', inline: true },
          { name: 'Color', value: guildData.embed.color || 'Not set', inline: true }
        )
        .setTimestamp();

      const previewEmbed = embed;

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('toggle_status').setLabel(guildData.status ? 'Disable Welcome' : 'Enable Welcome').setStyle(guildData.status ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder().setCustomId('set_channel').setLabel('Set Channel').setStyle(ButtonStyle.Secondary).setEmoji('📺'),
        new ButtonBuilder().setCustomId('test_welcome').setLabel('Test Welcome').setStyle(ButtonStyle.Primary).setEmoji('🧪')
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('edit_title').setLabel('Edit Title').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('edit_description').setLabel('Edit Description').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('edit_footer').setLabel('Edit Footer').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('edit_thumbnail').setLabel('Edit Thumbnail URL').setStyle(ButtonStyle.Primary)
      );

      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('edit_image').setLabel('Edit Image URL').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('edit_color').setLabel('Edit Color (Hex)').setStyle(ButtonStyle.Primary)
      );

      try {
        await interaction.message.edit({ embeds: [mainEmbed, previewEmbed], components: [row1, row2, row3] });
      } catch (err) {
        console.error('Failed to update setup message:', err);
      }
    };

    // BUTTONS:

    if (interaction.customId === 'toggle_status') {
      guildData.status = !guildData.status;
      saveDB(db);

      await updateSetupMessage();
      return interaction.reply({ content: `${guildData.status ? tickIcon : crossIcon} Welcome system is now **${guildData.status ? 'enabled' : 'disabled'}**.`, ephemeral: true });
    }

    if (interaction.customId === 'set_channel') {
      await interaction.reply({ content: '📺 Please mention the channel where welcome messages will be sent.', ephemeral: true });

      const filter = m => m.author.id === interaction.user.id && m.mentions.channels.size > 0;
      try {
        const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
        const channel = collected.first().mentions.channels.first();
        if (!channel || channel.type !== ChannelType.GuildText) {
          return interaction.followUp({ content: `${crossIcon} That is not a valid text channel.`, ephemeral: true });
        }

        guildData.channel = channel.id;
        saveDB(db);

        await updateSetupMessage();

        return interaction.followUp({ content: `${tickIcon} Welcome channel set to ${channel}`, ephemeral: true });
      } catch {
        return interaction.followUp({ content: '⏰ You did not mention a channel in time.', ephemeral: true });
      }
    }

    if (interaction.customId === 'test_welcome') {
      if (!guildData.channel) return interaction.reply({ content: `${crossIcon} No welcome channel is set.`, ephemeral: true });
      const channel = interaction.guild.channels.cache.get(guildData.channel);
      if (!channel) return interaction.reply({ content: `${crossIcon} The welcome channel was not found.`, ephemeral: true });

      const welcomeEmbed = new EmbedBuilder()
        .setColor(colorFromHex(guildData.embed.color))
        .setTitle(guildData.embed.title || 'Welcome!')
        .setDescription(guildData.embed.description || '')
        .setFooter({ text: guildData.embed.footer || interaction.guild.name })
        .setTimestamp();

      if (guildData.embed.thumbnail) welcomeEmbed.setThumbnail(guildData.embed.thumbnail);
      if (guildData.embed.image) welcomeEmbed.setImage(guildData.embed.image);

      channel.send({ embeds: [welcomeEmbed] });
      return interaction.reply({ content: `${tickIcon} Test welcome message sent.`, ephemeral: true });
    }

    // Edit fields - open modals for input:

    if (interaction.customId.startsWith('edit_')) {
      const field = interaction.customId.replace('edit_', '');

      // Create modal for input
      const modal = new ModalBuilder()
        .setCustomId(`modal_${field}`)
        .setTitle(`Edit Welcome Embed ${field.charAt(0).toUpperCase() + field.slice(1)}`);

      // Text input
      const input = new TextInputBuilder()
        .setCustomId(`input_${field}`)
        .setLabel(`Enter new ${field}`)
        .setStyle(field === 'description' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(field === 'color' ? 7 : 1024) // color hex max length 7 e.g. #00ff00

      modal.addComponents(new ActionRowBuilder().addComponents(input));

      await interaction.showModal(modal);
      return;
    }
  },

  modals: async (client, interaction) => {
    // Handles modal submit interactions

    let db = loadDB();
    let guildId = interaction.guild.id;

    if (!db[guildId]) {
      db[guildId] = {
        status: false,
        channel: null,
        embed: {
          title: 'Welcome to the server!',
          description: 'Have a great time here!',
          footer: interaction.guild.name,
          thumbnail: null,
          image: null,
          color: '#00faff',
        }
      };
    }
    let guildData = db[guildId];

    if (!interaction.customId.startsWith('modal_')) return;

    const field = interaction.customId.replace('modal_', '');
    const value = interaction.fields.getTextInputValue(`input_${field}`);

    // Validate & save the input based on field
    switch (field) {
      case 'title':
      case 'description':
      case 'footer':
      case 'thumbnail':
      case 'image':
        guildData.embed[field] = value.trim();
        break;

      case 'color':
        if (!/^#?[0-9A-Fa-f]{6}$/.test(value.trim())) {
          return interaction.reply({ content: `${crossIcon} Invalid color hex! Use format #RRGGBB`, ephemeral: true });
        }
        guildData.embed.color = value.trim().startsWith('#') ? value.trim() : '#' + value.trim();
        break;

      default:
        return interaction.reply({ content: `${crossIcon} Unknown field!`, ephemeral: true });
    }

    saveDB(db);

    // Update the original setup message if possible:
    // You can’t always edit the original message from modal interaction,
    // so just reply success here

    return interaction.reply({ content: `${tickIcon} Welcome embed ${field} updated!`, ephemeral: true });
  }
};
