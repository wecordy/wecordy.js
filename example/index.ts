import { Client, Events, GatewayIntentBits, SlashCommandBuilder } from '@wecordy/core';
import * as path from 'path';

// Bot tokenini buraya yapıştırın veya ortam değişkeni kullanın
const TOKEN = 'TOKEN';

const client = new Client({
  intents: [GatewayIntentBits.Servers, GatewayIntentBits.ServerMessages, GatewayIntentBits.ServerMembers],
});

client.on(Events.ClientReady, async (readyClient) => {
  console.log(`🚀 ${readyClient.user?.username} olarak başarıyla giriş yapıldı!`);
  console.log(`Sunucu sayısı: ${readyClient.servers.cache.size}`);

  // Slash komutlarını tanımlayalım
  const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Botun gecikme süresini kontrol eder'),

    new SlashCommandBuilder().setName('sunucu').setDescription('Bulunulan sunucu hakkında bilgi verir'),

    new SlashCommandBuilder()
      .setName('merhaba')
      .setDescription('Seni selamlar')
      .addStringOption((option) => option.setName('isim').setDescription('Selamlanacak kişi').setRequired(false)),
  ];

  try {
    console.log('⏳ Slash komutları kaydediliyor...');
    await client.application!.commands.set(commands);
    console.log('✅ Slash komutları başarıyla kaydedildi!');
  } catch (error) {
    console.error('❌ Slash komutları kaydedilirken hata oluştu:', error);
  }
});

client.on(Events.MessageCreate, async (message) => {
  // Botun kendi mesajlarını görmezden gel
  if (message.isOwnMessage()) return;

  if (message.content?.startsWith('!play')) {
    try {
      const channel = await client.channels.fetch(message.channelId!);

      if (channel.isTextBased()) return;

      console.log(`Joining voice channel: ${channel?.name}`);
      const connection = await channel.join();

      // Check if a YouTube URL was provided
      const youtubeUrl = message.content.split(' ')[1];

      if (youtubeUrl) {
        await message.reply(`🎵 Streaming: ${youtubeUrl}`);
        connection.playUrl(youtubeUrl);
      } else {
        // Fallback: play local file
        const mp3Path = path.resolve(__dirname, 'test.webm');
        console.log(`Playing audio: ${mp3Path}`);
        connection?.play(mp3Path);
        await message.reply(`Joined ${channel.name} and started playing music!`);
      }
    } catch (err) {
      console.error('Failed to join voice channel:', err);
      await message.reply('Failed to join voice channel.');
    }
  }

  if (message.content === '!leave') {
    try {
      const channel = await client.channels.fetch(message.channelId!);

      console.log(`Leaving voice channel: ${channel?.name}`);

      if (channel.isTextBased()) return;

      await channel.leave();

      await message.reply(`Left ${channel.name}`);
    } catch (err) {
      console.error('Failed to leave voice channel:', err);
      await message.reply('Failed to leave voice channel.');
    }
  }

  if (message.content === '!pause') {
    const connection = client.voiceConnections.get(message.channelId!);
    if (connection) {
      connection.pause();
      await message.reply('⏸️ Paused.');
    }
  }

  if (message.content === '!resume') {
    const connection = client.voiceConnections.get(message.channelId!);
    if (connection) {
      connection.resume();
      await message.reply('▶️ Resumed.');
    }
  }

  if (message.content === '!stop') {
    const connection = client.voiceConnections.get(message.channelId!);
    if (connection) {
      connection.stopPlayer();
      await message.reply('⏹️ Stopped.');
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  console.log(interaction.data);
  if (!interaction.isCommand()) return;

  const commandName = interaction.commandName();
  console.log(`Command invoked: /${commandName} by ${interaction.user?.username}`);

  if (commandName === 'ping') {
    await interaction.reply('Pong! 🏓');
  }

  if (commandName === 'sunucu') {
    if (interaction.server) {
      await interaction.reply(`Sunucu: **${interaction.server.name}**\nID: ${interaction.serverId}`);
    } else {
      await interaction.reply('Bu komut sadece sunucularda çalışır.');
    }
  }

  if (commandName === 'merhaba') {
    const isim = interaction.getString('isim') || interaction.user?.username;
    await interaction.reply(`Merhaba ${isim}! Wecordy.js dünyasına hoş geldin.`);
  }
});

// Hata ayıklama
client.on(Events.Error, (error) => {
  console.error('❌ Bir hata oluştu:', error);
});

client.login(TOKEN).catch((err) => {
  console.error('🔑 Giriş yapılamadı. Tokeninizi kontrol edin:', err.message);
});
