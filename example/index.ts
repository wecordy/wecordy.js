import { Client, Events, GatewayIntentBits, SlashCommandBuilder } from '@wecordy/core';

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

  const serverName = message.server?.name || 'DM';
  console.log(`📩 Yeni mesaj: [${serverName}] - ${message.user?.username}: ${message.content}`);

  if (message.content === '!ping') {
    const start = Date.now();
    const reply = await message.reply('Pong! 🏓');
    const latency = Date.now() - start;
    await reply.edit(`Pong! 🏓 (${latency}ms)`);
  }

  if (message.content === '!sunucu') {
    if (message.serverId) {
      const server = await client.servers.fetch(message.serverId);
      await message.reply(`Bu sunucu: **${server.name}**`);
    } else {
      await message.reply('Bu komut sadece sunucularda çalışır.');
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
