const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType 
} = require('discord.js');
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
    const statusText = data.status ? `${enabledIcon} Enabled` : `${disabledIcon} Disabled`;
    const channelText = data.channel ? `<#${data.channel}>` : 'Not set';
    const thumbnailStatus = data.thumbnailEnabled ? 'Shown' : 'Hidden';

    const setupEmbed = new EmbedBuilder()
      .setColor(data.color)
      .setTitle('Welcome System Setup')
      .setDescription(`**Channel:** ${channelText}\n**Status:** ${statusText}\n**Thumbnail:** ${thumbnailStatus}\n\n${data.description}`)
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

    const updateSetupMessage = async () => {
      const statusText = data.status ? `${enabledIcon} Enabled` : `${disabledIcon} Disabled`;
      const channelText = data.channel ? `<#${data.channel}>` : 'Not set';
      const thumbnailStatus = data.thumbnailEnabled ? 'Shown' : 'Hidden';

      const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle('Welcome System Setup')
        .setDescription(`**Channel:** ${channelText}\n**Status:** ${statusText}\n**Thumbnail:** ${thumbnailStatus}\n\n${data.description}`)
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

      try { await interaction.message.edit({ embeds: [embed], components: [row1, row2, row3, row4] }); } 
      catch (err) { console.error('Failed to update setup message:', err); }
    };

    // BUTTON HANDLERS
    if (interaction.customId === 'toggle_status') {
      data.status = !data.status;
      saveDB(db);
      await interaction.reply({ content: `${data.status ? tickIcon : crossIcon} | Welcome system is now **${data.status ? 'enabled' : 'disabled'}**.`, ephemeral: true });
      return updateSetupMessage();
    }

    if (interaction.customId === 'toggle_thumbnail') {
      data.thumbnailEnabled = !data.thumbnailEnabled;
      saveDB(db);
      await interaction.reply({ content: `${tickIcon} | Thumbnail is now **${data.thumbnailEnabled ? 'shown' : 'hidden'}**.`, ephemeral: true });
      return updateSetupMessage();
    }

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

    // DIRECT EDIT PROMPTS
    const editMap = {
      edit_title: 'title',
      edit_description: 'description',
      edit_footer: 'footer',
      edit_thumbnail: 'thumbnail',
      edit_image: 'image',
      edit_color: 'color'
    };

    if (editMap[interaction.customId]) {
      await interaction.reply({ content: `Type the new ${editMap[interaction.customId]} in chat.`, ephemeral: true });

      const filter = m => m.author.id === interaction.user.id;
      interaction.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] })
        .then(collected => {
          const input = collected.first().content.trim();

          if (interaction.customId === 'edit_color' && !/^#([0-9A-F]{6})$/i.test(input)) return interaction.followUp({ content: 'Invalid HEX! Use #00faff', ephemeral: true });
          if ((interaction.customId === 'edit_thumbnail' || interaction.customId === 'edit_image') && !input.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return interaction.followUp({ content: 'Invalid image URL!', ephemeral: true });

          data[editMap[interaction.customId]] = input;
          saveDB(db);
          interaction.followUp({ content: `${tickIcon} | Updated successfully!`, ephemeral: true });
          updateSetupMessage();
        })
        .catch(() => interaction.followUp({ content: '⏰ | Timed out.', ephemeral: true }));

      return;
    }

    // TEST WELCOME
    if (interaction.customId === 'test_welcome') {
      const channel = interaction.guild.channels.cache.get(data.channel);
      if (!channel) return interaction.reply({ content: `${crossIcon} | Channel not set.`, ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(data.color)
        .setTitle(data.title)
        .setDescription(data.description)
        .setThumbnail(data.thumbnailEnabled ? data.thumbnail : null)
        .setImage(data.image)
        .setFooter({ text: data.footer })
        .setTimestamp();

      channel.send({ embeds: [embed] });
      return interaction.reply({ content: `${tickIcon} | Test welcome sent.`, ephemeral: true });
    }
  }
};
