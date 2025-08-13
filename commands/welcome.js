const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ChannelType, 
  InteractionType 
} = require('discord.js');
const { loadDB, saveDB } = require('../utils/db');

// Icons
const enabledIcon = '<a:Dot:1404991890784256050>';
const disabledIcon = '<a:red_point:1404991936657358999>';
const tickIcon = '<:tick:1404612664038265006>';
const crossIcon = '<:cross:1404801104872738936>';

module.exports = {
  name: 'welcome',
  description: 'Setup welcome system',

  run: async (client, message) => {
    const db = loadDB();
    const guildId = message.guild.id;

    if (!db[guildId]) db[guildId] = {
      status: false,
      channel: null,
      title: 'Welcome!',
      description: 'Enjoy your stay!',
      footer: message.guild.name,
      thumbnail: message.guild.iconURL({ dynamic: true }),
      thumbnailEnabled: true,
      image: null,
      color: '#00faff'
    };
    saveDB(db);

    const data = db[guildId];
    const setupEmbed = new EmbedBuilder()
      .setColor(data.color)
      .setTitle('Welcome System Setup')
      .setDescription(
        `**Channel:** ${data.channel ? `<#${data.channel}>` : 'Not set'}\n` +
        `**Status:** ${data.status ? enabledIcon + ' Enabled' : disabledIcon + ' Disabled'}\n` +
        `**Thumbnail:** ${data.thumbnailEnabled ? 'Shown' : 'Hidden'}\n\n` +
        `${data.description}`
      )
      .setThumbnail(data.thumbnailEnabled ? data.thumbnail : null)
      .setFooter({ text: data.footer })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('set_channel').setLabel('Set Channel').setStyle(ButtonStyle.Secondary).setEmoji('📺'),
      new ButtonBuilder().setCustomId('toggle_status').setLabel(data.status ? 'Disable' : 'Enable').setStyle(data.status ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder().setCustomId('toggle_thumbnail').setLabel(data.thumbnailEnabled ? 'Hide Thumbnail' : 'Show Thumbnail').setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('edit_title').setLabel('Edit Title').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('edit_description').setLabel('Edit Description').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('edit_footer').setLabel('Edit Footer').setStyle(ButtonStyle.Primary)
    );

    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('edit_thumbnail').setLabel('Edit Thumbnail URL').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('edit_image').setLabel('Edit Image URL').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('edit_color').setLabel('Edit Color HEX').setStyle(ButtonStyle.Primary)
    );

    const row4 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('test_welcome').setLabel('Test Welcome').setStyle(ButtonStyle.Success)
    );

    await message.channel.send({ embeds: [setupEmbed], components: [row1, row2, row3, row4] });
  },

  buttons: async (client, interaction) => {
    if (!interaction.guild) return;
    const db = loadDB();
    const guildId = interaction.guild.id;
    if (!db[guildId]) return interaction.reply({ content: 'Database not found. Run setup again.', ephemeral: true });

    const data = db[guildId];

    // Function to refresh setup embed
    const updateSetupMessage = async () => {
      const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle('Welcome System Setup')
        .setDescription(
          `**Channel:** ${data.channel ? `<#${data.channel}>` : 'Not set'}\n` +
          `**Status:** ${data.status ? enabledIcon + ' Enabled' : disabledIcon + ' Disabled'}\n` +
          `**Thumbnail:** ${data.thumbnailEnabled ? 'Shown' : 'Hidden'}\n\n` +
          `${data.description}`
        )
        .setThumbnail(data.thumbnailEnabled ? data.thumbnail : null)
        .setFooter({ text: data.footer })
        .setImage(data.image)
        .setTimestamp();

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('set_channel').setLabel('Set Channel').setStyle(ButtonStyle.Secondary).setEmoji('📺'),
        new ButtonBuilder().setCustomId('toggle_status').setLabel(data.status ? 'Disable' : 'Enable').setStyle(data.status ? ButtonStyle.Danger : ButtonStyle.Success),
        new ButtonBuilder().setCustomId('toggle_thumbnail').setLabel(data.thumbnailEnabled ? 'Hide Thumbnail' : 'Show Thumbnail').setStyle(ButtonStyle.Primary)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('edit_title').setLabel('Edit Title').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('edit_description').setLabel('Edit Description').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('edit_footer').setLabel('Edit Footer').setStyle(ButtonStyle.Primary)
      );

      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('edit_thumbnail').setLabel('Edit Thumbnail URL').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('edit_image').setLabel('Edit Image URL').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('edit_color').setLabel('Edit Color HEX').setStyle(ButtonStyle.Primary)
      );

      const row4 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('test_welcome').setLabel('Test Welcome').setStyle(ButtonStyle.Success)
      );

      try { await interaction.message.edit({ embeds: [embed], components: [row1, row2, row3, row4] }); } 
      catch (err) { console.error('Failed to update setup message:', err); }
    };

    // Toggle status
    if (interaction.customId === 'toggle_status') {
      data.status = !data.status;
      saveDB(db);
      await interaction.reply({ content: `${data.status ? enabledIcon : disabledIcon} | Welcome system is now **${data.status ? 'enabled' : 'disabled'}**.`, ephemeral: true });
      return updateSetupMessage();
    }

    // Toggle thumbnail
    if (interaction.customId === 'toggle_thumbnail') {
      data.thumbnailEnabled = !data.thumbnailEnabled;
      saveDB(db);
      await interaction.reply({ content: `${tickIcon} | Thumbnail is now **${data.thumbnailEnabled ? 'shown' : 'hidden'}**.`, ephemeral: true });
      return updateSetupMessage();
    }

    // Set channel
    if (interaction.customId === 'set_channel') {
      await interaction.reply({ content: '📺 | Mention the channel for welcome messages.', ephemeral: true });
      const filter = m => m.author.id === interaction.user.id && m.mentions.channels.first();
      interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
        .then(collected => {
          const channel = collected.first().mentions.channels.first();
          if (!channel || channel.type !== ChannelType.GuildText) return interaction.followUp({ content: `${crossIcon} | Invalid channel.`, ephemeral: true });
          data.channel = channel.id;
          saveDB(db);
          interaction.followUp({ content: `${tickIcon} | Welcome channel set to ${channel}`, ephemeral: true });
          updateSetupMessage();
        })
        .catch(() => interaction.followUp({ content: '⏰ | Timed out. Try again.', ephemeral: true }));
      return;
    }

    // Modal fields mapping
    const modalFields = {
      edit_title: { label: 'New Welcome Title', placeholder: 'Enter title', maxLength: 256 },
      edit_description: { label: 'New Welcome Description', placeholder: 'Enter description', maxLength: 4000 },
      edit_footer: { label: 'New Footer Text', placeholder: 'Enter footer', maxLength: 2048 },
      edit_thumbnail: { label: 'Thumbnail URL', placeholder: 'https://image.png', maxLength: 1000 },
      edit_image: { label: 'Image URL', placeholder: 'https://image.png', maxLength: 1000 },
      edit_color: { label: 'Embed Color HEX', placeholder: '#00faff', maxLength: 7 },
    };

    // Show modal
    if (modalFields[interaction.customId]) {
      const field = modalFields[interaction.customId];
      const modal = new ModalBuilder().setCustomId(interaction.customId).setTitle(`Edit ${field.label}`);
      const input = new TextInputBuilder().setCustomId('input').setLabel(field.label).setStyle(TextInputStyle.Short).setPlaceholder(field.placeholder).setRequired(true).setMaxLength(field.maxLength);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    // Modal submit
    if (interaction.type === InteractionType.ModalSubmit) {
      const id = interaction.customId;
      if (!modalFields[id]) return;
      const input = interaction.fields.getTextInputValue('input').trim();

      if (id === 'edit_color') {
        if (!/^#([0-9A-F]{6})$/i.test(input)) return interaction.reply({ content: 'Invalid HEX!', ephemeral: true });
        data.color = input;
      } else if (id === 'edit_thumbnail' || id === 'edit_image') {
        if (!input.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return interaction.reply({ content: 'Invalid image URL!', ephemeral: true });
        if (id === 'edit_thumbnail') data.thumbnail = input; else data.image = input;
      } else if (id === 'edit_title') data.title = input;
      else if (id === 'edit_description') data.description = input;
      else if (id === 'edit_footer') data.footer = input;

      saveDB(db);
      await interaction.reply({ content: '✅ Updated successfully!', ephemeral: true });
      return updateSetupMessage();
    }

    // Test welcome
    if (interaction.customId === 'test_welcome') {
      if (!data.channel) return interaction.reply({ content: `${crossIcon} | No channel set!`, ephemeral: true });
      const channel = interaction.guild.channels.cache.get(data.channel);
      if (!channel) return interaction.reply({ content: `${crossIcon} | Channel not found!`, ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle(data.title)
        .setDescription(data.description)
        .setThumbnail(data.thumbnailEnabled ? data.thumbnail : null)
        .setImage(data.image)
        .setFooter({ text: data.footer })
        .setTimestamp();

      await channel.send({ embeds: [embed] });
      return interaction.reply({ content: `${tickIcon} | Test welcome sent!`, ephemeral: true });
    }
  }
};
