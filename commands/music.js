const { 
  Client, 
  GatewayIntentBits, 
  Partials,
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
  NoSubscriberBehavior 
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const yts = require('yt-search'); 
require('dotenv').config();

// Emojis
const tickIcon = '<:tick:1404612664038265006>';
const crossIcon = '<:cross:1404801104872738936>';
const musicIcon = '<:music:1404443059999080449>';

// Queue Map
const queue = new Map();

// --- Discord Client ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, 
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// --- Ready ---
client.once('ready', () => {
  console.log(`${client.user.tag} is online!`);
});

// --- Message Handler ---
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const PREFIX = '!';
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  let serverQueue = queue.get(message.guild.id);

  // --- PLAY ---
  if (command === 'play') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply(`${crossIcon} | You must be in a voice channel!`);

    if (!serverQueue) {
      serverQueue = {
        voiceChannel,
        player: createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } }),
        connection: null,
        songs: [],
        currentSong: null,
        message: null,
        paused: false
      };
      queue.set(message.guild.id, serverQueue);

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
      });
      serverQueue.connection = connection;
      connection.subscribe(serverQueue.player);
    }

    if (!args[0]) return message.reply(`${crossIcon} | Provide a song name or URL!`);
    const search = args.join(' ');
    let songInfo;

    try {
      if (ytdl.validateURL(search)) {
        const info = await ytdl.getInfo(search);
        songInfo = { title: info.videoDetails.title, url: info.videoDetails.video_url, duration: parseInt(info.videoDetails.lengthSeconds) };
      } else {
        const results = await yts(search);
        if (!results || !results.videos.length) return message.reply(`${crossIcon} | No results found!`);
        const video = results.videos[0];
        songInfo = { title: video.title, url: video.url, duration: video.seconds };
      }
    } catch (err) {
      return message.reply(`${crossIcon} | Error fetching the song: ${err.message}`);
    }

    serverQueue.songs.push(songInfo);
    if (!serverQueue.currentSong) playSong(message.guild.id, message.channel);
    else message.channel.send(`${tickIcon} | Added **${songInfo.title}** to the queue.`);
  }

  // --- SKIP ---
  if (command === 'skip') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply(`${crossIcon} | You must be in a voice channel!`);
    if (!serverQueue || !serverQueue.currentSong) return message.reply(`${crossIcon} | No song is playing.`);
    serverQueue.player.stop();
    message.channel.send(`${tickIcon} | Skipped the current song.`);
  }

  // --- STOP ---
  if (command === 'stop') {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply(`${crossIcon} | You must be in a voice channel!`);
    if (!serverQueue || !serverQueue.currentSong) return message.reply(`${crossIcon} | No song is playing.`);
    serverQueue.songs = [];
    serverQueue.player.stop();
    if (serverQueue.connection) serverQueue.connection.destroy();
    queue.delete(message.guild.id);
    message.channel.send(`${crossIcon} | Stopped the music and left the channel.`);
  }

  // --- QUEUE ---
  if (command === 'queue') {
    if (!serverQueue || (!serverQueue.currentSong && serverQueue.songs.length === 0)) return message.reply(`${crossIcon} | The queue is empty.`);
    const upcoming = serverQueue.songs.map((s, i) => `${i+1}. [${s.title}](${s.url}) - \`${formatTime(s.duration)}\``).join('\n') || 'No upcoming songs';
    const embed = new EmbedBuilder()
      .setColor('#00faff')
      .setTitle(`${musicIcon} Music Queue`)
      .setDescription(`**Now Playing:** ${serverQueue.currentSong ? `[${serverQueue.currentSong.title}](${serverQueue.currentSong.url})` : 'Nothing'}\n\n**Up Next:**\n${upcoming}`);
    return message.channel.send({ embeds: [embed] });
  }
});

// --- Play Function ---
async function playSong(guildId, textChannel) {
  const serverQueue = queue.get(guildId);
  if (!serverQueue) return;

  const song = serverQueue.songs.shift();
  if (!song) {
    if (serverQueue.connection) serverQueue.connection.destroy();
    queue.delete(guildId);
    return textChannel.send(`${crossIcon} | Queue ended. Leaving the voice channel.`);
  }

  serverQueue.currentSong = song;

  let resource;
  try {
    resource = createAudioResource(ytdl(song.url, { filter: 'audioonly', highWaterMark: 1<<25 }));
  } catch (err) {
    console.error(err);
    return textChannel.send(`${crossIcon} | Failed to play song: ${err.message}`);
  }

  serverQueue.player.play(resource);

  const upcoming = serverQueue.songs.map((s,i)=>`${i+1}. ${s.title}`).join('\n') || 'No upcoming songs';
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

  const collector = serverQueue.message.createMessageComponentCollector({ time: song.duration*1000 });
  collector.on('collect', async i => {
    if (!i.member.voice.channel) return i.reply({ content: `${crossIcon} | You must be in a voice channel!`, ephemeral: true });

    if (i.customId === 'pause_resume') {
      if (serverQueue.paused) { 
        serverQueue.player.unpause(); 
        serverQueue.paused=false; 
        i.update({ content:`${tickIcon} | Resumed`, embeds:[embed], components:[row] }); 
      } else { 
        serverQueue.player.pause(); 
        serverQueue.paused=true; 
        i.update({ content:`${crossIcon} | Paused`, embeds:[embed], components:[row] }); 
      }
    }
    if (i.customId==='skip') {
      serverQueue.player.stop(); 
      i.update({ content:`${tickIcon} | Skipped`, embeds:[embed], components:[row] });
    }
    if (i.customId==='stop') {
      serverQueue.songs=[]; 
      serverQueue.player.stop(); 
      if (serverQueue.connection) serverQueue.connection.destroy(); 
      queue.delete(guildId); 
      i.update({ content:`${crossIcon} | Stopped`, embeds:[embed], components:[] });
    }
  });

  let currentSeconds=0;
  const interval = setInterval(()=>{
    if(!serverQueue.player || serverQueue.player.state.status!==AudioPlayerStatus.Playing) return clearInterval(interval);
    currentSeconds+=5;
    if(currentSeconds>song.duration) return clearInterval(interval);
    embed.setDescription(`**${song.title}**\n${createProgressBar(currentSeconds, song.duration)} \`${formatTime(currentSeconds)} / ${formatTime(song.duration)}\`\n\n**Up Next:**\n${upcoming}`);
    serverQueue.message.edit({ embeds:[embed] });
  },5000);

  serverQueue.player.on(AudioPlayerStatus.Idle, ()=>{
    clearInterval(interval); 
    serverQueue.currentSong=null; 
    playSong(guildId, textChannel);
  });

  serverQueue.player.on('error', error=>{
    console.error(error); 
    clearInterval(interval); 
    serverQueue.currentSong=null; 
    playSong(guildId, textChannel);
  });
}

// --- Helpers ---
function createProgressBar(current,total,size=20){
  const progress=Math.round(Math.min(current,total)/total*size);
  const empty=size-progress;
  return '▬'.repeat(progress)+'🔘'+'▬'.repeat(empty);
}
function formatTime(sec){
  const minutes=Math.floor(sec/60);
  const seconds=sec%60; 
  return `${minutes}:${seconds.toString().padStart(2,'0')}`;
}

// --- Login ---
client.login(process.env.TOKEN);
