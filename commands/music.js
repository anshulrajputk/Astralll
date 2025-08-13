const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus, 
  getVoiceConnection, 
  NoSubscriberBehavior 
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const yts = require('yt-search'); 

// Emojis
const tickIcon = '<:tick:1404612664038265006>';
const crossIcon = '<:cross:1404801104872738936>';
const musicIcon = '<:music:1404443059999080449>';

// Queue Map
const queue = new Map();

module.exports = {
  name: 'music',
  description: 'Music commands with premium Muzox style',
  
  run: async (client, message, args) => {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply(`${crossIcon} | You must be in a voice channel!`);

    let serverQueue = queue.get(message.guild.id);
    if (!serverQueue) {
      serverQueue = {
        voiceChannel,
        player: createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } }),
        songs: [],
        currentSong: null,
        message: null,
        paused: false
      };
      queue.set(message.guild.id, serverQueue);

      // Join VC
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
      });
      serverQueue.connection = connection;
      connection.subscribe(serverQueue.player);
    }

    const command = args[0]?.toLowerCase();
    if (!command) return message.reply('Commands: `join`, `play <name/url>`, `skip`, `stop`, `queue`');

    if (command === 'join') return message.channel.send(`${tickIcon} | Joined ${voiceChannel.name}`);

    if (command === 'play') {
      if (!args[1]) return message.reply(`${crossIcon} | Provide a song name or YouTube link!`);
      const search = args.slice(1).join(' ');

      let songInfo;
      if (ytdl.validateURL(search)) {
        const info = await ytdl.getInfo(search);
        songInfo = { title: info.videoDetails.title, url: info.videoDetails.video_url, duration: parseInt(info.videoDetails.lengthSeconds) };
      } else {
        const results = await yts(search);
        if (!results || !results.videos.length) return message.reply(`${crossIcon} | No results found!`);
        const video = results.videos[0];
        songInfo = { title: video.title, url: video.url, duration: video.seconds };
      }

      serverQueue.songs.push(songInfo);

      if (!serverQueue.currentSong) {
        playSong(message.guild.id, message.channel);
      } else {
        message.channel.send(`${tickIcon} | Added **${songInfo.title}** to the queue.`);
      }
    }

    if (command === 'skip') {
      if (!serverQueue.currentSong) return message.reply(`${crossIcon} | No song is playing.`);
      serverQueue.player.stop();
      message.channel.send(`${tickIcon} | Skipped the current song.`);
    }

    if (command === 'stop') {
      if (!serverQueue.currentSong) return message.reply(`${crossIcon} | No song is playing.`);
      serverQueue.songs = [];
      serverQueue.player.stop();
      serverQueue.connection.destroy();
      queue.delete(message.guild.id);
      message.channel.send(`${crossIcon} | Stopped the music and left the channel.`);
    }

    if (command === 'queue') {
      if (!serverQueue.currentSong && serverQueue.songs.length === 0) return message.reply(`${crossIcon} | The queue is empty.`);
      const upcoming = serverQueue.songs.map((s, i) => `${i + 1}. [${s.title}](${s.url}) - \`${formatTime(s.duration)}\``).join('\n') || 'No upcoming songs';
      const embed = new EmbedBuilder()
        .setColor('#00faff')
        .setTitle(`${musicIcon} Music Queue`)
        .setDescription(`**Now Playing:** ${serverQueue.currentSong ? `[${serverQueue.currentSong.title}](${serverQueue.currentSong.url})` : 'Nothing'}\n\n**Up Next:**\n${upcoming}`);
      return message.channel.send({ embeds: [embed] });
    }
  }
};

// Play function with premium Muzox-style embed, buttons, and queue display
async function playSong(guildId, textChannel) {
  const serverQueue = queue.get(guildId);
  if (!serverQueue) return;

  const song = serverQueue.songs.shift();
  if (!song) {
    serverQueue.connection.destroy();
    queue.delete(guildId);
    return textChannel.send(`${crossIcon} | Queue ended. Leaving the voice channel.`);
  }

  serverQueue.currentSong = song;
  const resource = createAudioResource(ytdl(song.url, { filter: 'audioonly' }));
  serverQueue.player.play(resource);

  // Embed
  const upcoming = serverQueue.songs.map((s, i) => `${i + 1}. ${s.title}`).join('\n') || 'No upcoming songs';
  const embed = new EmbedBuilder()
    .setColor('#00faff')
    .setTitle(`${musicIcon} Now Playing`)
    .setDescription(`**${song.title}**\n${createProgressBar(0, song.duration)} \`0:00 / ${formatTime(song.duration)}\`\n\n**Up Next:**\n${upcoming}`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('pause_resume').setLabel('⏯').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('skip').setLabel('⏭').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('stop').setLabel('⏹').setStyle(ButtonStyle.Danger)
  );

  serverQueue.message = await textChannel.send({ embeds: [embed], components: [row] });

  let currentSeconds = 0;
  const interval = setInterval(() => {
    if (!serverQueue.player || serverQueue.player.state.status !== AudioPlayerStatus.Playing) return clearInterval(interval);
    currentSeconds += 5;
    if (currentSeconds > song.duration) return clearInterval(interval);

    embed.setDescription(`**${song.title}**\n${createProgressBar(currentSeconds, song.duration)} \`${formatTime(currentSeconds)} / ${formatTime(song.duration)}\`\n\n**Up Next:**\n${upcoming}`);
    serverQueue.message.edit({ embeds: [embed] });
  }, 5000);

  // Button collector
  const collector = serverQueue.message.createMessageComponentCollector({ time: song.duration * 1000 });
  collector.on('collect', async i => {
    if (!i.member.voice.channel) return i.reply({ content: `${crossIcon} | You must be in a voice channel!`, ephemeral: true });

    if (i.customId === 'pause_resume') {
      if (serverQueue.paused) {
        serverQueue.player.unpause();
        serverQueue.paused = false;
        i.update({ content: `${tickIcon} | Resumed.`, components: row, embeds: [embed] });
      } else {
        serverQueue.player.pause();
        serverQueue.paused = true;
        i.update({ content: `${crossIcon} | Paused.`, components: row, embeds: [embed] });
      }
    }

    if (i.customId === 'skip') {
      serverQueue.player.stop();
      i.update({ content: `${tickIcon} | Skipped.`, components: row, embeds: [embed] });
    }

    if (i.customId === 'stop') {
      serverQueue.songs = [];
      serverQueue.player.stop();
      serverQueue.connection.destroy();
      queue.delete(guildId);
      i.update({ content: `${crossIcon} | Stopped.`, components: [], embeds: [embed] });
    }
  });

  serverQueue.player.on(AudioPlayerStatus.Idle, () => {
    clearInterval(interval);
    serverQueue.currentSong = null;
    playSong(guildId, textChannel);
  });

  serverQueue.player.on('error', error => {
    console.error(error);
    textChannel.send(`${crossIcon} | Error playing song.`);
    clearInterval(interval);
    serverQueue.currentSong = null;
    playSong(guildId, textChannel);
  });
}

// Helpers
function createProgressBar(current, total, size = 20) {
  const progress = Math.round((current / total) * size);
  const empty = size - progress;
  return '▬'.repeat(progress) + '🔘' + '▬'.repeat(empty);
}

function formatTime(sec) {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2,'0')}`;
                 }
