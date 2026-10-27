<p align="center">
  <img src="assets/wecordy.ico" width="128" height="128" alt="wecordy.js logo">
</p>

# wecordy.js

Wecordy platformu için geliştirilmiş, yüksek performanslı bot kütüphanesi.
TypeScript ekosisteminde kurumsal standartlarda, ölçeklenebilir ve güvenli botlar geliştirmenize olanak tanır.

[![NPM Version](https://img.shields.io/npm/v/@wecordy/core.svg?maxAge=3600)](https://www.npmjs.com/package/@wecordy/core)
[![Status](https://img.shields.io/badge/status-beta-yellow)](https://github.com/wecordy/wecordy.js)
[![License](https://img.shields.io/npm/l/@wecordy/core.svg?maxAge=3600)](https://github.com/wecordy/wecordy.js/blob/main/LICENSE)
[![Types](https://img.shields.io/npm/types/@wecordy/core.svg?maxAge=3600)](https://www.npmjs.com/package/@wecordy/core)

> [!IMPORTANT]
> Bu kütüphane şu anda **Beta** aşamasındadır. API yapısında geliştirmeler devam etmektedir; bu süreçte breaking change'ler (kırıcı değişiklikler) yaşanabilir.

## 🚀 Öne Çıkan Özellikler

- **Full TypeScript Desteği:** Güçlü tip tanımlamaları ve IntelliSense desteği.
- **Gelişmiş Mimari:** Manager ve Cache mimarisi ile optimize edilmiş veri yönetimi.
- **Dinamik Slash Komutları:** Dahili builder yapısı ile kolay komut kaydı ve yönetimi.
- **Gelişmiş Cache:** Sunucu, kanal, mesaj ve üye verileri için optimize edilmiş bellek yönetimi.
- **Sesli Kanal ve Müzik Desteği:** WebRTC tabanlı sesli bağlantı ve yt-dlp ile yüksek performanslı müzik yayını.
- **Event-Driven:** WebSocket tabanlı gerçek zamanlı olay yönetimi.

Wecordy.js, WebRTC kullanarak düşük gecikmeli ses iletimi sağlar. Hem YouTube üzerinden canlı yayın (streaming) hem de yerel WebM/Opus dosyalarını oynatmayı destekler.

### YouTube Desteği
YouTube üzerinden müzik çalmak için sisteminizde `yt-dlp` kurulu olmalıdır:

```bash
# macOS
brew install yt-dlp

# Windows (winget)
winget install yt-dlp

# Linux (Ubuntu/Debian)
sudo apt install yt-dlp
```

### Kod Örnekleri

```typescript
// YouTube üzerinden oynatma
const player = connection.playUrl('https://www.youtube.com/watch?v=...');

// Parça bittiğinde sıradakine geçmek için
player.on('finish', () => {
  // connection.playUrl(nextUrl);
});

// Yerel dosyadan oynatma (WebM/Opus)
connection.play('./music/song.webm');
```

## 📦 Kurulum

```bash
npm install @wecordy/core
# veya
yarn add @wecordy/core
```

## 📖 Hızlı Başlangıç

### Temel Bot Kurulumu

```typescript
import { Client, Events, GatewayIntentBits } from '@wecordy/core';

const client = new Client({
  intents: [GatewayIntentBits.Servers, GatewayIntentBits.ServerMessages, GatewayIntentBits.MessageContent],
});

client.on(Events.ClientReady, (readyClient) => {
  console.log(`🚀 ${readyClient.user?.username} olarak başarıyla giriş yapıldı!`);
  console.log(`Sunucu sayısı: ${readyClient.servers.cache.size}`);
});

// Gelen mesajları dinleme
client.on(Events.MessageCreate, async (message) => {
  // Botun kendi mesajlarını görmezden gel
  if (message.isOwnMessage()) return;

  if (message.content === '!ping') {
    await message.reply('Pong! 🏓');
  }
});

client.login('YOUR_BOT_TOKEN');
```

### Slash Komutlarını Kullanma

```typescript
import { Client, Events, GatewayIntentBits, SlashCommandBuilder } from '@wecordy/core';

const client = new Client({ intents: [GatewayIntentBits.Servers] });

// Komut Tanımlama
const pingCommand = new SlashCommandBuilder().setName('ping').setDescription('Botun gecikme süresini ölçer');

const selamCommand = new SlashCommandBuilder()
  .setName('selam')
  .setDescription('Kullanıcıyı selamlar')
  .addStringOption((opt) => opt.setName('isim').setDescription('Kiminle selamlaşalım?').setRequired(true));

client.on(Events.ClientReady, async (readyClient) => {
  // Komutları global olarak kaydet
  await client.application?.commands.set([pingCommand, selamCommand]);
  console.log('Slash komutları hazır!');
});

// Interaction Handling
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const commandName = interaction.commandName();

  if (commandName === 'ping') {
    await interaction.reply('Pong! 🏓');
  }

  if (commandName === 'selam') {
    const isim = interaction.getString('isim', true);
    await interaction.reply(`Selam ${isim}!`);
  }
});

client.login('YOUR_BOT_TOKEN');
```

> [!NOTE]
> Wecordy API'sinde henüz interaction callback ve ephemeral yanıt desteği yoktur. `interaction.reply()`, komutun kullanıldığı kanala normal bir mesaj gönderir ve gönderilen mesajı döndürür. `editReply()` bu mesajı düzenler, `deferReply()` sonrası ilk `editReply()` ise yanıtı gönderir. Şu an yalnızca global komutlar desteklenir.

### Moderasyon ve Roller

```typescript
const server = client.servers.cache.get(serverId)!;

// Rol oluşturma (izinler bitfield ya da backend formatında verilebilir)
const role = await server.createRole({ name: 'Moderatör', color: '#5865F2', permissions: ['KickMembers', 'BanMembers'] });

// Üyeye rol verme / alma
const member = await client.members.fetch(server.id, userId);
await member.addRole(role.id);
await member.removeRole(role.id);

// Kick (süre dakika cinsindendir) ve ban
await member.kick(60);
await server.ban(userId);
await server.unban(userId);

// Mesaj sabitleme ve davet
await message.pin();
const invite = await server.createInvite();
console.log(invite.url());
```

## 🏗️ Mimari Yapı

`wecordy.js`, verimlilik ve ölçeklenebilirlik için katmanlı bir mimari kullanır:

| Bileşen        | Görevi                                                         |
| :------------- | :------------------------------------------------------------- |
| **Client**     | Ana kontrol merkezi ve event dispatcher.                       |
| **Managers**   | Varlıkların (Server, Channel vb.) yönetimi ve cache işlemleri. |
| **Structures** | API verilerinin zenginleştirilmiş nesne modelleri.             |
| **Collection** | Filtreleme ve arama desteği sunan gelişmiş Map yapısı.         |
| **REST/WS**    | API iletişimi ve WebSocket gateway yönetimi.                   |

## 📋 Temel Olaylar (Events)

| Event               | Tetiklenme Durumu                                   |
| :------------------ | :-------------------------------------------------- |
| `ClientReady`       | Bot giriş yapıp hazır olduğunda (oturum başına bir kez). |
| `MessageCreate`     | Herhangi bir kanalda mesaj gönderildiğinde.         |
| `InteractionCreate` | Bir Slash komutu kullanıldığında.                   |
| `ServerCreate`      | Bot yeni bir sunucuya katıldığında.                 |
| `ServerDelete`      | Sunucu silindiğinde ya da bot sunucudan çıkarıldığında. |
| `ServerMemberAdd`   | Bir kullanıcı sunucuya katıldığında.                |
| `ShardReady`        | Gateway bağlantısı her (yeniden) doğrulandığında.   |
| `Error`             | Kritik bir hata oluştuğunda (Bağlantı kopması vb.). |

## ⚙️ Yapılandırma

```typescript
const client = new Client({
  // "Servers" intent'i olmadan bot kanal mesajlarını ve sunucu olaylarını almaz
  intents: ['Servers', 'ServerMessages'],
  messageCacheMaxSize: 500, // bellekte tutulacak en fazla mesaj sayısı
  fetchServersOnLogin: true, // girişte botun bulunduğu sunucuları cache'e al
});
```

Geçersiz bir intent adı verilirse `Client` oluşturulurken `ValidationError` fırlatılır; gateway bilinmeyen intent'lerle bağlantıyı reddeder.

## 🔧 Gereksinimler

- **Node.js:** v18.0.0 or higher
- **TypeScript:** v5.0+ (opsiyonel ancak tavsiye edilir)
- **yt-dlp:** YouTube streaming için gereklidir

## 💡 Örnek Kullanım

Kütüphanenin tüm özelliklerini (müzik komutları dahil) içeren detaylı bir örnek için [example](example/index.ts) klasörüne göz atabilirsiniz.

## 📄 Lisans

Bu proje **MIT** lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına göz atın.

---

Developed with ❤️ by **Wecordy Team**
